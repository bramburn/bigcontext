/**
 * Test suite for Query Expansion and LLM Re-ranking functionality
 *
 * This test suite verifies that the QueryExpansionService and LLMReRankingService
 * work correctly and integrate properly with the SearchManager. These services
 * enhance search quality by expanding user queries with related terms and
 * re-ranking results using large language models for better relevance.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { QueryExpansionService, ExpandedQuery } from '../../search/queryExpansionService';
import { LLMReRankingService, ReRankingResult } from '../../search/llmReRankingService';
import { ConfigService } from '../../configService';
import { CodeChunk, ChunkType } from '../../parsing/chunker';

describe('Query Expansion and Re-ranking Tests', () => {
  let configService: ConfigService;
  let queryExpansionService: QueryExpansionService;
  let llmReRankingService: LLMReRankingService;

  beforeAll(() => {
    // Initialize services for testing
    // This creates real instances with configuration for comprehensive testing
    configService = new ConfigService();
    queryExpansionService = new QueryExpansionService(configService);
    llmReRankingService = new LLMReRankingService(configService);
  });

  describe('QueryExpansionService', () => {
    test('should initialize with correct default configuration', () => {
      // Test that the QueryExpansionService initializes with proper configuration
      // This verifies that all required configuration properties are present and valid
      const config = queryExpansionService.getConfig();

      // Verify all configuration properties exist and have correct types
      assert.strictEqual(typeof config.enabled, 'boolean');
      assert.strictEqual(typeof config.maxExpandedTerms, 'number');
      assert.strictEqual(typeof config.confidenceThreshold, 'number');
      assert.ok(['openai', 'ollama'].includes(config.llmProvider));
      assert.strictEqual(typeof config.model, 'string');
      assert.strictEqual(typeof config.timeout, 'number');

      console.log('QueryExpansionService configuration:', config);
    });

    test('should return original query when expansion is disabled', async function () {
      // Test that the service returns the original query when expansion is disabled
      // This verifies the basic functionality when the feature is turned off

      // Temporarily disable expansion to test disabled behavior
      queryExpansionService.updateConfig({ enabled: false });

      const query = 'authentication middleware';
      const result = await queryExpansionService.expandQuery(query);

      // When disabled, the service should return the original query unchanged
      assert.strictEqual(result.originalQuery, query);
      assert.strictEqual(result.combinedQuery, query);
      assert.strictEqual(result.expandedTerms.length, 0);
      assert.strictEqual(result.confidence, 1.0);

      console.log('Disabled expansion result:', result);
    });

    test('should handle expansion gracefully when enabled but LLM unavailable', async function () {
      // Test that the service handles LLM unavailability gracefully
      // This verifies error handling when the LLM service is not accessible

      // Enable expansion but use invalid configuration to simulate LLM unavailability
      queryExpansionService.updateConfig({
        enabled: true,
        apiUrl: 'http://invalid-url:1234',
        timeout: 2000,
      });

      const query = 'database connection';
      const result = await queryExpansionService.expandQuery(query);

      // Should fallback gracefully to original query when LLM is unavailable
      assert.strictEqual(result.originalQuery, query);
      assert.strictEqual(result.combinedQuery, query);
      assert.strictEqual(result.expandedTerms.length, 0);
      assert.ok(result.confidence < 1.0); // Lower confidence due to failure

      console.log('Fallback expansion result:', result);
    });

    test('should validate configuration updates', () => {
      // Test that configuration updates are applied correctly
      // This verifies that the service can be reconfigured at runtime
      const originalConfig = queryExpansionService.getConfig();

      // Update specific configuration properties
      queryExpansionService.updateConfig({
        maxExpandedTerms: 3,
        confidenceThreshold: 0.8,
      });

      // Verify that the updated properties have the new values
      const updatedConfig = queryExpansionService.getConfig();
      assert.strictEqual(updatedConfig.maxExpandedTerms, 3);
      assert.strictEqual(updatedConfig.confidenceThreshold, 0.8);

      // Other properties should remain unchanged
      assert.strictEqual(updatedConfig.enabled, originalConfig.enabled);
      assert.strictEqual(updatedConfig.llmProvider, originalConfig.llmProvider);
    });
  });

  describe('LLMReRankingService', () => {
    test('should initialize with correct default configuration', () => {
      // Test that the LLMReRankingService initializes with proper configuration
      // This verifies that all required configuration properties are present and valid
      const config = llmReRankingService.getConfig();

      // Verify all configuration properties exist and have correct types
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

    test('should return original results when re-ranking is disabled', async function () {
      // Test that the service returns original results when re-ranking is disabled
      // This verifies the basic functionality when the feature is turned off

      // Temporarily disable re-ranking to test disabled behavior
      llmReRankingService.updateConfig({ enabled: false });

      const query = 'user authentication';
      const mockResults = createMockSearchResults();

      const result = await llmReRankingService.reRankResults(query, mockResults);

      // When disabled, the service should return results unchanged
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.query, query);
      assert.strictEqual(result.rankedResults.length, mockResults.length);
      assert.strictEqual(result.processedCount, mockResults.length);

      // Scores should remain unchanged when re-ranking is disabled
      result.rankedResults.forEach((rankedResult, index) => {
        assert.strictEqual(rankedResult.originalScore, mockResults[index].score);
        assert.strictEqual(rankedResult.llmScore, mockResults[index].score);
        assert.strictEqual(rankedResult.finalScore, mockResults[index].score);
      });

      console.log('Disabled re-ranking result:', result);
    });

    test('should handle re-ranking gracefully when enabled but LLM unavailable', async () => {
      // Test that the service handles LLM unavailability gracefully
      // This verifies error handling when the LLM service is not accessible

      // Enable re-ranking but use invalid configuration to simulate LLM unavailability
      llmReRankingService.updateConfig({
        enabled: true,
        apiUrl: 'http://invalid-url:1234',
        timeout: 2000,
      });

      const query = 'error handling';
      const mockResults = createMockSearchResults();

      const result = await llmReRankingService.reRankResults(query, mockResults);

      // Should fallback gracefully when LLM is unavailable
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.query, query);
      assert.strictEqual(result.rankedResults.length, mockResults.length);
      assert.strictEqual(result.processedCount, 0);

      console.log('Fallback re-ranking result:', result);
    });

    test('should validate score weight configuration', () => {
      // Test that score weight configuration is applied correctly
      // This verifies that the service can balance vector and LLM scores
      llmReRankingService.updateConfig({
        vectorScoreWeight: 0.4,
        llmScoreWeight: 0.6,
      });

      const config = llmReRankingService.getConfig();
      assert.strictEqual(config.vectorScoreWeight, 0.4);
      assert.strictEqual(config.llmScoreWeight, 0.6);

      // Weights should sum to 1.0 for proper scoring normalization
      assert.strictEqual(config.vectorScoreWeight + config.llmScoreWeight, 1.0);
    });
  });

  describe('Integration Tests', () => {
    test('should work together in search pipeline', async () => {
      // Test that both services work together in a complete search pipeline
      // This verifies the integration between query expansion and re-ranking

      // Test the complete pipeline with both services disabled
      // This establishes a baseline for the integration test
      queryExpansionService.updateConfig({ enabled: false });
      llmReRankingService.updateConfig({ enabled: false });

      const originalQuery = 'async function';
      const mockResults = createMockSearchResults();

      // Step 1: Query expansion
      // In a real scenario, this would expand the query with related terms
      const expandedQuery = await queryExpansionService.expandQuery(originalQuery);
      assert.strictEqual(expandedQuery.combinedQuery, originalQuery);

      // Step 2: Re-ranking
      // In a real scenario, this would re-rank results based on relevance
      const reRankedResults = await llmReRankingService.reRankResults(originalQuery, mockResults);

      // Verify that the pipeline completes successfully
      assert.strictEqual(reRankedResults.success, true);
      assert.strictEqual(reRankedResults.rankedResults.length, mockResults.length);

      console.log('Integration test completed successfully');
    });

    test('should handle configuration changes dynamically', () => {
      // Test that services respond to configuration changes at runtime
      // This verifies that the services can be reconfigured without restarting
      const initialExpansionConfig = queryExpansionService.getConfig();
      const initialReRankingConfig = llmReRankingService.getConfig();

      // Update configurations to toggle enabled state
      queryExpansionService.updateConfig({ enabled: !initialExpansionConfig.enabled });
      llmReRankingService.updateConfig({ enabled: !initialReRankingConfig.enabled });

      // Verify that the changes were applied correctly
      assert.strictEqual(queryExpansionService.isEnabled(), !initialExpansionConfig.enabled);
      assert.strictEqual(llmReRankingService.isEnabled(), !initialReRankingConfig.enabled);

      // Restore original configurations to avoid affecting other tests
      queryExpansionService.updateConfig({ enabled: initialExpansionConfig.enabled });
      llmReRankingService.updateConfig({ enabled: initialReRankingConfig.enabled });
    });
  });
});

/**
 * Create mock search results for testing
 *
 * This helper function creates realistic mock search results that can be used
 * to test the query expansion and re-ranking services. The results include
 * various code patterns and file types that would be found in a real codebase.
 *
 * @returns {Array<{ chunk: CodeChunk; score: number }>} An array of mock search results
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
        language: 'typescript',
      },
      score: 0.9,
    },
    {
      chunk: {
        content: 'function validateCredentials(username, password) { /* validation logic */ }',
        filePath: '/src/auth/validation.ts',
        type: ChunkType.FUNCTION,
        startLine: 5,
        endLine: 15,
        language: 'typescript',
      },
      score: 0.8,
    },
    {
      chunk: {
        content: 'class UserManager { login(user) { /* login implementation */ } }',
        filePath: '/src/user/userManager.ts',
        type: ChunkType.CLASS,
        startLine: 1,
        endLine: 25,
        language: 'typescript',
      },
      score: 0.7,
    },
  ];
}
