### How to Implement Sprint 2: Extensible Client Framework

This sprint focuses on designing the core interfaces for our external dependencies (embedding providers and vector databases) and setting up the dependency injection (DI) mechanism to manage their concrete implementations. This is crucial for building a flexible and testable architecture.

**Key Technologies and Concepts:**

*   **Interfaces (C#):** Define contracts for classes, enabling polymorphism and loose coupling.
*   **Dependency Injection (DI):** A software design pattern that allows for the inversion of control, where dependencies are provided to a class rather than the class creating them. ASP.NET Core has a built-in DI container.
*   **Strategy Pattern / Factory Pattern:** Design patterns that can be used to select and provide the correct implementation of an interface at runtime based on configuration or other criteria.
*   **`IServiceProvider` and `GetRequiredService<T>()`:** Core components of the .NET DI system for resolving registered services.

**Detailed Implementation Steps and Code Examples:**

1.  **Enhance `IEmbeddingProvider` Interface:**
    Define the `GenerateEmbeddingsAsync` method, which will be responsible for converting text into numerical vector representations.
    *   **File:** `CodeContext.Core/IEmbeddingProvider.cs`
    *   **Code Example:**
        ```csharp
        using System.Collections.Generic;
        using System.Threading.Tasks;

        namespace CodeContext.Core
        {
            public interface IEmbeddingProvider
            {
                /// <summary>
                /// Generates embeddings for a list of text inputs.
                /// </summary>
                /// <param name="texts">A list of strings to generate embeddings for.</param>
                /// <returns>A list of float arrays, where each array is an embedding for the corresponding text.</returns>
                Task<List<float[]>> GenerateEmbeddingsAsync(List<string> texts);
            }
        }
        ```
    *   **Guidance:** The `List<float[]>` return type is a common representation for embeddings. `Task` indicates an asynchronous operation, which is standard for I/O-bound tasks like API calls.

2.  **Enhance `IVectorDatabaseClient` Interface:**
    Define methods for `UpsertAsync` (inserting/updating vectors) and `QueryAsync` (searching for similar vectors). Also, define helper classes `VectorData` and `QueryResult` for structured data transfer.
    *   **File:** `CodeContext.Core/IVectorDatabaseClient.cs`
    *   **Code Example:**
        ```csharp
        using System.Collections.Generic;
        using System.Threading.Tasks;

        namespace CodeContext.Core
        {
            public interface IVectorDatabaseClient
            {
                /// <summary>
                /// Inserts or updates vectors in the specified collection.
                /// </summary>
                /// <param name="collectionName">The name of the vector collection.</param>
                /// <param name="vectors">A list of VectorData objects to upsert.</param>
                Task UpsertAsync(string collectionName, List<VectorData> vectors);

                /// <summary>
                /// Queries the vector database for similar vectors.
                /// </summary>
                /// <param name="collectionName">The name of the vector collection to query.</param>
                /// <param name="vector">The query vector.</param>
                /// <param name="topK">The number of top similar results to return.</param>
                /// <returns>A list of QueryResult objects.</returns>
                Task<List<QueryResult>> QueryAsync(string collectionName, float[] vector, int topK);
            }

            /// <summary>
            /// Represents a single vector data point to be stored in the database.
            /// </summary>
            public class VectorData
            {
                public string Id { get; set; } // Unique identifier for the vector
                public float[] Vector { get; set; } // The embedding vector itself
                public Dictionary<string, object> Payload { get; set; } // Additional metadata
            }

            /// <summary>
            /// Represents a single query result from the vector database.
            /// </summary>
            public class QueryResult
            {
                public string Id { get; set; } // Identifier of the matched vector
                public double Score { get; set; } // Similarity score
                public Dictionary<string, object> Payload { get; set; } // Associated metadata
            }
        }
        ```
    *   **Guidance:** `Payload` is a `Dictionary<string, object>` to allow flexible metadata storage alongside vectors.

3.  **Create `ClientFactory` for Dynamic Resolution:**
    This factory will be responsible for providing the correct concrete implementation of `IEmbeddingProvider` or `IVectorDatabaseClient` based on a configuration string. This uses the Strategy/Factory pattern.
    *   **File:** `CodeContext.Core/ClientFactory.cs` (New File)
    *   **Code Example:**
        ```csharp
        using System;
        using Microsoft.Extensions.DependencyInjection; // Required for GetRequiredService

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
                    // In a real application, you might use a more sophisticated lookup
                    // or configuration-driven approach. For now, a switch is sufficient.
                    return providerType.ToLowerInvariant() switch
                    {
                        "ollama" => _serviceProvider.GetRequiredService<OllamaProvider>(), // OllamaProvider will be registered in Program.cs
                        _ => throw new ArgumentException($"Unknown embedding provider type: {providerType}")
                    };
                }

                public IVectorDatabaseClient GetVectorDatabaseClient(string clientType)
                {
                    return clientType.ToLowerInvariant() switch
                    {
                        "qdrant" => _serviceProvider.GetRequiredService<QdrantClient>(), // QdrantClient will be registered in Program.cs
                        _ => throw new ArgumentException($"Unknown vector database client type: {clientType}")
                    };
                }
            }
        }
        ```
    *   **Guidance:** The `ClientFactory` takes `IServiceProvider` in its constructor, allowing it to resolve other services (our concrete client implementations) at runtime. Note that `OllamaProvider` and `QdrantClient` are concrete types that will be implemented and registered in later sprints.

4.  **Register `ClientFactory` with DI Container:**
    Add the `ClientFactory` as a singleton service in `Program.cs` so it can be injected wherever needed.
    *   **File:** `CodeContext.Api/Program.cs`
    *   **Code Example (add in `builder.Services` section):**
        ```csharp
        using CodeContext.Core; // Add this import at the top

        // ... existing code ...
        builder.Services.AddSingleton<ClientFactory>();

        // In later sprints, you will register concrete implementations like this:
        // builder.Services.AddSingleton<OllamaProvider>();
        // builder.Services.AddSingleton<QdrantClient>();
        // builder.Services.AddSingleton<IEmbeddingProvider, OllamaProvider>(); // If you want to directly inject the interface
        // builder.Services.AddSingleton<IVectorDatabaseClient, QdrantClient>(); // If you want to directly inject the interface
        ```
    *   **Guidance:** `AddSingleton` ensures only one instance of `ClientFactory` is created and reused throughout the application's lifetime.

**Verification:**

*   Ensure the solution builds successfully after these changes.
*   While direct runtime testing of the factory's resolution capabilities is limited without concrete implementations, you can write unit tests in a separate test project (e.g., `CodeContext.Tests`) to verify the factory's logic.
    *   **Example Unit Test (Conceptual):**
        ```csharp
        // In CodeContext.Tests/ClientFactoryTests.cs
        using Xunit;
        using Microsoft.Extensions.DependencyInjection;
        using CodeContext.Core;
        using Moq; // For mocking interfaces

        public class ClientFactoryTests
        {
            [Fact]
            public void GetEmbeddingProvider_ReturnsOllamaProvider_WhenOllamaTypeIsRequested()
            {
                // Arrange
                var services = new ServiceCollection();
                var mockOllamaProvider = new Mock<IEmbeddingProvider>(); // Mock the concrete provider
                services.AddSingleton(mockOllamaProvider.Object); // Register the mock as the concrete type
                services.AddSingleton<ClientFactory>();
                var serviceProvider = services.BuildServiceProvider();
                var factory = serviceProvider.GetRequiredService<ClientFactory>();

                // Act
                var provider = factory.GetEmbeddingProvider("ollama");

                // Assert
                Assert.NotNull(provider);
                // You might assert the type if OllamaProvider was a concrete class,
                // but here we are just checking if a service was returned.
            }

            // Add similar tests for IVectorDatabaseClient
        }
        ```
    *   **Guidance:** This conceptual test demonstrates how you would set up a test environment using `ServiceCollection` and `Moq` (a mocking library) to verify the factory's behavior.
