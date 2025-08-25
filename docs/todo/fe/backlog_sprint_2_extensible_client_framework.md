### User Story 1: Define Abstract Interfaces for Clients
**As Alisha, I want to** define abstract interfaces for database clients and embedding providers, **so that** we can easily add new implementations in the future.

**Actions to Undertake:**
1.  **Filepath**: `CodeContext.Core/IEmbeddingProvider.cs`
    -   **Action**: Add `GenerateEmbeddingsAsync` method to `IEmbeddingProvider` interface.
    -   **Implementation**:
        ```csharp
        using System.Collections.Generic;
        using System.Threading.Tasks;

        namespace CodeContext.Core
        {
            public interface IEmbeddingProvider
            {
                Task<List<float[]>> GenerateEmbeddingsAsync(List<string> texts);
            }
        }
        ```
    -   **Imports**: `using System.Collections.Generic;`, `using System.Threading.Tasks;`
2.  **Filepath**: `CodeContext.Core/IVectorDatabaseClient.cs`
    -   **Action**: Add `UpsertAsync` and `QueryAsync` methods to `IVectorDatabaseClient` interface.
    -   **Implementation**:
        ```csharp
        using System.Collections.Generic;
        using System.Threading.Tasks;

        namespace CodeContext.Core
        {
            public interface IVectorDatabaseClient
            {
                Task UpsertAsync(string collectionName, List<VectorData> vectors);
                Task<List<QueryResult>> QueryAsync(string collectionName, float[] vector, int topK);
            }

            public class VectorData
            {
                public string Id { get; set; }
                public float[] Vector { get; set; }
                public Dictionary<string, object> Payload { get; set; }
            }

            public class QueryResult
            {
                public string Id { get; set; }
                public double Score { get; set; }
                public Dictionary<string, object> Payload { get; set; }
            }
        }
        ```
    -   **Imports**: `using System.Collections.Generic;`, `using System.Threading.Tasks;`

### User Story 2: Implement Dependency Injection for Clients
**As Alisha, I want to** use dependency injection to register and resolve these clients, **so that** the application is loosely coupled and testable.

**Actions to Undertake:**
1.  **Filepath**: `CodeContext.Api/Program.cs`
    -   **Action**: Configure .NET's built-in dependency injection container.
    -   **Implementation**: (This is more about how to use DI, not a specific code snippet to add, but rather how to register services. I'll provide a conceptual example.)
        ```csharp
        // Example: Registering a concrete implementation (will be done in later sprints)
        // builder.Services.AddSingleton<IEmbeddingProvider, OllamaProvider>();
        // builder.Services.AddSingleton<IVectorDatabaseClient, QdrantClient>();
        ```
    -   **Imports**: None.
2.  **Filepath**: `CodeContext.Core/ClientFactory.cs` (New File)
    -   **Action**: Create a `ClientFactory` or `ClientStrategy` service that can resolve the correct client implementation based on a configuration string.
    -   **Implementation**:
        ```csharp
        using System;
        using Microsoft.Extensions.DependencyInjection;

        namespace CodeContext.Core
        {
            public class ClientFactory
            {
                private readonly IServiceProvider _serviceProvider;

                public ClientFactory(IServiceProvider serviceProvider)
                {
                    _serviceProvider = serviceProvider;
                }

                public IEmbeddingProvider GetEmbeddingProvider(string providerType)
                {
                    return providerType.ToLowerInvariant() switch
                    {
                        "ollama" => _serviceProvider.GetRequiredService<OllamaProvider>(), // Concrete type will be registered
                        _ => throw new ArgumentException($"Unknown embedding provider type: {providerType}")
                    };
                }

                public IVectorDatabaseClient GetVectorDatabaseClient(string clientType)
                {
                    return clientType.ToLowerInvariant() switch
                    {
                        "qdrant" => _serviceProvider.GetRequiredService<QdrantClient>(), // Concrete type will be registered
                        _ => throw new ArgumentException($"Unknown vector database client type: {clientType}")
                    };
                }
            }
        }
        ```
    -   **Imports**: `using System;`, `using Microsoft.Extensions.DependencyInjection;`
3.  **Filepath**: `CodeContext.Api/Program.cs`
    -   **Action**: Register the `ClientFactory` with the DI container.
    -   **Implementation**:
        ```csharp
        builder.Services.AddSingleton<ClientFactory>();
        ```
    -   **Imports**: `using CodeContext.Core;`

**Acceptance Criteria:**
-   `IEmbeddingProvider` interface in `CodeContext.Core` includes `GenerateEmbeddingsAsync(List<string> texts)` method.
-   `IVectorDatabaseClient` interface in `CodeContext.Core` includes `UpsertAsync(string collectionName, List<VectorData> vectors)` and `QueryAsync(string collectionName, float[] vector, int topK)` methods, along with `VectorData` and `QueryResult` classes.
-   .NET's built-in dependency injection container is configured to allow registration and resolution of these interfaces.
-   A `ClientFactory` class exists in `CodeContext.Core` that can resolve client implementations based on a string.
-   The `ClientFactory` is registered with the DI container.
-   Unit tests (to be written in a separate test project) verify that the correct client is returned for a given configuration.

**Testing Plan:**
-   **Test Case 1**: (Conceptual, as concrete implementations are not yet present) Verify that the `IEmbeddingProvider` and `IVectorDatabaseClient` interfaces compile without errors.
-   **Test Case 2**: (Conceptual) Write a simple console application or a unit test project that attempts to resolve `ClientFactory` from the DI container and then calls its `GetEmbeddingProvider` and `GetVectorDatabaseClient` methods with dummy strings (e.g., "ollama", "qdrant") to ensure it compiles and the factory logic is sound (it will throw exceptions until concrete types are registered).
-   **Test Case 3**: (Conceptual) Ensure the `VectorData` and `QueryResult` classes are correctly defined and accessible.
