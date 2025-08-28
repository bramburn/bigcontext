how do i implement the sprints x to x , undertake a full websearch, determine which content is suitable and then, provide code example, api information and further guidance on using external api/packages to complete the task. Review 'prd', (if available) the existing code inin your analysis. Ensure each guide is produced in their own individual canvas document

### Implementation Guidance: Sub-Sprint 1 - Dependency Injection & Centralized Configuration

This guide provides detailed steps and code examples for implementing the tasks outlined in Sub-Sprint 1, focusing on centralizing configuration and implementing dependency injection.

**1. Create/Implement `src/configService.ts`**

*   **Purpose**: To provide a single, centralized source for all extension configuration settings, abstracting away direct `vscode.workspace.getConfiguration()` calls.
*   **API Information**: The core API is `vscode.workspace.getConfiguration('code-context-engine')`. This returns a `WorkspaceConfiguration` object which has a `get<T>(section: string, defaultValue?: T)` method to retrieve configuration values.
*   **Implementation Details**: Define interfaces for configuration objects (`DatabaseConfig`, `OllamaConfig`, `OpenAIConfig`, `IndexingConfig`) to ensure type safety and clear structure. The `ConfigService` constructor will initialize the configuration, and public getter methods will expose specific parts of the configuration.

```typescript
// src/configService.ts
import * as vscode from 'vscode';

// Define interfaces for configuration objects based on package.json
export interface DatabaseConfig {
    type: 'qdrant';
    connectionString: string;
}

export interface OllamaConfig {
    model: string;
    apiUrl: string; // Corresponds to 'ollamaApiUrl' in settings
    maxBatchSize: number;
    timeout: number;
}

export interface OpenAIConfig {
    apiKey: string;
    model: string;
    maxBatchSize: number;
    timeout: number;
}

export interface IndexingConfig {
    excludePatterns: string[];
    supportedLanguages: string[];
    maxFileSize: number;
    chunkSize: number;
    chunkOverlap: number;
    autoIndexOnStartup: boolean;
    indexingBatchSize: number;
    enableDebugLogging: boolean;
}

export class ConfigService {
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('code-context-engine');
    }

    public refresh(): void {
        this.config = vscode.workspace.getConfiguration('code-context-engine');
    }

    public getQdrantConnectionString(): string {
        return this.config.get<string>('databaseConnectionString', 'http://localhost:6333');
    }

    public getDatabaseConfig(): DatabaseConfig {
        return {
            type: 'qdrant',
            connectionString: this.getQdrantConnectionString()
        };
    }

    public getEmbeddingProvider(): 'ollama' | 'openai' {
        return this.config.get<'ollama' | 'openai'>('embeddingProvider', 'ollama');
    }

    public getOllamaConfig(): OllamaConfig {
        return {
            model: this.config.get<string>('ollamaModel', 'nomic-embed-text'),
            apiUrl: this.config.get<string>('ollamaApiUrl', 'http://localhost:11434'),
            maxBatchSize: this.config.get<number>('ollamaMaxBatchSize', 10),
            timeout: this.config.get<number>('ollamaTimeout', 30000)
        };
    }

    public getOpenAIConfig(): OpenAIConfig {
        return {
            apiKey: this.config.get<string>('openaiApiKey', ''),
            model: this.config.get<string>('openaiModel', 'text-embedding-ada-002'),
            maxBatchSize: this.config.get<number>('openaiMaxBatchSize', 100),
            timeout: this.config.get<number>('openaiTimeout', 60000)
        };
    }

    public getIndexingConfig(): IndexingConfig {
        return {
            excludePatterns: this.config.get<string[]>('excludePatterns', []), // Default from package.json
            supportedLanguages: this.config.get<string[]>('supportedLanguages', []), // Default from package.json
            maxFileSize: this.config.get<number>('maxFileSize', 10 * 1024 * 1024), // Example default, add to package.json
            chunkSize: this.config.get<number>('indexingChunkSize', 500), // Example default, add to package.json
            chunkOverlap: this.config.get<number>('indexingChunkOverlap', 100), // Example default, add to package.json
            autoIndexOnStartup: this.config.get<boolean>('autoIndexOnStartup', false),
            indexingBatchSize: this.config.get<number>('indexingBatchSize', 100),
            enableDebugLogging: this.config.get<boolean>('enableDebugLogging', false)
        };
    }

    public getFullConfig() {
        return {
            database: this.getDatabaseConfig(),
            embeddingProvider: this.getEmbeddingProvider(),
            ollama: this.getOllamaConfig(),
            openai: this.getOpenAIConfig(),
            indexing: this.getIndexingConfig(),
            maxSearchResults: this.config.get<number>('code-context-engine.maxSearchResults', 20),
            minSimilarityThreshold: this.config.get<number>('code-context-engine.minSimilarityThreshold', 0.5)
        };
    }

    public isProviderConfigured(provider: 'ollama' | 'openai'): boolean {
        if (provider === 'ollama') {
            return !!this.getOllamaConfig().apiUrl; // Check if API URL is set
        } else if (provider === 'openai') {
            return !!this.getOpenAIConfig().apiKey; // Check if API key is set
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
}
```

**Important Note for `package.json`:**
To support the new configuration properties in `ConfigService`, you must update your `package.json` under `contributes.configuration.properties`. Add entries for:
- `code-context-engine.ollamaApiUrl`
- `code-context-engine.ollamaMaxBatchSize`
- `code-context-engine.ollamaTimeout`
- `code-context-engine.openaiMaxBatchSize`
- `code-context-engine.openaiTimeout`
- `code-context-engine.maxFileSize`
- `code-context-engine.indexingChunkSize`
- `code-context-engine.indexingChunkOverlap`

Example `package.json` addition:
```json
"code-context-engine.ollamaApiUrl": {
    "type": "string",
    "default": "http://localhost:11434",
    "description": "Ollama API URL"
},
"code-context-engine.ollamaMaxBatchSize": {
    "type": "number",
    "default": 10,
    "description": "Max batch size for Ollama embeddings"
},
// ... similar entries for other new properties
```

**2. Refactor `src/db/qdrantService.ts`**

*   **Purpose**: Ensure `QdrantService` constructor correctly uses the injected `connectionString`.
*   **Implementation Details**: The existing `QdrantService` constructor already accepts `connectionString`. No code changes are required in this file for this sub-sprint, as it already adheres to the DI principle for its connection string.

**3. Refactor `src/embeddings/ollamaProvider.ts`**

*   **Purpose**: Update `OllamaProvider` to use the `EmbeddingConfig` passed via its constructor, which will now be populated by `ConfigService`.
*   **Implementation Details**: Adjust the constructor to use `config.apiUrl` instead of `config.baseUrl` if you followed the `ConfigService` example. Ensure no direct `vscode.workspace.getConfiguration()` calls remain.

```typescript
// src/embeddings/ollamaProvider.ts
import axios, { AxiosInstance } from 'axios';
import { IEmbeddingProvider, EmbeddingConfig } from './embeddingProvider';

export class OllamaProvider implements IEmbeddingProvider {
    private client: AxiosInstance;
    private model: string;
    private baseUrl: string; 
    private maxBatchSize: number; 
    private timeout: number;

    constructor(config: EmbeddingConfig) {
        this.model = config.model || 'nomic-embed-text';
        this.baseUrl = config.apiUrl || 'http://localhost:11434'; // Use config.apiUrl
        this.maxBatchSize = config.maxBatchSize || 10;
        this.timeout = config.timeout || 30000;

        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    // ... rest of the class methods
}
```

**4. Refactor `src/embeddings/openaiProvider.ts`**

*   **Purpose**: Update `OpenAIProvider` to use the `EmbeddingConfig` passed via its constructor, populated by `ConfigService`.
*   **Implementation Details**: Ensure the constructor uses `config.apiKey`, `config.model`, `config.maxBatchSize`, and `config.timeout`. No direct `vscode.workspace.getConfiguration()` calls should be present.

```typescript
// src/embeddings/openaiProvider.ts
import axios, { AxiosInstance } from 'axios';
import { IEmbeddingProvider, EmbeddingConfig } from './embeddingProvider';

export class OpenAIProvider implements IEmbeddingProvider {
    private client: AxiosInstance;
    private model: string;
    private apiKey: string;
    private maxBatchSize: number;
    private timeout: number;

    constructor(config: EmbeddingConfig) {
        this.model = config.model || 'text-embedding-ada-002';
        this.apiKey = config.apiKey || '';
        this.maxBatchSize = config.maxBatchSize || 100;
        this.timeout = config.timeout || 60000;

        if (!this.apiKey) {
            throw new Error('OpenAI API key is required. Please set it in VS Code settings.');
        }

        this.client = axios.create({
            baseURL: 'https://api.openai.com/v1',
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
    }
    // ... rest of the class methods
}
```

**5. Refactor `src/embeddings/embeddingProvider.ts`**

*   **Purpose**: Modify `EmbeddingProviderFactory` to accept and utilize the `ConfigService` instance when creating providers.
*   **Implementation Details**: Update the `createProviderFromConfigService` method signature and logic to call the appropriate getter methods on the injected `ConfigService`.

```typescript
// src/embeddings/embeddingProvider.ts
import { OllamaProvider } from './ollamaProvider';
import { OpenAIProvider } from './openaiProvider';
import { ConfigService, OllamaConfig, OpenAIConfig } from '../configService'; // Import ConfigService and its interfaces

// ... (IEmbeddingProvider and EmbeddingConfig interfaces)

export class EmbeddingProviderFactory {
    // ... (createProvider method)

    static async createProviderFromConfigService(configService: ConfigService): Promise<IEmbeddingProvider> {
        const providerType = configService.getEmbeddingProvider();

        let config: EmbeddingConfig;

        if (providerType === 'ollama') {
            const ollamaConfig: OllamaConfig = configService.getOllamaConfig();
            config = {
                provider: 'ollama',
                model: ollamaConfig.model,
                apiUrl: ollamaConfig.apiUrl, 
                maxBatchSize: ollamaConfig.maxBatchSize,
                timeout: ollamaConfig.timeout
            };
        } else if (providerType === 'openai') {
            const openaiConfig: OpenAIConfig = configService.getOpenAIConfig();
            config = {
                provider: 'openai',
                model: openaiConfig.model,
                apiKey: openaiConfig.apiKey,
                maxBatchSize: openaiConfig.maxBatchSize,
                timeout: openaiConfig.timeout
            };
        } else {
            throw new Error(`Unsupported embedding provider: ${providerType}. Supported providers: ${this.getSupportedProviders().join(', ')}`);
        }

        return this.createProvider(config);
    }

    // ... (getSupportedProviders method)
}
```

**6. Refactor `src/context/contextService.ts`**

*   **Purpose**: Inject `ConfigService` into `ContextService` and replace direct `vscode.workspace.getConfiguration()` calls.
*   **Implementation Details**: Add `configService: ConfigService` to the constructor. In `findRelatedFiles` and `queryContext`, retrieve `maxSearchResults` and `minSimilarityThreshold` from `this.configService.getFullConfig()`.

```typescript
// src/context/contextService.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { IndexingService } from '../indexing/indexingService';
import { QdrantService, SearchResult } from '../db/qdrantService';
import { IEmbeddingProvider } from '../embeddings/embeddingProvider';
import { ConfigService } from '../configService'; // Import ConfigService

// ... (interfaces)

export class ContextService {
    private workspaceRoot: string;
    private indexingService: IndexingService;
    private qdrantService: QdrantService;
    private embeddingProvider: IEmbeddingProvider;
    private configService: ConfigService; // Add ConfigService

    // ... (constants)

    constructor(
        workspaceRoot: string,
        qdrantService: QdrantService,
        embeddingProvider: IEmbeddingProvider,
        indexingService: IndexingService,
        configService: ConfigService // Inject ConfigService
    ) {
        this.workspaceRoot = workspaceRoot;
        this.qdrantService = qdrantService;
        this.embeddingProvider = embeddingProvider;
        this.indexingService = indexingService;
        this.configService = configService; // Assign ConfigService
    }

    // ... (other methods)

    async findRelatedFiles(
        query: string,
        currentFilePath?: string,
        maxResults?: number,
        minSimilarity?: number
    ): Promise<RelatedFile[]> {
        // Get configuration values from ConfigService
        const fullConfig = this.configService.getFullConfig();
        maxResults = maxResults ?? fullConfig.maxSearchResults ?? 10;
        minSimilarity = minSimilarity ?? fullConfig.minSimilarityThreshold ?? 0.5;

        // ... rest of the method
    }

    async queryContext(contextQuery: ContextQuery): Promise<ContextResult> {
        const startTime = Date.now();

        try {
            // ... (existing code)

            // Get configuration values from ConfigService
            const fullConfig = this.configService.getFullConfig();
            const maxSearchResults = contextQuery.maxResults ?? fullConfig.maxSearchResults ?? 100;
            const defaultMinSimilarity = fullConfig.minSimilarityThreshold ?? 0.5;

            // ... rest of the method
        } catch (error) {
            // ... error handling
        }
    }

    // ... (remaining methods)
}
```

**7. Refactor `src/indexing/indexingService.ts`**

*   **Purpose**: Inject `ConfigService` into `IndexingService` and remove direct configuration access.
*   **Implementation Details**: Add `configService: ConfigService` to the constructor. Any configuration values previously obtained via `vscode.workspace.getConfiguration()` should now be retrieved from `this.configService.getIndexingConfig()`.

```typescript
// src/indexing/indexingService.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import { FileWalker } from '../fileWalker';
import { AstParser, SupportedLanguage } from '../parsing/astParser';
import { Chunker, CodeChunk, ChunkType } from '../parsing/chunker';
import { QdrantService } from '../db/qdrantService';
import { IEmbeddingProvider, EmbeddingProviderFactory, EmbeddingConfig } from '../embeddings/embeddingProvider';
import { LSPService } from '../lsp/lspService';
import { StateManager } from '../stateManager';
import { ConfigService } from '../configService'; // Import ConfigService

// ... (interfaces)

export class IndexingService {
    private workspaceRoot: string;
    private fileWalker: FileWalker;
    private astParser: AstParser;
    private chunker: Chunker;
    private qdrantService: QdrantService;
    private embeddingProvider: IEmbeddingProvider;
    private lspService: LSPService;
    private stateManager: StateManager;
    private configService: ConfigService; // Add ConfigService

    // ... (private properties)

    constructor(
        workspaceRoot: string,
        fileWalker: FileWalker,
        astParser: AstParser,
        chunker: Chunker,
        qdrantService: QdrantService,
        embeddingProvider: IEmbeddingProvider,
        lspService: LSPService,
        stateManager: StateManager,
        configService: ConfigService // Inject ConfigService
    ) {
        this.workspaceRoot = workspaceRoot;
        this.fileWalker = fileWalker;
        this.astParser = astParser;
        this.chunker = chunker;
        this.qdrantService = qdrantService;
        this.embeddingProvider = embeddingProvider;
        this.lspService = lspService;
        this.stateManager = stateManager;
        this.configService = configService; // Assign ConfigService
    }

    // ... (all other methods)
}
```

**8. Add `MockConfigService` to `src/test/mocks.ts`**

*   **Purpose**: Provide a mock implementation of `ConfigService` for isolated unit testing of services that depend on it.
*   **Implementation Details**: The `MockConfigService` should mimic the public API of the real `ConfigService`, allowing tests to set and retrieve mock configuration values. This avoids direct dependency on the VS Code API during tests.

```typescript
// src/test/mocks.ts
// ... (existing imports and mocks)

import * as vscode from 'vscode'; // Needed for mocking vscode.workspace.getConfiguration
import { ConfigService, DatabaseConfig, OllamaConfig, OpenAIConfig, IndexingConfig } from '../configService'; // Import interfaces from ConfigService

/**
 * Mock implementation of ConfigService for testing
 */
export class MockConfigService implements ConfigService {
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
            chunkSize: 500,
            chunkOverlap: 100,
            autoIndexOnStartup: false,
            indexingBatchSize: 100,
            enableDebugLogging: false,
            maxSearchResults: 20,
            minSimilarityThreshold: 0.5
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
            connectionString: this.getQdrantConnectionString()
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
            timeout: this.mockConfig.ollamaTimeout
        };
    }

    public getOpenAIConfig(): OpenAIConfig {
        return {
            apiKey: this.mockConfig.openaiApiKey,
            model: this.mockConfig.openaiModel,
            maxBatchSize: this.mockConfig.openaiMaxBatchSize,
            timeout: this.mockConfig.openaiTimeout
        };
    }

    public getIndexingConfig(): IndexingConfig {
        return {
            excludePatterns: this.mockConfig.excludePatterns,
            supportedLanguages: this.mockConfig.supportedLanguages,
            maxFileSize: this.mockConfig.maxFileSize,
            chunkSize: this.mockConfig.chunkSize,
            chunkOverlap: this.mockConfig.chunkOverlap,
            autoIndexOnStartup: this.mockConfig.autoIndexOnStartup,
            indexingBatchSize: this.mockConfig.indexingBatchSize,
            enableDebugLogging: this.mockConfig.enableDebugLogging
        };
    }

    public getFullConfig(): any {
        return {
            database: this.getDatabaseConfig(),
            embeddingProvider: this.getEmbeddingProvider(),
            ollama: this.getOllamaConfig(),
            openai: this.getOpenAIConfig(),
            indexing: this.getIndexingConfig(),
            maxSearchResults: this.mockConfig.maxSearchResults,
            minSimilarityThreshold: this.mockConfig.minSimilarityThreshold
        };
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
```

**9. Update `src/test/suite/contextService.test.ts`**

*   **Purpose**: Modify existing tests to use the `MockConfigService` for dependency injection, ensuring tests are isolated from actual VS Code settings.
*   **Implementation Details**: Import `MockConfigService` and pass an instance of it to the `ContextService` constructor during test setup. Update any tests that previously relied on `vscode.workspace.getConfiguration()` to use the `mockConfigService` directly or through the `ContextService`.

```typescript
// src/test/suite/contextService.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { ContextService } from '../../context/contextService';
import { MockQdrantService, MockEmbeddingProvider, MockFileWalker, MockConfigService } from '../mocks'; // Import MockConfigService
import { IndexingService } from '../../indexing/indexingService'; 
import { AstParser } from '../../parsing/astParser'; 
import { Chunker } from '../../parsing/chunker'; 
import { LSPService } from '../../lsp/lspService'; 
import { StateManager } from '../../stateManager'; 

suite('ContextService Tests', () => {
    let contextService: ContextService;
    let mockQdrantService: MockQdrantService;
    let mockEmbeddingProvider: MockEmbeddingProvider;
    let mockIndexingService: IndexingService; 
    let mockConfigService: MockConfigService; 
    let mockFileWalker: MockFileWalker;
    let mockAstParser: AstParser;
    let mockChunker: Chunker;
    let mockLspService: LSPService;
    let mockStateManager: StateManager;

    const workspaceRoot = '/mock/workspace';

    setup(() => {
        mockQdrantService = new MockQdrantService();
        mockEmbeddingProvider = new MockEmbeddingProvider();
        mockConfigService = new MockConfigService(); // Initialize MockConfigService
        mockFileWalker = new MockFileWalker(workspaceRoot);
        mockAstParser = new AstParser(); 
        mockChunker = new Chunker(); 
        mockLspService = new LSPService(workspaceRoot); 
        mockStateManager = new StateManager(); 

        mockIndexingService = new IndexingService(
            workspaceRoot,
            mockFileWalker,
            mockAstParser,
            mockChunker,
            mockQdrantService,
            mockEmbeddingProvider,
            mockLspService,
            mockStateManager,
            mockConfigService // Pass mockConfigService to IndexingService
        );

        contextService = new ContextService(
            workspaceRoot,
            mockQdrantService,
            mockEmbeddingProvider,
            mockIndexingService,
            mockConfigService // Pass mockConfigService to ContextService
        );

        // Mock VS Code API for tests that might still implicitly rely on it
        // This is a fallback, ideally services shouldn't call VS Code API directly
        // if ConfigService is used.
        (vscode as any).workspace = {
            getConfiguration: (section: string) => {
                if (section === 'code-context-engine') {
                    return {
                        get: (key: string, defaultValue: any) => {
                            // Provide mock values for configuration
                            if (key === 'maxSearchResults') return mockConfigService.getFullConfig().maxSearchResults;
                            if (key === 'minSimilarityThreshold') return mockConfigService.getFullConfig().minSimilarityThreshold;
                            return defaultValue;
                        }
                    };
                }
                return { get: (key: string, defaultValue: any) => defaultValue };
            },
            fs: {
                readFile: async (uri: vscode.Uri) => Buffer.from('mock file content'),
                stat: async (uri: vscode.Uri) => ({ size: 100, mtime: Date.now() })
            },
            asRelativePath: (uri: vscode.Uri) => path.relative(workspaceRoot, uri.fsPath)
        };
    });

    // ... (existing tests, modify them to use the injected configService where applicable)

    test('findRelatedFiles should use ConfigService for maxResults and minSimilarity', async () => {
        mockEmbeddingProvider.setAvailable(true);
        mockQdrantService.createCollectionIfNotExists('code_context_workspace');
        mockQdrantService.upsertPoints('code_context_workspace', [
            { id: '1', vector: [0.1, 0.2], payload: { filePath: '/mock/workspace/file1.ts', content: 'content1', startLine: 1, endLine: 1, type: 'function', language: 'typescript' } },
            { id: '2', vector: [0.15, 0.25], payload: { filePath: '/mock/workspace/file2.ts', content: 'content2', startLine: 1, endLine: 1, type: 'function', language: 'typescript' } },
            { id: '3', vector: [0.05, 0.15], payload: { filePath: '/mock/workspace/file3.ts', content: 'content3', startLine: 1, endLine: 1, type: 'function', language: 'typescript' } }
        ]);

        mockConfigService.setConfig('maxSearchResults', 1); // Set specific config values for this test
        mockConfigService.setConfig('minSimilarityThreshold', 0.1);

        const relatedFiles = await contextService.findRelatedFiles('test query');

        assert.strictEqual(relatedFiles.length, 1); 
        assert.ok(relatedFiles[0].similarity >= 0.1); 
    });

    test('queryContext should use ConfigService for maxSearchResults and minSimilarityThreshold', async () => {
        mockEmbeddingProvider.setAvailable(true);
        mockQdrantService.createCollectionIfNotExists('code_context_workspace');
        mockQdrantService.upsertPoints('code_context_workspace', [
            { id: '1', vector: [0.1, 0.2], payload: { filePath: '/mock/workspace/file1.ts', content: 'content1', startLine: 1, endLine: 1, type: 'function', language: 'typescript' } },
            { id: '2', vector: [0.15, 0.25], payload: { filePath: '/mock/workspace/file2.ts', content: 'content2', startLine: 1, endLine: 1, type: 'function', language: 'typescript' } },
            { id: '3', vector: [0.05, 0.15], payload: { filePath: '/mock/workspace/file3.ts', content: 'content3', startLine: 1, endLine: 1, type: 'function', language: 'typescript' } }
        ]);

        mockConfigService.setConfig('maxSearchResults', 1); // Set specific config values for this test
        mockConfigService.setConfig('minSimilarityThreshold', 0.1);

        const result = await contextService.queryContext({ query: 'test query' });

        assert.strictEqual(result.results.length, 1); 
        assert.ok(result.results[0].score >= 0.1); 
    });
});
```
