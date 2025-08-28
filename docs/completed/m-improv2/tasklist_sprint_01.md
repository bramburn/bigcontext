# Task List: Sprint 1 - Dependency Injection & Centralized Configuration

**Goal:** To refactor all core services to use constructor-based dependency injection and to receive configuration from a centralized source.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Create `src/configService.ts`:** Create the file and define the interfaces `DatabaseConfig`, `OllamaConfig`, `OpenAIConfig`, and `IndexingConfig` as provided in the implementation guidance. |
| | | **1.1.1** Implement the `ConfigService` class with a constructor that initializes `this.config` by calling `vscode.workspace.getConfiguration('code-context-engine')`. | `src/configService.ts` (New) |
| | | **1.1.2** Implement the `refresh()` method to re-initialize `this.config`. | `src/configService.ts` |
| | | **1.1.3** Implement getter methods: `getQdrantConnectionString()`, `getDatabaseConfig()`, `getEmbeddingProvider()`, `getOllamaConfig()`, `getOpenAIConfig()`, `getIndexingConfig()`, `getFullConfig()`, `isProviderConfigured()`, and `getCurrentProviderConfig()` as specified in the implementation guidance. | `src/configService.ts` |
| **1.2** | ☐ To Do | **Update `package.json`:** Add new configuration properties under `contributes.configuration.properties` for `code-context-engine.ollamaApiUrl`, `code-context-engine.ollamaMaxBatchSize`, `code-context-engine.ollamaTimeout`, `code-context-engine.openaiMaxBatchSize`, `code-context-engine.openaiTimeout`, `code-context-engine.maxFileSize`, `code-context-engine.indexingChunkSize`, and `code-context-engine.indexingChunkOverlap` as per the implementation guidance. | `package.json` |
| **1.3** | ☐ To Do | **Refactor `src/db/qdrantService.ts`:** Verify that the constructor already accepts `connectionString: string` and no direct `vscode.workspace.getConfiguration()` calls are present. No code changes are expected for this task. | `src/db/qdrantService.ts` |
| **1.4** | ☐ To Do | **Refactor `src/embeddings/ollamaProvider.ts`:** Modify the constructor to accept `config: EmbeddingConfig` and use `config.model`, `config.apiUrl`, `config.maxBatchSize`, and `config.timeout` to initialize properties. Remove any direct `vscode.workspace.getConfiguration()` calls. | `src/embeddings/ollamaProvider.ts` |
| **1.5** | ☐ To Do | **Refactor `src/embeddings/openaiProvider.ts`:** Modify the constructor to accept `config: EmbeddingConfig` and use `config.model`, `config.apiKey`, `config.maxBatchSize`, and `config.timeout` to initialize properties. Remove any direct `vscode.workspace.getConfiguration()` calls. | `src/embeddings/openaiProvider.ts` |
| **1.6** | ☐ To Do | **Refactor `src/embeddings/embeddingProvider.ts`:** Update the `EmbeddingProviderFactory.createProviderFromConfigService` method signature to accept `configService: ConfigService`. | `src/embeddings/embeddingProvider.ts` |
| | | **1.6.1** Modify the logic within `createProviderFromConfigService` to retrieve configuration values using the injected `configService` (e.g., `configService.getOllamaConfig()`, `configService.getOpenAIConfig()`). | `src/embeddings/embeddingProvider.ts` |
| | | **1.6.2** Add `import { ConfigService, OllamaConfig, OpenAIConfig } from '../configService';` to the file. | `src/embeddings/embeddingProvider.ts` |
| **1.7** | ☐ To Do | **Refactor `src/context/contextService.ts`:** Modify the constructor to accept `configService: ConfigService` as an argument. | `src/context/contextService.ts` |
| | | **1.7.1** Replace direct `vscode.workspace.getConfiguration()` calls in `findRelatedFiles` and `queryContext` with calls to `this.configService.getFullConfig()` to retrieve `maxSearchResults` and `minSimilarityThreshold`. | `src/context/contextService.ts` |
| | | **1.7.2** Add `import { ConfigService } from '../configService';` to the file. | `src/context/contextService.ts` |
| **1.8** | ☐ To Do | **Refactor `src/indexing/indexingService.ts`:** Modify the constructor to accept `configService: ConfigService` as an argument. | `src/indexing/indexingService.ts` |
| | | **1.8.1** Replace any direct `vscode.workspace.getConfiguration()` calls with calls to `this.configService.getIndexingConfig()`. | `src/indexing/indexingService.ts` |
| | | **1.8.2** Add `import { ConfigService } from '../configService';` to the file. | `src/indexing/indexingService.ts` |
| **1.9** | ☐ To Do | **Add `MockConfigService` to `src/test/mocks.ts`:** Create a `MockConfigService` class that implements the `ConfigService` interface and provides mock configuration values for testing. | `src/test/mocks.ts` |
| | | **1.9.1** Add `import { ConfigService, DatabaseConfig, OllamaConfig, OpenAIConfig, IndexingConfig } from '../configService';` to the file. | `src/test/mocks.ts` |
| **1.10** | ☐ To Do | **Update `src/test/suite/contextService.test.ts`:** Import `MockConfigService`. | `src/test/suite/contextService.test.ts` |
| | | **1.10.1** Initialize `mockConfigService` in the `setup` function. | `src/test/suite/contextService.test.ts` |
| | | **1.10.2** Pass `mockConfigService` to the `ContextService` and `IndexingService` constructors during instantiation in the `setup` function. | `src/test/suite/contextService.test.ts` |
| | | **1.10.3** Update existing tests to use the injected `mockConfigService` where configuration values are needed, and add new tests as per the acceptance criteria and testing plan in the backlog. | `src/test/suite/contextService.test.ts` |