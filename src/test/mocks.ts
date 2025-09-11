/**
 * Mock implementations for testing services in isolation
 *
 * This file contains mock classes that implement the same interfaces as the real services
 * but provide predictable, controllable behavior for unit testing.
 */

import { QdrantPoint, SearchResult } from '../db/qdrantService';
import { IEmbeddingProvider } from '../embeddings/embeddingProvider';
import { CodeChunk, ChunkType } from '../parsing/chunker';
import { SupportedLanguage } from '../parsing/astParser';
import {
  ConfigService,
  DatabaseConfig,
  OllamaConfig,
  OpenAIConfig,
  IndexingConfig,
  ExtensionConfig,
} from '../configService';

/**
 * Mock implementation of QdrantService for testing
 */
export class MockQdrantService {
  private collections: Set<string> = new Set();
  private points: Map<string, QdrantPoint[]> = new Map();
  private isHealthy = true;

  async healthCheck(): Promise<boolean> {
    return this.isHealthy;
  }

  async createCollectionIfNotExists(
    collectionName: string,
    vectorSize = 768,
    distance: 'Cosine' | 'Dot' | 'Euclid' = 'Cosine'
  ): Promise<boolean> {
    this.collections.add(collectionName);
    if (!this.points.has(collectionName)) {
      this.points.set(collectionName, []);
    }
    return true;
  }

  async deleteCollection(collectionName: string): Promise<boolean> {
    this.collections.delete(collectionName);
    this.points.delete(collectionName);
    return true;
  }

  async upsertPoints(collectionName: string, points: QdrantPoint[]): Promise<boolean> {
    if (!this.collections.has(collectionName)) {
      await this.createCollectionIfNotExists(collectionName);
    }

    const existingPoints = this.points.get(collectionName) || [];

    // Update or insert points
    for (const newPoint of points) {
      const existingIndex = existingPoints.findIndex(p => p.id === newPoint.id);
      if (existingIndex >= 0) {
        existingPoints[existingIndex] = newPoint;
      } else {
        existingPoints.push(newPoint);
      }
    }

    this.points.set(collectionName, existingPoints);
    return true;
  }

  async search(
    collectionName: string,
    queryVector: number[],
    limit = 10,
    filter?: any
  ): Promise<SearchResult[]> {
    const points = this.points.get(collectionName) || [];

    // Simple mock search - return first N points with random scores
    return points.slice(0, limit).map((point, index) => ({
      id: point.id,
      score: 0.9 - index * 0.1, // Decreasing scores
      payload: point.payload,
    }));
  }

  async getCollectionInfo(collectionName: string): Promise<any> {
    if (!this.collections.has(collectionName)) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }

    const points = this.points.get(collectionName) || [];
    return {
      status: 'green',
      vectors_count: points.length,
      indexed_vectors_count: points.length,
      points_count: points.length,
    };
  }

  // Test helper methods
  setHealthy(healthy: boolean): void {
    this.isHealthy = healthy;
  }

  getPointsCount(collectionName: string): number {
    return this.points.get(collectionName)?.length || 0;
  }

  clearAllData(): void {
    this.collections.clear();
    this.points.clear();
  }
}

/**
 * Mock implementation of IEmbeddingProvider for testing
 */
export class MockEmbeddingProvider implements IEmbeddingProvider {
  private isAvailableFlag = true;
  private dimensions = 768;
  private providerName = 'mock-provider';

  async generateEmbeddings(chunks: string[]): Promise<number[][]> {
    // Generate mock embeddings - arrays of random numbers
    return chunks.map(() => Array.from({ length: this.dimensions }, () => Math.random() - 0.5));
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getProviderName(): string {
    return this.providerName;
  }

  async isAvailable(): Promise<boolean> {
    return this.isAvailableFlag;
  }

  // Test helper methods
  setAvailable(available: boolean): void {
    this.isAvailableFlag = available;
  }

  setDimensions(dims: number): void {
    this.dimensions = dims;
  }

  setProviderName(name: string): void {
    this.providerName = name;
  }
}

/**
 * Mock implementation of FileWalker for testing
 */
export class MockFileWalker {
  private workspaceRoot: string;
  private ignoreInstance: any;
  private mockFiles: string[] = [];

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.ignoreInstance = { add: () => {}, ignores: () => false };
  }

  private async loadGitignore(): Promise<void> {
    // Mock implementation
  }

  public async findAllFiles(): Promise<string[]> {
    return this.mockFiles;
  }

  public async getFileStats(): Promise<{
    totalFiles: number;
    filesByExtension: Record<string, number>;
  }> {
    const filesByExtension: Record<string, number> = {};
    this.mockFiles.forEach(file => {
      const ext = file.substring(file.lastIndexOf('.'));
      filesByExtension[ext] = (filesByExtension[ext] || 0) + 1;
    });

    return {
      totalFiles: this.mockFiles.length,
      filesByExtension,
    };
  }

  public isCodeFile(filePath: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.cs', '.java'];
    return codeExtensions.some(ext => filePath.endsWith(ext));
  }

  async getFiles(extensions: string[] = [], excludePatterns: string[] = []): Promise<string[]> {
    return this.mockFiles.filter(file => {
      if (extensions.length > 0) {
        return extensions.some(ext => file.endsWith(ext));
      }
      return true;
    });
  }

  // Test helper methods
  setMockFiles(files: string[]): void {
    this.mockFiles = files;
  }

  addMockFile(file: string): void {
    this.mockFiles.push(file);
  }

  clearMockFiles(): void {
    this.mockFiles = [];
  }
}

/**
 * Mock implementation of AstParser for testing
 */
export class MockAstParser {
  private mockParseResult: any = null;

  async parseFile(filePath: string, language: SupportedLanguage): Promise<any> {
    return (
      this.mockParseResult || {
        functions: [],
        classes: [],
        imports: [],
        exports: [],
      }
    );
  }

  // Test helper methods
  setMockParseResult(result: any): void {
    this.mockParseResult = result;
  }
}

/**
 * Mock implementation of Chunker for testing
 */
export class MockChunker {
  private mockChunks: CodeChunk[] = [];

  chunkCode(
    content: string,
    filePath: string,
    language: SupportedLanguage,
    astResult?: any
  ): CodeChunk[] {
    if (this.mockChunks.length > 0) {
      return this.mockChunks;
    }

    // Default mock chunks
    return [
      {
        content: content.substring(0, Math.min(100, content.length)),
        filePath,
        startLine: 1,
        endLine: 10,
        type: ChunkType.FUNCTION,
        language,
        metadata: {},
      },
    ];
  }

  // Test helper methods
  setMockChunks(chunks: CodeChunk[]): void {
    this.mockChunks = chunks;
  }

  clearMockChunks(): void {
    this.mockChunks = [];
  }
}

/**
 * Mock implementation of LspService for testing
 */
export class MockLspService {
  private isInitialized = false;

  constructor(workspaceRoot: string) {
    // Mock constructor
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async dispose(): Promise<void> {
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // Test helper methods
  setInitialized(initialized: boolean): void {
    this.isInitialized = initialized;
  }
}

/**
 * Mock implementation of ConfigService for testing
 */
export class MockConfigService {
  private mockConfig: any = {};

  constructor(initialConfig?: any) {
    this.mockConfig = initialConfig || {
      databaseConnectionString: 'mock-qdrant-connection',
      embeddingProvider: 'ollama',
      ollamaModel: 'mock-ollama-model',
      ollamaApiUrl: 'http://mock-ollama:11434',
      ollamaMaxBatchSize: 10,
      ollamaTimeout: 30000,
      openaiApiKey: 'mock-openai-key',
      openaiModel: 'mock-openai-model',
      openaiMaxBatchSize: 100,
      openaiTimeout: 60000,
      excludePatterns: ['**/mock_exclude/**'],
      supportedLanguages: ['typescript', 'python'],
      maxFileSize: 10 * 1024 * 1024,
      indexingChunkSize: 500,
      indexingChunkOverlap: 100,
      autoIndexOnStartup: false,
      indexingBatchSize: 100,
      enableDebugLogging: false,
      maxSearchResults: 20,
      minSimilarityThreshold: 0.5,
      indexingIntensity: 'High',
    };
  }

  public refresh(): void {
    // No-op for mock
  }

  public getQdrantConnectionString(): string {
    return this.mockConfig.databaseConnectionString;
  }

  public getDatabaseConfig(): DatabaseConfig {
    return {
      type: 'qdrant',
      connectionString: this.getQdrantConnectionString(),
    };
  }

  public getEmbeddingProvider(): 'ollama' | 'openai' {
    return this.mockConfig.embeddingProvider;
  }

  public getOllamaConfig(): OllamaConfig {
    return {
      model: this.mockConfig.ollamaModel,
      apiUrl: this.mockConfig.ollamaApiUrl,
      maxBatchSize: this.mockConfig.ollamaMaxBatchSize,
      timeout: this.mockConfig.ollamaTimeout,
    };
  }

  public getOpenAIConfig(): OpenAIConfig {
    return {
      apiKey: this.mockConfig.openaiApiKey,
      model: this.mockConfig.openaiModel,
      maxBatchSize: this.mockConfig.openaiMaxBatchSize,
      timeout: this.mockConfig.openaiTimeout,
    };
  }

  public getIndexingConfig(): IndexingConfig {
    return {
      excludePatterns: this.mockConfig.excludePatterns,
      supportedLanguages: this.mockConfig.supportedLanguages,
      maxFileSize: this.mockConfig.maxFileSize,
      chunkSize: this.mockConfig.indexingChunkSize,
      chunkOverlap: this.mockConfig.indexingChunkOverlap,
    };
  }

  public getFullConfig(): ExtensionConfig {
    return {
      database: this.getDatabaseConfig(),
      embeddingProvider: this.getEmbeddingProvider(),
      ollama: this.getOllamaConfig(),
      openai: this.getOpenAIConfig(),
      indexing: this.getIndexingConfig(),
    };
  }

  public getMaxSearchResults(): number {
    return this.mockConfig.maxSearchResults;
  }

  public getMinSimilarityThreshold(): number {
    return this.mockConfig.minSimilarityThreshold;
  }

  public getAutoIndexOnStartup(): boolean {
    return this.mockConfig.autoIndexOnStartup;
  }

  public getIndexingBatchSize(): number {
    return this.mockConfig.indexingBatchSize;
  }

  public getEnableDebugLogging(): boolean {
    return this.mockConfig.enableDebugLogging;
  }

  public getIndexingIntensity(): 'High' | 'Medium' | 'Low' {
    return this.mockConfig.indexingIntensity;
  }

  public isProviderConfigured(provider: 'ollama' | 'openai'): boolean {
    if (provider === 'ollama') {
      return !!this.getOllamaConfig().apiUrl;
    } else if (provider === 'openai') {
      return !!this.getOpenAIConfig().apiKey;
    }
    return false;
  }

  public getCurrentProviderConfig(): OllamaConfig | OpenAIConfig {
    const providerType = this.getEmbeddingProvider();
    if (providerType === 'ollama') {
      return this.getOllamaConfig();
    }
    return this.getOpenAIConfig();
  }

  public setConfig(key: string, value: any): void {
    this.mockConfig[key] = value;
  }
}
