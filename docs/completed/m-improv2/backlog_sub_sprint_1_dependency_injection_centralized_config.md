### User Story: Dependency Injection & Centralized Configuration

**As a** backend developer (Alisha),
**I want to** refactor core services to use constructor-based dependency injection and centralize configuration,
**so that** I can unit test them with mocks and manage settings in one place, leading to a more maintainable and testable codebase.

**Objective:** To refactor all core services to use constructor-based dependency injection and to receive configuration from a centralized source.

**Workflow:**
1.  Implement the `ConfigService` to encapsulate all VS Code extension settings.
2.  Update constructors of `QdrantService`, `OllamaProvider`, `OpenAIProvider`, `ContextService`, and `IndexingService` to accept their dependencies via constructor arguments.
3.  Modify `EmbeddingProviderFactory` to use the new `ConfigService` for creating embedding providers.
4.  Replace all direct `vscode.workspace.getConfiguration()` calls with calls to the `ConfigService`.
5.  Update existing unit tests and add new ones to reflect the changes, ensuring services can be tested in isolation with mocks.

**List of Files to be Created/Modified:**
-   `src/configService.ts` (New/Implement)
-   `src/db/qdrantService.ts` (Modify)
-   `src/embeddings/ollamaProvider.ts` (Modify)
-   `src/embeddings/openaiProvider.ts` (Modify)
-   `src/embeddings/embeddingProvider.ts` (Modify)
-   `src/context/contextService.ts` (Modify)
-   `src/indexing/indexingService.ts` (Modify)
-   `src/test/mocks.ts` (Modify/Add)
-   `src/test/suite/contextService.test.ts` (Modify)

**Actions to Undertake:**

1.  **Filepath**: `src/configService.ts` (New File)
    -   **Action**: Create and implement the `ConfigService` class. It should read all settings from `vscode.workspace.getConfiguration('code-context-engine')` and provide getter methods for `qdrantConnectionString`, `databaseConfig`, `embeddingProvider`, `ollamaConfig`, `openAIConfig`, `indexingConfig`, `fullConfig`, `isProviderConfigured`, `getCurrentProviderConfig`, and `refresh`.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: `import * as vscode from 'vscode';`

2.  **Filepath**: `src/db/qdrantService.ts`
    -   **Action**: Ensure the constructor accepts `connectionString: string` and remove any direct `vscode.workspace.getConfiguration()` calls.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: None (already present).

3.  **Filepath**: `src/embeddings/ollamaProvider.ts`
    -   **Action**: Ensure the constructor accepts `config: OllamaConfig` and remove any direct `vscode.workspace.getConfiguration()` calls.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: None (already present).

4.  **Filepath**: `src/embeddings/openaiProvider.ts`
    -   **Action**: Ensure the constructor accepts `config: OpenAIConfig` and remove any direct `vscode.workspace.getConfiguration()` calls.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: None (already present).

5.  **Filepath**: `src/embeddings/embeddingProvider.ts`
    -   **Action**: Update the `EmbeddingProviderFactory.createProviderFromConfigService` method to accept `configService: ConfigService` and use its getter methods to retrieve configuration.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: `import { ConfigService } from '../configService';`

6.  **Filepath**: `src/context/contextService.ts`
    -   **Action**: Modify the constructor to accept `qdrantService: QdrantService`, `embeddingProvider: IEmbeddingProvider`, and `configService: ConfigService`. Replace direct `vscode.workspace.getConfiguration()` calls with `configService` calls.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: `import { ConfigService } from '../configService';`

7.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Modify the constructor to accept `configService: ConfigService`. Replace any direct `vscode.workspace.getConfiguration()` calls with `configService` calls.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: `import { ConfigService } from '../configService';`

8.  **Filepath**: `src/test/mocks.ts`
    -   **Action**: Add a `MockConfigService` class that implements the expected `ConfigService` interface for testing purposes.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: `import * as vscode from 'vscode';` (for mocking `vscode.workspace.getConfiguration`)

9.  **Filepath**: `src/test/suite/contextService.test.ts`
    -   **Action**: Update existing unit tests for `ContextService` to use `MockConfigService` and pass it as a dependency to the `ContextService` constructor.
    -   **Implementation**: (See implementation guidance)
    -   **Imports**: `import { MockConfigService } from '../mocks';`

**Acceptance Criteria:**
-   No service uses the `new` keyword to create its long-lived dependencies.
-   No service directly calls `vscode.workspace.getConfiguration()`.
-   Unit tests for services can run without needing the VS Code API.
-   `ConfigService` correctly reads and provides all necessary configuration values.

**Testing Plan:**
-   **Test Case 1**: Verify `ConfigService` correctly retrieves all configuration values (Qdrant connection, Ollama/OpenAI settings, indexing settings) using mocked VS Code workspace configuration.
-   **Test Case 2**: Unit test `QdrantService` with a mocked connection string to ensure it initializes correctly.
-   **Test Case 3**: Unit test `OllamaProvider` and `OpenAIProvider` with mocked `EmbeddingConfig` objects to ensure they generate embeddings correctly without direct configuration access.
-   **Test Case 4**: Unit test `EmbeddingProviderFactory.createProviderFromConfigService` to ensure it correctly creates providers using `ConfigService`.
-   **Test Case 5**: Unit test `ContextService` with mocked `QdrantService`, `IEmbeddingProvider`, and `ConfigService` to verify its functionality in isolation.
-   **Test Case 6**: Unit test `IndexingService` with mocked dependencies (including `ConfigService`) to verify its core logic.
