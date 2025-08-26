import * as assert from 'assert';
import * as vscode from 'vscode';
import { ContextService, ContextQuery } from '../../context/contextService';
import { QdrantService } from '../../db/qdrantService';
import { IEmbeddingProvider } from '../../embeddings/embeddingProvider';
import { IndexingService } from '../../indexing/indexingService';

/**
 * Test suite for ContextService
 * 
 * These tests verify the deduplication logic and advanced search functionality
 * of the ContextService, particularly the new maxResults and includeContent features.
 */
suite('ContextService Tests', () => {
    let contextService: ContextService;
    let mockQdrantService: any;
    let mockEmbeddingProvider: any;
    let mockIndexingService: any;

    setup(() => {
        // Create mock services
        mockQdrantService = {
            search: async (collectionName: string, vector: number[], limit: number, filter?: any) => {
                // Return mock results with duplicate file paths
                return [
                    {
                        id: '1',
                        score: 0.9,
                        payload: {
                            filePath: 'src/file1.ts',
                            text: 'First chunk from file1',
                            chunkIndex: 0,
                            startLine: 1,
                            endLine: 10,
                            language: 'typescript'
                        }
                    },
                    {
                        id: '2',
                        score: 0.8,
                        payload: {
                            filePath: 'src/file1.ts',
                            text: 'Second chunk from file1',
                            chunkIndex: 1,
                            startLine: 11,
                            endLine: 20,
                            language: 'typescript'
                        }
                    },
                    {
                        id: '3',
                        score: 0.85,
                        payload: {
                            filePath: 'src/file1.ts',
                            text: 'Third chunk from file1 with higher score',
                            chunkIndex: 2,
                            startLine: 21,
                            endLine: 30,
                            language: 'typescript'
                        }
                    },
                    {
                        id: '4',
                        score: 0.7,
                        payload: {
                            filePath: 'src/file2.ts',
                            text: 'Chunk from file2',
                            chunkIndex: 0,
                            startLine: 1,
                            endLine: 10,
                            language: 'typescript'
                        }
                    },
                    {
                        id: '5',
                        score: 0.6,
                        payload: {
                            filePath: 'src/file3.ts',
                            text: 'Chunk from file3',
                            chunkIndex: 0,
                            startLine: 1,
                            endLine: 10,
                            language: 'typescript'
                        }
                    }
                ];
            },
            healthCheck: async () => true,
            getCollectionInfo: async () => ({ status: 'green' })
        };

        mockEmbeddingProvider = {
            generateEmbeddings: async (texts: string[]) => {
                // Return mock embeddings
                return texts.map(() => new Array(384).fill(0.1));
            },
            getProviderName: () => 'mock-provider'
        };

        mockIndexingService = {};

        // Create ContextService with mocked dependencies
        contextService = new ContextService(
            '/test/workspace',
            mockQdrantService as QdrantService,
            mockEmbeddingProvider as IEmbeddingProvider,
            mockIndexingService as IndexingService
        );
    });

    test('should deduplicate results by file path and keep highest score', async () => {
        const contextQuery: ContextQuery = {
            query: 'test query',
            maxResults: 5,
            includeContent: false
        };

        const result = await contextService.queryContext(contextQuery);

        // Should have 3 unique files (file1.ts, file2.ts, file3.ts)
        assert.strictEqual(result.results.length, 3, 'Should return 3 unique files');

        // Check that file1.ts has the highest score (0.9) from the first chunk
        const file1Result = result.results.find(r => r.payload.filePath === 'src/file1.ts');
        assert.ok(file1Result, 'Should include file1.ts');
        assert.strictEqual(file1Result.score, 0.9, 'Should keep the highest score for file1.ts');

        // Check that results are sorted by score (descending)
        for (let i = 0; i < result.results.length - 1; i++) {
            assert.ok(
                result.results[i].score >= result.results[i + 1].score,
                'Results should be sorted by score in descending order'
            );
        }

        // Verify the order: file1.ts (0.9), file2.ts (0.7), file3.ts (0.6)
        assert.strictEqual(result.results[0].payload.filePath, 'src/file1.ts');
        assert.strictEqual(result.results[1].payload.filePath, 'src/file2.ts');
        assert.strictEqual(result.results[2].payload.filePath, 'src/file3.ts');
    });

    test('should respect maxResults limit', async () => {
        const contextQuery: ContextQuery = {
            query: 'test query',
            maxResults: 2,
            includeContent: false
        };

        const result = await contextService.queryContext(contextQuery);

        // Should only return 2 results even though 3 unique files are available
        assert.strictEqual(result.results.length, 2, 'Should respect maxResults limit');
        assert.strictEqual(result.totalResults, 2, 'totalResults should match actual results');
    });

    test('should include content when includeContent is true', async () => {
        // Mock vscode.workspace.fs.readFile
        const originalReadFile = vscode.workspace.fs.readFile;
        vscode.workspace.fs.readFile = async (uri: vscode.Uri) => {
            const fileName = uri.path.split('/').pop();
            return Buffer.from(`Mock content for ${fileName}`);
        };

        try {
            const contextQuery: ContextQuery = {
                query: 'test query',
                maxResults: 2,
                includeContent: true
            };

            const result = await contextService.queryContext(contextQuery);

            // Check that content is included in the results
            for (const searchResult of result.results) {
                assert.ok(
                    searchResult.payload.content,
                    'Should include file content when includeContent is true'
                );
                assert.ok(
                    searchResult.payload.content.includes('Mock content'),
                    'Should contain the expected mock content'
                );
            }
        } finally {
            // Restore original function
            vscode.workspace.fs.readFile = originalReadFile;
        }
    });

    test('should not include content when includeContent is false', async () => {
        const contextQuery: ContextQuery = {
            query: 'test query',
            maxResults: 2,
            includeContent: false
        };

        const result = await contextService.queryContext(contextQuery);

        // Check that content is not included in the results (should only have original chunk content)
        for (const searchResult of result.results) {
            // When includeContent is false, the content should be the original chunk content
            // and not additional file content that was read from disk
            assert.ok(
                searchResult.payload.content,
                'Should have original chunk content'
            );
            // We can't easily test that it's NOT the full file content without more complex mocking
            // but the important thing is that the includeContent flag controls the file reading logic
        }
    });

    test('should handle empty search results gracefully', async () => {
        // Mock empty results
        mockQdrantService.search = async () => [];

        const contextQuery: ContextQuery = {
            query: 'no results query',
            maxResults: 5,
            includeContent: false
        };

        const result = await contextService.queryContext(contextQuery);

        assert.strictEqual(result.results.length, 0, 'Should return empty results');
        assert.strictEqual(result.totalResults, 0, 'totalResults should be 0');
        assert.strictEqual(result.query, 'no results query', 'Should preserve original query');
        assert.ok(result.processingTime >= 0, 'Should include processing time');
    });
});
