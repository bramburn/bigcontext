/**
 * Test suite for Query Expansion and LLM Re-ranking functionality
 * 
 * This test suite verifies that the QueryExpansionService and LLMReRankingService
 * work correctly and integrate properly with the SearchManager.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { QueryExpansionService, ExpandedQuery } from '../../search/queryExpansionService';
import { LLMReRankingService, ReRankingResult } from '../../search/llmReRankingService';
import { ConfigService } from '../../configService';
import { CodeChunk, ChunkType } from '../../parsing/chunker';

suite('Query Expansion and Re-ranking Tests', () => {
    let configService: ConfigService;
    let queryExpansionService: QueryExpansionService;
    let llmReRankingService: LLMReRankingService;

    suiteSetup(() => {
        configService = new ConfigService();
        queryExpansionService = new QueryExpansionService(configService);
        llmReRankingService = new LLMReRankingService(configService);
    });

    suite('QueryExpansionService', () => {
        test('should initialize with correct default configuration', () => {
            const config = queryExpansionService.getConfig();
            
            assert.strictEqual(typeof config.enabled, 'boolean');
            assert.strictEqual(typeof config.maxExpandedTerms, 'number');
            assert.strictEqual(typeof config.confidenceThreshold, 'number');
            assert.ok(['openai', 'ollama'].includes(config.llmProvider));
            assert.strictEqual(typeof config.model, 'string');
            assert.strictEqual(typeof config.timeout, 'number');
            
            console.log('QueryExpansionService configuration:', config);
        });

        test('should return original query when expansion is disabled', async function() {
            this.timeout(5000);
            
            // Temporarily disable expansion
            queryExpansionService.updateConfig({ enabled: false });
            
            const query = 'authentication middleware';
            const result = await queryExpansionService.expandQuery(query);
            
            assert.strictEqual(result.originalQuery, query);
            assert.strictEqual(result.combinedQuery, query);
            assert.strictEqual(result.expandedTerms.length, 0);
            assert.strictEqual(result.confidence, 1.0);
            
            console.log('Disabled expansion result:', result);
        });

        test('should handle expansion gracefully when enabled but LLM unavailable', async function() {
            this.timeout(10000);
            
            // Enable expansion but use invalid configuration
            queryExpansionService.updateConfig({ 
                enabled: true,
                apiUrl: 'http://invalid-url:1234',
                timeout: 2000
            });
            
            const query = 'database connection';
            const result = await queryExpansionService.expandQuery(query);
            
            // Should fallback gracefully
            assert.strictEqual(result.originalQuery, query);
            assert.strictEqual(result.combinedQuery, query);
            assert.strictEqual(result.expandedTerms.length, 0);
            assert.ok(result.confidence < 1.0); // Lower confidence due to failure
            
            console.log('Fallback expansion result:', result);
        });

        test('should validate configuration updates', () => {
            const originalConfig = queryExpansionService.getConfig();
            
            queryExpansionService.updateConfig({
                maxExpandedTerms: 3,
                confidenceThreshold: 0.8
            });
            
            const updatedConfig = queryExpansionService.getConfig();
            assert.strictEqual(updatedConfig.maxExpandedTerms, 3);
            assert.strictEqual(updatedConfig.confidenceThreshold, 0.8);
            
            // Other properties should remain unchanged
            assert.strictEqual(updatedConfig.enabled, originalConfig.enabled);
            assert.strictEqual(updatedConfig.llmProvider, originalConfig.llmProvider);
        });
    });

    suite('LLMReRankingService', () => {
        test('should initialize with correct default configuration', () => {
            const config = llmReRankingService.getConfig();
            
            assert.strictEqual(typeof config.enabled, 'boolean');
            assert.strictEqual(typeof config.maxResultsToReRank, 'number');
            assert.strictEqual(typeof config.vectorScoreWeight, 'number');
            assert.strictEqual(typeof config.llmScoreWeight, 'number');
            assert.ok(['openai', 'ollama'].includes(config.llmProvider));
            assert.strictEqual(typeof config.model, 'string');
            assert.strictEqual(typeof config.timeout, 'number');
            assert.strictEqual(typeof config.includeExplanations, 'boolean');
            
            console.log('LLMReRankingService configuration:', config);
        });

        test('should return original results when re-ranking is disabled', async function() {
            this.timeout(5000);
            
            // Temporarily disable re-ranking
            llmReRankingService.updateConfig({ enabled: false });
            
            const query = 'user authentication';
            const mockResults = createMockSearchResults();
            
            const result = await llmReRankingService.reRankResults(query, mockResults);
            
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.query, query);
            assert.strictEqual(result.rankedResults.length, mockResults.length);
            assert.strictEqual(result.processedCount, mockResults.length);
            
            // Scores should remain unchanged
            result.rankedResults.forEach((rankedResult, index) => {
                assert.strictEqual(rankedResult.originalScore, mockResults[index].score);
                assert.strictEqual(rankedResult.llmScore, mockResults[index].score);
                assert.strictEqual(rankedResult.finalScore, mockResults[index].score);
            });
            
            console.log('Disabled re-ranking result:', result);
        });

        test('should handle re-ranking gracefully when enabled but LLM unavailable', async function() {
            this.timeout(10000);
            
            // Enable re-ranking but use invalid configuration
            llmReRankingService.updateConfig({ 
                enabled: true,
                apiUrl: 'http://invalid-url:1234',
                timeout: 2000
            });
            
            const query = 'error handling';
            const mockResults = createMockSearchResults();
            
            const result = await llmReRankingService.reRankResults(query, mockResults);
            
            // Should fallback gracefully
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.query, query);
            assert.strictEqual(result.rankedResults.length, mockResults.length);
            assert.strictEqual(result.processedCount, 0);
            
            console.log('Fallback re-ranking result:', result);
        });

        test('should validate score weight configuration', () => {
            llmReRankingService.updateConfig({
                vectorScoreWeight: 0.4,
                llmScoreWeight: 0.6
            });
            
            const config = llmReRankingService.getConfig();
            assert.strictEqual(config.vectorScoreWeight, 0.4);
            assert.strictEqual(config.llmScoreWeight, 0.6);
            
            // Weights should sum to 1.0 for proper scoring
            assert.strictEqual(config.vectorScoreWeight + config.llmScoreWeight, 1.0);
        });
    });

    suite('Integration Tests', () => {
        test('should work together in search pipeline', async function() {
            this.timeout(15000);
            
            // Test the complete pipeline with both services disabled
            queryExpansionService.updateConfig({ enabled: false });
            llmReRankingService.updateConfig({ enabled: false });
            
            const originalQuery = 'async function';
            const mockResults = createMockSearchResults();
            
            // Step 1: Query expansion
            const expandedQuery = await queryExpansionService.expandQuery(originalQuery);
            assert.strictEqual(expandedQuery.combinedQuery, originalQuery);
            
            // Step 2: Re-ranking
            const reRankedResults = await llmReRankingService.reRankResults(
                originalQuery, 
                mockResults
            );
            
            assert.strictEqual(reRankedResults.success, true);
            assert.strictEqual(reRankedResults.rankedResults.length, mockResults.length);
            
            console.log('Integration test completed successfully');
        });

        test('should handle configuration changes dynamically', () => {
            // Test that services respond to configuration updates
            const initialExpansionConfig = queryExpansionService.getConfig();
            const initialReRankingConfig = llmReRankingService.getConfig();
            
            // Update configurations
            queryExpansionService.updateConfig({ enabled: !initialExpansionConfig.enabled });
            llmReRankingService.updateConfig({ enabled: !initialReRankingConfig.enabled });
            
            // Verify changes
            assert.strictEqual(
                queryExpansionService.isEnabled(), 
                !initialExpansionConfig.enabled
            );
            assert.strictEqual(
                llmReRankingService.isEnabled(), 
                !initialReRankingConfig.enabled
            );
            
            // Restore original configurations
            queryExpansionService.updateConfig({ enabled: initialExpansionConfig.enabled });
            llmReRankingService.updateConfig({ enabled: initialReRankingConfig.enabled });
        });
    });
});

/**
 * Create mock search results for testing
 */
function createMockSearchResults(): Array<{ chunk: CodeChunk; score: number }> {
    return [
        {
            chunk: {
                content: 'async function authenticateUser(credentials) { /* implementation */ }',
                filePath: '/src/auth/authentication.ts',
                type: ChunkType.FUNCTION,
                startLine: 10,
                endLine: 20,
                language: 'typescript'
            },
            score: 0.9
        },
        {
            chunk: {
                content: 'function validateCredentials(username, password) { /* validation logic */ }',
                filePath: '/src/auth/validation.ts',
                type: ChunkType.FUNCTION,
                startLine: 5,
                endLine: 15,
                language: 'typescript'
            },
            score: 0.8
        },
        {
            chunk: {
                content: 'class UserManager { login(user) { /* login implementation */ } }',
                filePath: '/src/user/userManager.ts',
                type: ChunkType.CLASS,
                startLine: 1,
                endLine: 25,
                language: 'typescript'
            },
            score: 0.7
        }
    ];
}
