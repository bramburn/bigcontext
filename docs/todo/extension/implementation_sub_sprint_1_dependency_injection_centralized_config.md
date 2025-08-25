## Implementation Guidance: Sub-Sprint 1 - Dependency Injection & Centralized Config

This guide provides detailed instructions and code examples for implementing Dependency Injection (DI) and a centralized configuration service within the VS Code extension. The goal is to decouple services, improve testability, and streamline configuration management.

### 1. Centralized Configuration (`ConfigService.ts`)

**Purpose:** To encapsulate all extension settings, providing a single source of truth and preventing direct `vscode.workspace.getConfiguration()` calls throughout the codebase.

**API Information:**
- `vscode.workspace.getConfiguration('section')`: Retrieves a configuration object for a specific section (e.g., 'code-context-engine').

**Code Example (`src/configService.ts` - New File):**
```typescript
import * as vscode from 'vscode';

// Define an interface for your extension's configuration structure
interface ExtensionConfig {
    qdrantConnectionString: string;
    ollama: {
        apiUrl: string;
        // Add other Ollama specific config properties
    };
    openai: {
        apiKey: string;
        // Add other OpenAI specific config properties
    };
    // Add any other top-level configuration properties here
}

export class ConfigService {
    private config: ExtensionConfig;

    constructor() {
        // Load the configuration once during instantiation
        // The 'code-context-engine' string should match your extension's configuration section in package.json
        this.config = vscode.workspace.getConfiguration('code-context-engine') as any; // Cast to any for initial simplicity
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

    // Add more public getter methods for other configuration properties as needed
    // Example:
    // public getSomeOtherSetting(): boolean {
    //     return this.config.someOtherSetting;
    // }
}
```

### 2. Refactoring Services for Dependency Injection

**Purpose:** To modify service constructors to accept their dependencies as arguments, rather than instantiating them internally. This enables easier testing and promotes loose coupling.

**General Approach:**
1.  Identify all `new` keyword usages within a service's constructor or initialization logic that create other long-lived service instances.
2.  Add parameters to the service's constructor for each of these dependencies.
3.  Update the `extension.ts` (or later, `ExtensionManager`) to instantiate these dependencies and pass them to the service constructors.

**Code Examples:**

**a) `src/db/qdrantService.ts`**

Modify the constructor to accept the connection string directly:
```typescript
// src/db/qdrantService.ts

export class QdrantService {
    constructor(private connectionString: string) {
        // Use this.connectionString to initialize Qdrant client
        console.log(`QdrantService initialized with connection: ${this.connectionString}`);
    }

    // ... rest of your QdrantService methods ...
}
```

**b) `src/embeddings/ollamaProvider.ts` and `src/embeddings/openaiProvider.ts`**

Define configuration interfaces and update constructors:

**`src/embeddings/ollamaProvider.ts`**
```typescript
// src/embeddings/ollamaProvider.ts
import { IEmbeddingProvider } from './embeddingProvider';

export interface OllamaConfig {
    apiUrl: string;
    // Add other Ollama specific config properties like model name, etc.
}

export class OllamaProvider implements IEmbeddingProvider {
    constructor(private config: OllamaConfig) {
        console.log(`OllamaProvider initialized with API URL: ${this.config.apiUrl}`);
    }

    async embed(text: string): Promise<number[]> {
        // Implementation using this.config.apiUrl
        return [/* embedding vector */];
    }
}
```

**`src/embeddings/openaiProvider.ts`**
```typescript
// src/embeddings/openaiProvider.ts
import { IEmbeddingProvider } from './embeddingProvider';

export interface OpenAIConfig {
    apiKey: string;
    // Add other OpenAI specific config properties
}

export class OpenAIProvider implements IEmbeddingProvider {
    constructor(private config: OpenAIConfig) {
        console.log(`OpenAIProvider initialized with API Key: ${this.config.apiKey ? '*****' : 'N/A'}`);
    }

    async embed(text: string): Promise<number[]> {
        // Implementation using this.config.apiKey
        return [/* embedding vector */];
    }
}
```

**c) `src/embeddings/embeddingProvider.ts` (Factory Update)**

If you have a factory function or class for creating embedding providers, update it to accept `ConfigService` and pass the relevant config:
```typescript
// src/embeddings/embeddingProvider.ts (assuming this file contains the factory)
import { ConfigService } from '../configService';
import { OllamaProvider, OllamaConfig } from './ollamaProvider';
import { OpenAIProvider, OpenAIConfig } from './openaiProvider';

export interface IEmbeddingProvider {
    embed(text: string): Promise<number[]>;
}

export function createEmbeddingProvider(type: 'ollama' | 'openai', configService: ConfigService): IEmbeddingProvider {
    switch (type) {
        case 'ollama':
            return new OllamaProvider(configService.getOllamaConfig());
        case 'openai':
            return new OpenAIProvider(configService.getOpenAIConfig());
        default:
            throw new Error(`Unsupported embedding provider type: ${type}`);
    }
}
```

**d) `src/context/contextService.ts`**

Update constructor to accept `QdrantService` and `IEmbeddingProvider`:
```typescript
// src/context/contextService.ts
import { QdrantService } from '../db/qdrantService';
import { IEmbeddingProvider } from '../embeddings/embeddingProvider';

export class ContextService {
    constructor(
        private qdrantService: QdrantService,
        private embeddingProvider: IEmbeddingProvider
    ) {
        // Now you can use this.qdrantService and this.embeddingProvider
    }

    // ... rest of your ContextService methods ...
}
```

**e) `src/indexing/indexingService.ts`**

Update constructor to accept all its dependencies:
```typescript
// src/indexing/indexingService.ts
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
        // Now you can use these injected dependencies
    }

    // ... rest of your IndexingService methods ...
}
```

### 3. Updating `extension.ts` (Initial Wiring)

**Purpose:** To act as the composition root where all services are instantiated and their dependencies are resolved and passed. This file will become much cleaner in subsequent sprints with the `ExtensionManager`.

**Code Example (`src/extension.ts` - Partial Update):**
```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { ConfigService } from './configService';
import { QdrantService } from './db/qdrantService';
import { createEmbeddingProvider } from './embeddings/embeddingProvider';
import { ContextService } from './context/contextService';
import { IndexingService } from './indexing/indexingService';
import { FileWalker } from './indexing/fileWalker'; // Assuming no dependencies for now
import { AstParser } from './parsing/astParser';   // Assuming no dependencies for now
import { Chunker } from './parsing/chunker';     // Assuming no dependencies for now
import { LspService } from './lsp/lspService';     // Assuming no dependencies for now

export function activate(context: vscode.ExtensionContext) {
    // 1. Instantiate ConfigService first
    const configService = new ConfigService();

    // 2. Instantiate QdrantService with config
    const qdrantService = new QdrantService(configService.getQdrantConnectionString());

    // 3. Instantiate EmbeddingProvider using the factory and config
    // You might have logic here to determine which provider to use (ollama/openai)
    const embeddingProvider = createEmbeddingProvider('ollama', configService); // Example: using ollama

    // 4. Instantiate ContextService with its dependencies
    const contextService = new ContextService(qdrantService, embeddingProvider);

    // 5. Instantiate other core dependencies (if they don't have their own complex dependencies yet)
    const fileWalker = new FileWalker();
    const astParser = new AstParser();
    const chunker = new Chunker();
    const lspService = new LspService();

    // 6. Instantiate IndexingService with all its dependencies
    const indexingService = new IndexingService(
        fileWalker,
        astParser,
        chunker,
        qdrantService,
        embeddingProvider,
        lspService
    );

    // Register commands, etc., using these instantiated services
    // Example:
    // context.subscriptions.push(
    //     vscode.commands.registerCommand('code-context-engine.startIndexing', () => {
    //         indexingService.startIndexing();
    //     })
    // );

    console.log('Code Context Engine extension activated.');
}

export function deactivate() {
    console.log('Code Context Engine extension deactivated.');
}
```

### 4. Updating Unit Tests

**Purpose:** To ensure that services can be tested in isolation by providing mocked dependencies, verifying their logic without relying on the actual VS Code API or other complex services.

**General Approach:**
1.  Create mock classes or objects that implement the interfaces or mimic the behavior of the real dependencies.
2.  In your test setup (e.g., `beforeEach`), instantiate your service under test, passing in these mock objects.
3.  Use your testing framework's assertion capabilities to verify the service's behavior.

**Code Example (`src/test/mocks.ts` - New File):**
```typescript
// src/test/mocks.ts
import { QdrantService } from '../db/qdrantService';
import { IEmbeddingProvider } from '../embeddings/embeddingProvider';
import { FileWalker } from '../indexing/fileWalker';
import { AstParser } from '../parsing/astParser';
import { Chunker } from '../parsing/chunker';
import { LspService } from '../lsp/lspService';

// Partial mocks for services that might have methods called by other services
export class MockQdrantService implements Partial<QdrantService> {
    // Example mock method
    async upsertVectors(vectors: any[]): Promise<void> { /* do nothing or return a mock value */ }
    // Add other methods that ContextService or IndexingService might call
}

export class MockEmbeddingProvider implements Partial<IEmbeddingProvider> {
    async embed(text: string): Promise<number[]> {
        return [0.1, 0.2, 0.3]; // Return a dummy embedding
    }
}

// Full mocks for simple dependencies or those not yet refactored with complex logic
export class MockFileWalker implements Partial<FileWalker> {
    // Implement methods if IndexingService calls them
}

export class MockAstParser implements Partial<AstParser> {
    // Implement methods if IndexingService calls them
}

export class MockChunker implements Partial<Chunker> {
    // Implement methods if IndexingService calls them
}

export class MockLspService implements Partial<LspService> {
    // Implement methods if IndexingService calls them
}
```

**Code Example (`src/test/contextService.test.ts` - Update Existing Test File):**
```typescript
// src/test/contextService.test.ts
import { expect } from 'chai'; // Assuming Chai for assertions, adjust for Jest/other
import { ContextService } from '../context/contextService';
import { MockQdrantService, MockEmbeddingProvider } from './mocks';

describe('ContextService', () => {
    let mockQdrantService: MockQdrantService;
    let mockEmbeddingProvider: MockEmbeddingProvider;
    let contextService: ContextService;

    beforeEach(() => {
        // Instantiate mocks before each test
        mockQdrantService = new MockQdrantService();
        mockEmbeddingProvider = new MockEmbeddingProvider();

        // Instantiate ContextService with the mocks
        contextService = new ContextService(
            mockQdrantService as any, // Cast to any if using Partial<T> for mocks
            mockEmbeddingProvider as any
        );
    });

    it('should call qdrantService when querying context', async () => {
        // Example: Mock a method call and assert it was called
        const queryStub = (mockQdrantService as any).query = sinon.stub().returns(Promise.resolve([])); // Assuming Sinon for stubbing

        await contextService.queryContext('test query');

        expect(queryStub.calledOnce).to.be.true;
    });

    it('should use embeddingProvider to embed query', async () => {
        const embedStub = (mockEmbeddingProvider as any).embed = sinon.stub().returns(Promise.resolve([0.1, 0.2, 0.3]));

        await contextService.queryContext('another query');

        expect(embedStub.calledOnceWith('another query')).to.be.true;
    });

    // Add more tests to cover various scenarios and edge cases
});
```

**Further Guidance:**
*   **Testing Frameworks:** If not already set up, consider using a testing framework like Mocha with Chai (for assertions) and Sinon (for stubs/spies) or Jest (all-in-one).
*   **Type Safety with Mocks:** Using `Partial<T>` is a quick way to create mocks, but for more robust testing, consider dedicated mocking libraries or manually implementing the full interface/class for mocks.
*   **Configuration Schema:** For `ConfigService`, consider defining a JSON schema for your extension's configuration in `package.json` to provide validation and IntelliSense for users.
*   **Error Handling:** Ensure proper error handling is in place for configuration retrieval (e.g., default values if a setting is missing).
