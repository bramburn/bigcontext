import * as assert from 'assert';
import { ConfigService } from '../../configService';
import { QdrantService } from '../../db/qdrantService';
import { ContextService } from '../../context/contextService';
import { IndexingService } from '../../indexing/indexingService';
import {
    MockQdrantService,
    MockEmbeddingProvider,
    MockFileWalker,
    MockAstParser,
    MockChunker,
    MockLspService
} from '../mocks';

/**
 * Test suite for Dependency Injection
 * 
 * These tests verify that our services can be properly instantiated with
 * injected dependencies and that they work correctly in isolation.
 */
suite('Dependency Injection Tests', () => {
    let configService: ConfigService;
    let mockQdrantService: MockQdrantService;
    let mockEmbeddingProvider: MockEmbeddingProvider;

    setup(() => {
        configService = new ConfigService();
        mockQdrantService = new MockQdrantService();
        mockEmbeddingProvider = new MockEmbeddingProvider();
    });

    test('should create QdrantService with injected connection string', () => {
        const connectionString = 'http://test:6333';
        const qdrantService = new QdrantService(connectionString);
        
        assert.ok(qdrantService);
        // QdrantService should be created without throwing
    });

    test('should create ContextService with injected dependencies', () => {
        const workspaceRoot = '/test/workspace';
        const mockFileWalker = new MockFileWalker(workspaceRoot);
        const mockAstParser = new MockAstParser();
        const mockChunker = new MockChunker();
        const mockLspService = new MockLspService(workspaceRoot);
        
        const mockIndexingService = new IndexingService(
            workspaceRoot,
            mockFileWalker as any,
            mockAstParser as any,
            mockChunker as any,
            mockQdrantService as any,
            mockEmbeddingProvider,
            mockLspService as any
        );

        const contextService = new ContextService(
            workspaceRoot,
            mockQdrantService as any,
            mockEmbeddingProvider,
            mockIndexingService
        );

        assert.ok(contextService);
        // ContextService should be created without throwing
    });

    test('should create IndexingService with all injected dependencies', () => {
        const workspaceRoot = '/test/workspace';
        const mockFileWalker = new MockFileWalker(workspaceRoot);
        const mockAstParser = new MockAstParser();
        const mockChunker = new MockChunker();
        const mockLspService = new MockLspService(workspaceRoot);

        const indexingService = new IndexingService(
            workspaceRoot,
            mockFileWalker as any,
            mockAstParser as any,
            mockChunker as any,
            mockQdrantService as any,
            mockEmbeddingProvider,
            mockLspService as any
        );

        assert.ok(indexingService);
        // IndexingService should be created without throwing
    });

    test('should allow mocking of QdrantService behavior', async () => {
        // Test that we can control mock behavior
        mockQdrantService.setHealthy(false);
        const isHealthy = await mockQdrantService.healthCheck();
        assert.strictEqual(isHealthy, false);

        mockQdrantService.setHealthy(true);
        const isHealthyNow = await mockQdrantService.healthCheck();
        assert.strictEqual(isHealthyNow, true);
    });

    test('should allow mocking of EmbeddingProvider behavior', async () => {
        // Test that we can control mock behavior
        mockEmbeddingProvider.setAvailable(false);
        const isAvailable = await mockEmbeddingProvider.isAvailable();
        assert.strictEqual(isAvailable, false);

        mockEmbeddingProvider.setAvailable(true);
        const isAvailableNow = await mockEmbeddingProvider.isAvailable();
        assert.strictEqual(isAvailableNow, true);
    });

    test('should generate mock embeddings', async () => {
        const chunks = ['test chunk 1', 'test chunk 2'];
        const embeddings = await mockEmbeddingProvider.generateEmbeddings(chunks);
        
        assert.strictEqual(embeddings.length, 2);
        assert.strictEqual(embeddings[0].length, mockEmbeddingProvider.getDimensions());
        assert.strictEqual(embeddings[1].length, mockEmbeddingProvider.getDimensions());
    });

    test('should allow configuration of mock dimensions', () => {
        const newDimensions = 1024;
        mockEmbeddingProvider.setDimensions(newDimensions);
        assert.strictEqual(mockEmbeddingProvider.getDimensions(), newDimensions);
    });

    test('should allow configuration of mock provider name', () => {
        const newName = 'test-provider';
        mockEmbeddingProvider.setProviderName(newName);
        assert.strictEqual(mockEmbeddingProvider.getProviderName(), newName);
    });

    test('should support mock file operations', async () => {
        const mockFileWalker = new MockFileWalker('/test');
        const testFiles = ['file1.ts', 'file2.js', 'file3.py'];
        
        mockFileWalker.setMockFiles(testFiles);
        const files = await mockFileWalker.getFiles();
        
        assert.deepStrictEqual(files, testFiles);
    });

    test('should support mock chunking operations', () => {
        const mockChunker = new MockChunker();
        const testContent = 'function test() { return "hello"; }';
        
        const chunks = mockChunker.chunkCode(testContent, 'test.ts', 'typescript');
        
        assert.ok(Array.isArray(chunks));
        assert.ok(chunks.length > 0);
        assert.strictEqual(chunks[0].filePath, 'test.ts');
        assert.strictEqual(chunks[0].language, 'typescript');
    });
});
