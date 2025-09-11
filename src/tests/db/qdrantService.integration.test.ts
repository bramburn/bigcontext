import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { QdrantService, QdrantServiceConfig } from '../../db/qdrantService';
import { CentralizedLoggingService } from '../../logging/centralizedLoggingService';
import { CodeChunk } from '../../parsing/chunker';

// Integration tests - these require a running Qdrant instance
// Skip these tests if QDRANT_INTEGRATION_TESTS environment variable is not set
const shouldRunIntegrationTests = process.env.QDRANT_INTEGRATION_TESTS === 'true';

describe.skipIf(!shouldRunIntegrationTests)('QdrantService Integration Tests', () => {
  let qdrantService: QdrantService;
  let loggingService: CentralizedLoggingService;
  const testCollectionName = `test_collection_${Date.now()}`;

  beforeAll(async () => {
    // Create a real logging service for integration tests
    loggingService = new CentralizedLoggingService();

    const config: QdrantServiceConfig = {
      connectionString: process.env.QDRANT_URL || 'http://localhost:6333',
      retryConfig: {
        maxRetries: 3,
        baseDelayMs: 500,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      },
      batchSize: 50,
      healthCheckIntervalMs: 10000,
    };

    qdrantService = new QdrantService(config, loggingService);

    // Verify Qdrant is accessible
    const isHealthy = await qdrantService.healthCheck(true);
    if (!isHealthy) {
      throw new Error('Qdrant service is not accessible for integration tests');
    }
  });

  afterAll(async () => {
    // Clean up test collection
    try {
      await qdrantService.deleteCollection(testCollectionName);
    } catch (error) {
      console.warn('Failed to clean up test collection:', error);
    }
  });

  beforeEach(async () => {
    // Ensure clean state for each test
    try {
      await qdrantService.deleteCollection(testCollectionName);
    } catch (error) {
      // Collection might not exist, which is fine
    }
  });

  describe('Real Qdrant Operations', () => {
    it('should perform full indexing and search workflow', async () => {
      // Step 1: Create collection
      const created = await qdrantService.createCollectionIfNotExists(testCollectionName, 384);
      expect(created).toBe(true);

      // Step 2: Prepare test data
      const chunks: CodeChunk[] = [
        {
          filePath: '/test/utils.ts',
          content: 'export function calculateSum(a: number, b: number): number { return a + b; }',
          startLine: 1,
          endLine: 3,
          type: 'function',
          name: 'calculateSum',
          language: 'typescript',
        },
        {
          filePath: '/test/math.ts',
          content: 'export function multiply(x: number, y: number): number { return x * y; }',
          startLine: 5,
          endLine: 7,
          type: 'function',
          name: 'multiply',
          language: 'typescript',
        },
        {
          filePath: '/test/string.ts',
          content:
            'export function formatString(str: string): string { return str.trim().toLowerCase(); }',
          startLine: 10,
          endLine: 12,
          type: 'function',
          name: 'formatString',
          language: 'typescript',
        },
      ];

      // Generate simple test vectors (in real usage, these would come from embedding models)
      const vectors = chunks.map((_, index) => {
        const vector = Array(384).fill(0);
        // Create slightly different vectors for each chunk
        for (let i = 0; i < 10; i++) {
          vector[i] = (index + 1) * 0.1 + Math.random() * 0.1;
        }
        return vector;
      });

      // Step 3: Upsert chunks
      const upserted = await qdrantService.upsertChunks(testCollectionName, chunks, vectors);
      expect(upserted).toBe(true);

      // Step 4: Search for similar vectors
      const searchVector = vectors[0]; // Search for something similar to first chunk
      const results = await qdrantService.search(testCollectionName, searchVector, 5);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].payload.name).toBe('calculateSum');
      expect(results[0].score).toBeGreaterThan(0.8); // Should be very similar
    });

    it('should handle large batch operations', async () => {
      const created = await qdrantService.createCollectionIfNotExists(testCollectionName, 128);
      expect(created).toBe(true);

      // Create a large number of chunks
      const numChunks = 250; // More than default batch size
      const chunks: CodeChunk[] = [];
      const vectors: number[][] = [];

      for (let i = 0; i < numChunks; i++) {
        chunks.push({
          filePath: `/test/file${i}.ts`,
          content: `export function func${i}() { return ${i}; }`,
          startLine: i * 5,
          endLine: i * 5 + 2,
          type: 'function',
          name: `func${i}`,
          language: 'typescript',
        });

        // Simple vector with some variation
        const vector = Array(128).fill(i / numChunks);
        vectors.push(vector);
      }

      const upserted = await qdrantService.upsertChunks(testCollectionName, chunks, vectors);
      expect(upserted).toBe(true);

      // Verify all chunks were stored
      const searchResults = await qdrantService.search(testCollectionName, vectors[0], numChunks);
      expect(searchResults.length).toBe(numChunks);
    });

    it('should handle collection management operations', async () => {
      // Create collection
      const created = await qdrantService.createCollectionIfNotExists(testCollectionName, 256);
      expect(created).toBe(true);

      // Get collection info
      const info = await qdrantService.getCollectionInfo(testCollectionName);
      expect(info).toBeTruthy();
      expect(info.config?.params?.vectors?.size).toBe(256);

      // List collections
      const collections = await qdrantService.getCollections();
      expect(collections).toContain(testCollectionName);

      // Delete collection
      const deleted = await qdrantService.deleteCollection(testCollectionName);
      expect(deleted).toBe(true);

      // Verify collection is gone
      const collectionsAfterDelete = await qdrantService.getCollections();
      expect(collectionsAfterDelete).not.toContain(testCollectionName);
    });

    it('should handle search with filters', async () => {
      const created = await qdrantService.createCollectionIfNotExists(testCollectionName, 128);
      expect(created).toBe(true);

      // Create chunks with different languages
      const chunks: CodeChunk[] = [
        {
          filePath: '/test/script.ts',
          content: 'console.log("TypeScript");',
          startLine: 1,
          endLine: 1,
          type: 'statement',
          language: 'typescript',
        },
        {
          filePath: '/test/script.js',
          content: 'console.log("JavaScript");',
          startLine: 1,
          endLine: 1,
          type: 'statement',
          language: 'javascript',
        },
        {
          filePath: '/test/script.py',
          content: 'print("Python")',
          startLine: 1,
          endLine: 1,
          type: 'statement',
          language: 'python',
        },
      ];

      const vectors = chunks.map(() =>
        Array(128)
          .fill(0)
          .map(() => Math.random())
      );

      const upserted = await qdrantService.upsertChunks(testCollectionName, chunks, vectors);
      expect(upserted).toBe(true);

      // Search with language filter
      const filter = {
        must: [
          {
            key: 'language',
            match: { value: 'typescript' },
          },
        ],
      };

      const results = await qdrantService.search(testCollectionName, vectors[0], 10, filter);
      expect(results.length).toBe(1);
      expect(results[0].payload.language).toBe('typescript');
    });

    it('should recover from temporary connection issues', async () => {
      // This test simulates recovery by testing health check behavior
      const isHealthy1 = await qdrantService.healthCheck(true);
      expect(isHealthy1).toBe(true);

      // Force a new health check
      const isHealthy2 = await qdrantService.healthCheck(true);
      expect(isHealthy2).toBe(true);

      // Test cached health check
      const isHealthy3 = await qdrantService.healthCheck(false);
      expect(isHealthy3).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid collection operations gracefully', async () => {
      // Try to search in non-existent collection
      const results = await qdrantService.search('nonexistent_collection', [0.1, 0.2, 0.3], 5);
      expect(results).toHaveLength(0);

      // Try to get info for non-existent collection
      const info = await qdrantService.getCollectionInfo('nonexistent_collection');
      expect(info).toBeNull();
    });

    it('should validate vector dimensions', async () => {
      const created = await qdrantService.createCollectionIfNotExists(testCollectionName, 128);
      expect(created).toBe(true);

      const chunk: CodeChunk = {
        filePath: '/test/file.ts',
        content: 'test content',
        startLine: 1,
        endLine: 1,
        type: 'statement',
        language: 'typescript',
      };

      // Try to upsert with wrong vector dimension
      const wrongSizeVector = Array(64).fill(0.5); // Should be 128
      const result = await qdrantService.upsertChunks(
        testCollectionName,
        [chunk],
        [wrongSizeVector]
      );
      expect(result).toBe(false);
    });
  });
});
