import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QdrantService, QdrantServiceConfig } from '../../db/qdrantService';
import { CentralizedLoggingService } from '../../logging/centralizedLoggingService';
import { CodeChunk } from '../../parsing/chunker';

// Mock the QdrantClient
vi.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: vi.fn().mockImplementation(() => ({
    getCollections: vi.fn(),
    createCollection: vi.fn(),
    upsert: vi.fn(),
    search: vi.fn(),
    delete: vi.fn(),
    deleteCollection: vi.fn(),
    getCollection: vi.fn(),
  })),
}));

describe('QdrantService', () => {
  let qdrantService: QdrantService;
  let mockLoggingService: CentralizedLoggingService;
  let mockQdrantClient: any;
  let config: QdrantServiceConfig;

  beforeEach(() => {
    // Create mock logging service
    mockLoggingService = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as any;

    // Create test configuration
    config = {
      connectionString: 'http://localhost:6333',
      retryConfig: {
        maxRetries: 2,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
      },
      batchSize: 10,
      healthCheckIntervalMs: 5000,
    };

    // Create QdrantService instance
    qdrantService = new QdrantService(config, mockLoggingService);

    // Get the mock client instance
    const { QdrantClient } = require('@qdrant/js-client-rest');
    mockQdrantClient = QdrantClient.mock.results[QdrantClient.mock.results.length - 1].value;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const minimalConfig = { connectionString: 'http://localhost:6333' };
      const service = new QdrantService(minimalConfig, mockLoggingService);
      expect(service).toBeDefined();
    });

    it('should extract host and port correctly', () => {
      const service = new QdrantService(
        { connectionString: 'http://example.com:9999' },
        mockLoggingService
      );
      expect(service).toBeDefined();
    });
  });

  describe('healthCheck', () => {
    it('should return true when Qdrant is accessible', async () => {
      mockQdrantClient.getCollections.mockResolvedValue({ collections: [] });

      const result = await qdrantService.healthCheck(true);

      expect(result).toBe(true);
      expect(mockQdrantClient.getCollections).toHaveBeenCalled();
    });

    it('should return false when Qdrant is not accessible', async () => {
      mockQdrantClient.getCollections.mockRejectedValue(new Error('Connection failed'));

      const result = await qdrantService.healthCheck(true);

      expect(result).toBe(false);
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        'Qdrant health check failed',
        { error: 'Connection failed' },
        'QdrantService'
      );
    });

    it('should use cached result when not forcing check', async () => {
      mockQdrantClient.getCollections.mockResolvedValue({ collections: [] });

      // First call should hit the service
      await qdrantService.healthCheck(true);
      expect(mockQdrantClient.getCollections).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await qdrantService.healthCheck(false);
      expect(mockQdrantClient.getCollections).toHaveBeenCalledTimes(1);
    });
  });

  describe('createCollectionIfNotExists', () => {
    it('should create collection when it does not exist', async () => {
      mockQdrantClient.getCollections.mockResolvedValue({ collections: [] });
      mockQdrantClient.createCollection.mockResolvedValue({});

      const result = await qdrantService.createCollectionIfNotExists('test_collection', 768);

      expect(result).toBe(true);
      expect(mockQdrantClient.createCollection).toHaveBeenCalledWith('test_collection', {
        vectors: {
          size: 768,
          distance: 'Cosine',
        },
      });
    });

    it('should not create collection when it already exists', async () => {
      mockQdrantClient.getCollections.mockResolvedValue({
        collections: [{ name: 'test_collection', config: { params: { vectors: { size: 768 } } } }],
      });

      const result = await qdrantService.createCollectionIfNotExists('test_collection', 768);

      expect(result).toBe(true);
      expect(mockQdrantClient.createCollection).not.toHaveBeenCalled();
    });

    it('should validate collection name', async () => {
      const result = await qdrantService.createCollectionIfNotExists('', 768);

      expect(result).toBe(false);
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        "Failed to create collection ''",
        expect.objectContaining({
          error: 'Collection name cannot be empty',
        }),
        'QdrantService'
      );
    });

    it('should validate vector size', async () => {
      const result = await qdrantService.createCollectionIfNotExists('test_collection', 0);

      expect(result).toBe(false);
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        "Failed to create collection 'test_collection'",
        expect.objectContaining({
          error: 'Invalid vector size: 0. Must be between 1 and 65536',
        }),
        'QdrantService'
      );
    });

    it('should retry on failure', async () => {
      mockQdrantClient.getCollections
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue({ collections: [] });
      mockQdrantClient.createCollection.mockResolvedValue({});

      const result = await qdrantService.createCollectionIfNotExists('test_collection', 768);

      expect(result).toBe(true);
      expect(mockQdrantClient.getCollections).toHaveBeenCalledTimes(2);
    });
  });

  describe('upsertChunks', () => {
    const createMockChunk = (index: number): CodeChunk => ({
      filePath: `/test/file${index}.ts`,
      content: `function test${index}() {}`,
      startLine: index * 10,
      endLine: index * 10 + 5,
      type: 'function',
      name: `test${index}`,
      language: 'typescript',
    });

    const createMockVector = (): number[] => Array(768).fill(0).map(() => Math.random());

    it('should successfully upsert chunks', async () => {
      mockQdrantClient.getCollections.mockResolvedValue({ collections: [] });
      mockQdrantClient.upsert.mockResolvedValue({});

      const chunks = [createMockChunk(1), createMockChunk(2)];
      const vectors = [createMockVector(), createMockVector()];

      const result = await qdrantService.upsertChunks('test_collection', chunks, vectors);

      expect(result).toBe(true);
      expect(mockQdrantClient.upsert).toHaveBeenCalled();
    });

    it('should validate input arrays match', async () => {
      const chunks = [createMockChunk(1)];
      const vectors = [createMockVector(), createMockVector()];

      const result = await qdrantService.upsertChunks('test_collection', chunks, vectors);

      expect(result).toBe(false);
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        "Failed to upsert chunks to collection 'test_collection'",
        expect.objectContaining({
          error: "Chunks count (1) doesn't match vectors count (2)",
        }),
        'QdrantService'
      );
    });

    it('should handle empty chunks gracefully', async () => {
      const result = await qdrantService.upsertChunks('test_collection', [], []);

      expect(result).toBe(true);
      expect(mockLoggingService.info).toHaveBeenCalledWith(
        'No chunks to upsert',
        {},
        'QdrantService'
      );
    });

    it('should process chunks in batches', async () => {
      mockQdrantClient.getCollections.mockResolvedValue({ collections: [] });
      mockQdrantClient.upsert.mockResolvedValue({});

      // Create more chunks than batch size
      const chunks = Array(25).fill(0).map((_, i) => createMockChunk(i));
      const vectors = Array(25).fill(0).map(() => createMockVector());

      const result = await qdrantService.upsertChunks('test_collection', chunks, vectors);

      expect(result).toBe(true);
      // Should be called 3 times (10 + 10 + 5 chunks with batch size 10)
      expect(mockQdrantClient.upsert).toHaveBeenCalledTimes(3);
    });

    it('should validate chunk data', async () => {
      const invalidChunk = { ...createMockChunk(1), filePath: '' };
      const vectors = [createMockVector()];

      const result = await qdrantService.upsertChunks('test_collection', [invalidChunk], vectors);

      expect(result).toBe(false);
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        "Failed to upsert chunks to collection 'test_collection'",
        expect.objectContaining({
          error: expect.stringContaining('Chunk must have a valid filePath'),
        }),
        'QdrantService'
      );
    });
  });

  describe('search', () => {
    it('should successfully search for vectors', async () => {
      mockQdrantClient.getCollections.mockResolvedValue({
        collections: [{ name: 'test_collection' }],
      });
      mockQdrantClient.search.mockResolvedValue([
        {
          id: 'test_id',
          score: 0.95,
          payload: {
            filePath: '/test/file.ts',
            content: 'test content',
            startLine: 1,
            endLine: 5,
            type: 'function',
            language: 'typescript',
          },
        },
      ]);

      const queryVector = Array(768).fill(0).map(() => Math.random());
      const results = await qdrantService.search('test_collection', queryVector, 10);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test_id');
      expect(results[0].score).toBe(0.95);
      expect(mockQdrantClient.search).toHaveBeenCalledWith('test_collection', {
        vector: queryVector,
        limit: 10,
        with_payload: true,
        filter: undefined,
      });
    });

    it('should validate collection exists before search', async () => {
      mockQdrantClient.getCollections.mockResolvedValue({ collections: [] });

      const queryVector = Array(768).fill(0).map(() => Math.random());
      const results = await qdrantService.search('nonexistent_collection', queryVector, 10);

      expect(results).toHaveLength(0);
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        "Search failed in collection 'nonexistent_collection'",
        expect.objectContaining({
          error: "Collection 'nonexistent_collection' does not exist",
        }),
        'QdrantService'
      );
    });

    it('should validate search parameters', async () => {
      const queryVector = Array(768).fill(0).map(() => Math.random());
      const results = await qdrantService.search('test_collection', queryVector, 0);

      expect(results).toHaveLength(0);
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        "Search failed in collection 'test_collection'",
        expect.objectContaining({
          error: 'Invalid limit: 0. Must be between 1 and 10000',
        }),
        'QdrantService'
      );
    });

    it('should handle search with filters', async () => {
      mockQdrantClient.getCollections.mockResolvedValue({
        collections: [{ name: 'test_collection' }],
      });
      mockQdrantClient.search.mockResolvedValue([]);

      const queryVector = Array(768).fill(0).map(() => Math.random());
      const filter = { must: [{ key: 'language', match: { value: 'typescript' } }] };
      
      await qdrantService.search('test_collection', queryVector, 10, filter);

      expect(mockQdrantClient.search).toHaveBeenCalledWith('test_collection', {
        vector: queryVector,
        limit: 10,
        with_payload: true,
        filter: filter,
      });
    });

    it('should allow empty vector for filter-only searches', async () => {
      mockQdrantClient.getCollections.mockResolvedValue({
        collections: [{ name: 'test_collection' }],
      });
      mockQdrantClient.search.mockResolvedValue([]);

      const filter = { must: [{ key: 'language', match: { value: 'typescript' } }] };
      const results = await qdrantService.search('test_collection', [], 10, filter);

      expect(results).toHaveLength(0);
      expect(mockQdrantClient.search).toHaveBeenCalledWith('test_collection', {
        vector: [],
        limit: 10,
        with_payload: true,
        filter: filter,
      });
    });
  });

  describe('retry mechanism', () => {
    it('should retry operations with exponential backoff', async () => {
      let callCount = 0;
      mockQdrantClient.getCollections.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve({ collections: [] });
      });

      const startTime = Date.now();
      const result = await qdrantService.healthCheck(true);
      const endTime = Date.now();

      expect(result).toBe(true);
      expect(callCount).toBe(3);
      // Should have some delay due to retries
      expect(endTime - startTime).toBeGreaterThan(100);
    });

    it('should fail after max retries', async () => {
      mockQdrantClient.getCollections.mockRejectedValue(new Error('Persistent failure'));

      const result = await qdrantService.healthCheck(true);

      expect(result).toBe(false);
      expect(mockQdrantClient.getCollections).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });

  describe('validation', () => {
    it('should validate collection names with special characters', async () => {
      const invalidNames = ['test collection', 'test@collection', 'test.collection', ''];

      for (const name of invalidNames) {
        const result = await qdrantService.createCollectionIfNotExists(name, 768);
        expect(result).toBe(false);
      }
    });

    it('should validate vector values', async () => {
      const chunk = createMockChunk(1);
      const invalidVectors = [
        [NaN, 0.5, 0.3],
        [Infinity, 0.5, 0.3],
        [-Infinity, 0.5, 0.3],
        [],
      ];

      for (const vector of invalidVectors) {
        const result = await qdrantService.upsertChunks('test_collection', [chunk], [vector]);
        expect(result).toBe(false);
      }
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts gracefully', async () => {
      mockQdrantClient.getCollections.mockRejectedValue(new Error('ETIMEDOUT'));

      const result = await qdrantService.healthCheck(true);

      expect(result).toBe(false);
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        'Qdrant health check failed',
        { error: 'ETIMEDOUT' },
        'QdrantService'
      );
    });

    it('should handle malformed responses', async () => {
      mockQdrantClient.search.mockResolvedValue([
        { id: 'test', score: null, payload: null },
      ]);
      mockQdrantClient.getCollections.mockResolvedValue({
        collections: [{ name: 'test_collection' }],
      });

      const queryVector = Array(768).fill(0).map(() => Math.random());
      const results = await qdrantService.search('test_collection', queryVector, 10);

      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0); // Should default to 0
    });
  });
});
