### User Story 1: Refactor Services for Dependency Injection
**As Alisha, I want to** refactor services to receive dependencies via their constructor, **so that** I can unit test them with mocks.

**Actions to Undertake:**
1.  **Filepath**: `src/context/contextService.ts`
    -   **Action**: Modify the constructor to accept `qdrantService: QdrantService` and `embeddingProvider: IEmbeddingProvider` as arguments. Remove any `new` keywords for these dependencies.
    -   **Implementation**:
        ```typescript
        import { QdrantService } from '../db/qdrantService';
        import { IEmbeddingProvider } from '../embeddings/embeddingProvider';

        export class ContextService {
            constructor(
                private qdrantService: QdrantService,
                private embeddingProvider: IEmbeddingProvider
            ) {
                // ... existing constructor logic ...
            }
            // ... rest of the class ...
        }
        ```
    -   **Imports**: `import { QdrantService } from '../db/qdrantService'; import { IEmbeddingProvider } from '../embeddings/embeddingProvider';`
2.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Modify the constructor to accept its dependencies (`fileWalker`, `astParser`, `chunker`, `qdrantService`, `embeddingProvider`, `lspService`) as arguments. Remove any `new` keywords for these dependencies.
    -   **Implementation**:
        ```typescript
        import { FileWalker } from './fileWalker';
        import { AstParser } from '../parsing/astParser';
        import { Chunker } from '../parsing/chunker';
        import { QdrantService } from '../db/qdrantService';
        import { IEmbeddingProvider } from '../embeddings/embeddingProvider';
        import { LspService } from '../lsp/lspService';

        export class IndexingService {
            constructor(
                private fileWalker: FileWalker,
                private astParser: AstParser,
                private chunker: Chunker,
                private qdrantService: QdrantService,
                private embeddingProvider: IEmbeddingProvider,
                private lspService: LspService
            ) {
                // ... existing constructor logic ...
            }
            // ... rest of the class ...
        }
        ```
    -   **Imports**: `import { FileWalker } from './fileWalker'; import { AstParser } from '../parsing/astParser'; import { Chunker } from '../parsing/chunker'; import { QdrantService } from '../db/qdrantService'; import { IEmbeddingProvider } from '../embeddings/embeddingProvider'; import { LspService } from '../lsp/lspService';`
3.  **Filepath**: `src/db/qdrantService.ts`
    -   **Action**: Modify the constructor to accept `connectionString: string`. Remove any `getConfiguration` calls.
    -   **Implementation**:
        ```typescript
        export class QdrantService {
            constructor(private connectionString: string) {
                // ... existing constructor logic, use connectionString ...
            }
            // ... rest of the class ...
        }
        ```
    -   **Imports**: None.
4.  **Filepath**: `src/embeddings/ollamaProvider.ts`
    -   **Action**: Modify the constructor to accept `config: OllamaConfig` object. Remove any `getConfiguration` calls.
    -   **Implementation**:
        ```typescript
        interface OllamaConfig {
            apiUrl: string;
            // ... other Ollama specific config ...
        }

        export class OllamaProvider implements IEmbeddingProvider {
            constructor(private config: OllamaConfig) {
                // ... existing constructor logic, use config ...
            }
            // ... rest of the class ...
        }
        ```
    -   **Imports**: None.
5.  **Filepath**: `src/embeddings/openaiProvider.ts`
    -   **Action**: Modify the constructor to accept `config: OpenAIConfig` object. Remove any `getConfiguration` calls.
    -   **Implementation**:
        ```typescript
        interface OpenAIConfig {
            apiKey: string;
            // ... other OpenAI specific config ...
        }

        export class OpenAIProvider implements IEmbeddingProvider {
            constructor(private config: OpenAIConfig) {
                // ... existing constructor logic, use config ...
            }
            // ... rest of the class ...
        }
        ```
    -   **Imports**: None.
6.  **Filepath**: `src/embeddings/embeddingProvider.ts`
    -   **Action**: Update the `EmbeddingProviderFactory` (or similar factory class/function) to accept the `ConfigService` and pass the correct configuration down to the provider it creates.
    -   **Implementation**: (This will depend on the existing factory structure, but generally involves passing `ConfigService` and using its getters)
        ```typescript
        // Assuming a factory function or class
        import { ConfigService } from '../configService'; // New import
        import { OllamaProvider } from './ollamaProvider';
        import { OpenAIProvider } from './openaiProvider';

        export function createEmbeddingProvider(type: 'ollama' | 'openai', configService: ConfigService): IEmbeddingProvider {
            if (type === 'ollama') {
                return new OllamaProvider(configService.getOllamaConfig());
            } else if (type === 'openai') {
                return new OpenAIProvider(configService.getOpenAIConfig());
            }
            throw new Error('Unknown embedding provider type');
        }
        ```
    -   **Imports**: `import { ConfigService } from '../configService'; import { OllamaProvider } from './ollamaProvider'; import { OpenAIProvider } from './openaiProvider';`

### User Story 2: Centralized Configuration Service
**As Alisha, I want to** create a central configuration service, **so that** settings are managed in one place.

**Actions to Undertake:**
1.  **Filepath**: `src/configService.ts` (New File)
    -   **Action**: Create a new `ConfigService` class that reads all settings from `vscode.workspace.getConfiguration('code-context-engine')` on startup and provides them via getter methods.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';

        interface ExtensionConfig {
            qdrantConnectionString: string;
            ollama: {
                apiUrl: string;
                // ... other ollama specific config ...
            };
            openai: {
                apiKey: string;
                // ... other openai specific config ...
            };
            // ... add other configuration properties as needed ...
        }

        export class ConfigService {
            private config: ExtensionConfig;

            constructor() {
                this.config = vscode.workspace.getConfiguration('code-context-engine') as any; // Cast to any for simplicity, refine with proper type
            }

            public getQdrantConnectionString(): string {
                return this.config.qdrantConnectionString;
            }

            public getOllamaConfig(): { apiUrl: string } {
                return this.config.ollama;
            }

            public getOpenAIConfig(): { apiKey: string } {
                return this.config.openai;
            }

            // Add more getters for other configuration properties
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`
2.  **Filepath**: `src/extension.ts`
    -   **Action**: Update `extension.ts` to instantiate `ConfigService` and pass its instance to other services during their instantiation.
    -   **Implementation**: (Conceptual, exact placement depends on existing `extension.ts` structure)
        ```typescript
        import * as vscode from 'vscode';
        import { ConfigService } from './configService';
        import { QdrantService } from './db/qdrantService';
        import { createEmbeddingProvider } from './embeddings/embeddingProvider';
        import { ContextService } from './context/contextService';
        import { IndexingService } from './indexing/indexingService';
        import { FileWalker } from './indexing/fileWalker';
        import { AstParser } from './parsing/astParser';
        import { Chunker } from './parsing/chunker';
        import { LspService } from './lsp/lspService';

        export function activate(context: vscode.ExtensionContext) {
            const configService = new ConfigService();
            const qdrantService = new QdrantService(configService.getQdrantConnectionString());
            const embeddingProvider = createEmbeddingProvider('ollama', configService); // Example, choose based on config
            const contextService = new ContextService(qdrantService, embeddingProvider);

            const fileWalker = new FileWalker(); // Assuming no dependencies for now
            const astParser = new AstParser(); // Assuming no dependencies for now
            const chunker = new Chunker(); // Assuming no dependencies for now
            const lspService = new LspService(); // Assuming no dependencies for now

            const indexingService = new IndexingService(
                fileWalker,
                astParser,
                chunker,
                qdrantService,
                embeddingProvider,
                lspService
            );

            // ... register commands, etc. ...
        }
        ```
    -   **Imports**: `import { ConfigService } from './configService'; import { QdrantService } './db/qdrantService'; import { createEmbeddingProvider } from './embeddings/embeddingProvider'; import { ContextService } from './context/contextService'; import { IndexingService } from './indexing/indexingService'; import { FileWalker } from './indexing/fileWalker'; import { AstParser } from './parsing/astParser'; import { Chunker } from './parsing/chunker'; import { LspService } from './lsp/lspService';`

### User Story 3: Update Unit Tests for DI
**As Alisha, I want to** update existing unit tests and add new ones, **so that** I can verify service logic with mocked dependencies.

**Actions to Undertake:**
1.  **Filepath**: `src/test/mocks.ts` (New File)
    -   **Action**: Create mock implementations for `QdrantService` and `IEmbeddingProvider` for use in unit tests.
    -   **Implementation**:
        ```typescript
        import { QdrantService } from '../db/qdrantService';
        import { IEmbeddingProvider } from '../embeddings/embeddingProvider';

        export class MockQdrantService implements Partial<QdrantService> {
            // Implement mock methods as needed for tests
            // For example:
            // async upsertVectors(vectors: any[]): Promise<void> { /* mock implementation */ }
        }

        export class MockEmbeddingProvider implements Partial<IEmbeddingProvider> {
            // Implement mock methods as needed for tests
            // For example:
            // async embed(text: string): Promise<number[]> { return [0.1, 0.2, 0.3]; }
        }
        ```
    -   **Imports**: `import { QdrantService } from '../db/qdrantService'; import { IEmbeddingProvider } from '../embeddings/embeddingProvider';`
2.  **Filepath**: `src/test/contextService.test.ts`
    -   **Action**: Modify existing tests to pass mocked dependencies to the `ContextService` constructor. Add new tests to cover scenarios with mocked dependencies.
    -   **Implementation**: (Conceptual, depends on testing framework, e.g., Mocha/Chai, Jest)
        ```typescript
        import { expect } from 'chai'; // or 'jest'
        import { ContextService } from '../context/contextService';
        import { MockQdrantService, MockEmbeddingProvider } from './mocks';

        describe('ContextService', () => {
            let mockQdrantService: MockQdrantService;
            let mockEmbeddingProvider: MockEmbeddingProvider;
            let contextService: ContextService;

            beforeEach(() => {
                mockQdrantService = new MockQdrantService();
                mockEmbeddingProvider = new MockEmbeddingProvider();
                contextService = new ContextService(
                    mockQdrantService as any, // Cast to any for partial mock
                    mockEmbeddingProvider as any // Cast to any for partial mock
                );
            });

            it('should do something with mocked dependencies', async () => {
                // Example test:
                // (mockQdrantService as any).someMethod = () => Promise.resolve('mocked result');
                // const result = await contextService.someMethodCallingQdrant();
                // expect(result).to.equal('mocked result');
            });
        });
        ```
    -   **Imports**: `import { expect } from 'chai'; import { ContextService } from '../context/contextService'; import { MockQdrantService, MockEmbeddingProvider } from './mocks';`

**Acceptance Criteria:**
- No service uses the `new` keyword to create its long-lived dependencies.
- No service directly calls `vscode.workspace.getConfiguration()`.
- Unit tests for services can run without needing the VS Code API.

**Testing Plan:**
- **Test Case 1**: Run existing unit tests for `ContextService` and `IndexingService` to ensure they pass with mocked dependencies.
- **Test Case 2**: Add new unit tests for `ConfigService` to verify it correctly reads and provides configuration values.
- **Test Case 3**: Verify that `QdrantService`, `OllamaProvider`, and `OpenAIProvider` constructors correctly receive their configuration/connection strings.
- **Test Case 4**: Ensure that the `EmbeddingProviderFactory` correctly instantiates providers with the configuration from `ConfigService`.
