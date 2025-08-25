### User Story 1: Implement Qdrant Client
**As Alisha, I want to** implement the concrete client for Qdrant, **so that** the backend can communicate with the vector database.

**Actions to Undertake:**
1.  **Filepath**: `CodeContext.Infrastructure/CodeContext.Infrastructure.csproj`
    -   **Action**: Add the `Qdrant.Client` NuGet package.
    -   **Implementation**:
        ```xml
        <ItemGroup>
            <PackageReference Include="Qdrant.Client" Version="1.x.x" /> <!-- Use the latest stable version -->
        </ItemGroup>
        ```
    -   **Imports**: None.
2.  **Filepath**: `CodeContext.Infrastructure/DatabaseClients/QdrantClient.cs` (New File)
    -   **Action**: Create `QdrantClient` class implementing `IVectorDatabaseClient` and its `UpsertAsync` method.
    -   **Implementation**:
        ```csharp
        using System.Collections.Generic;
        using System.Linq;
        using System.Threading.Tasks;
        using CodeContext.Core; // For IVectorDatabaseClient, VectorData, QueryResult
        using Qdrant.Client;
        using Qdrant.Client.Grpc;

        namespace CodeContext.Infrastructure.DatabaseClients
        {
            public class QdrantClient : IVectorDatabaseClient
            {
                private readonly QdrantGrpcClient _client;
                private readonly string _host;
                private readonly int _port;

                public QdrantClient(string host, int port)
                {
                    _host = host;
                    _port = port;
                    _client = new QdrantGrpcClient(host, port);
                }

                public async Task UpsertAsync(string collectionName, List<VectorData> vectors)
                {
                    // Ensure collection exists (or create it)
                    var collections = await _client.Collections.ListAsync();
                    if (!collections.Any(c => c.Name == collectionName))
                    {
                        await _client.Collections.CreateAsync(
                            collectionName,
                            new VectorParams { Size = vectors.First().Vector.Length, Distance = Distance.Cosine } // Assuming all vectors have same size
                        );
                    }

                    var points = vectors.Select(v => new PointStruct
                    {
                        Id = v.Id,
                        Vectors = v.Vector.ToList(),
                        Payload = v.Payload.ToDictionary(p => p.Key, p => Value.From(p.Value)) // Convert payload to Qdrant's Value
                    }).ToList();

                    await _client.Points.UpsertAsync(collectionName, points);
                }

                public async Task<List<QueryResult>> QueryAsync(string collectionName, float[] vector, int topK)
                {
                    var searchResult = await _client.Points.SearchAsync(
                        collectionName,
                        vector.ToList(),
                        limit: (ulong)topK
                    );

                    return searchResult.Select(s => new QueryResult
                    {
                        Id = s.Id,
                        Score = s.Score,
                        Payload = s.Payload.ToDictionary(p => p.Key, p => p.Value.ToValue()) // Convert Qdrant's Value back to object
                    }).ToList();
                }
            }
        }
        ```
    -   **Imports**: `using System.Collections.Generic;`, `using System.Linq;`, `using System.Threading.Tasks;`, `using CodeContext.Core;`, `using Qdrant.Client;`, `using Qdrant.Client.Grpc;`

### User Story 2: Implement Ollama Provider
**As Alisha, I want to** implement the concrete client for Ollama, **so that** the backend can generate embeddings.

**Actions to Undertake:**
1.  **Filepath**: `CodeContext.Infrastructure/EmbeddingProviders/OllamaProvider.cs` (New File)
    -   **Action**: Create `OllamaProvider` class implementing `IEmbeddingProvider` and its `GenerateEmbeddingsAsync` method.
    -   **Implementation**:
        ```csharp
        using System.Collections.Generic;
        using System.Linq;
        using System.Net.Http;
        using System.Text;
        using System.Text.Json;
        using System.Threading.Tasks;
        using CodeContext.Core; // For IEmbeddingProvider

        namespace CodeContext.Infrastructure.EmbeddingProviders
        {
            public class OllamaProvider : IEmbeddingProvider
            {
                private readonly HttpClient _httpClient;
                private readonly string _ollamaApiUrl;
                private readonly string _modelName;

                public OllamaProvider(HttpClient httpClient, string ollamaApiUrl, string modelName)
                {
                    _httpClient = httpClient;
                    _ollamaApiUrl = ollamaApiUrl;
                    _modelName = modelName;
                }

                public async Task<List<float[]>> GenerateEmbeddingsAsync(List<string> texts)
                {
                    var embeddings = new List<float[]>();
                    foreach (var text in texts)
                    {
                        var requestBody = new
                        {
                            model = _modelName,
                            prompt = text
                        };

                        var json = JsonSerializer.Serialize(requestBody);
                        var content = new StringContent(json, Encoding.UTF8, "application/json");

                        var response = await _httpClient.PostAsync($"{_ollamaApiUrl}/api/embeddings", content);
                        response.EnsureSuccessStatusCode(); // Throws an exception if not 2xx

                        var responseBody = await response.Content.ReadAsStringAsync();
                        var jsonDoc = JsonDocument.Parse(responseBody);
                        var embeddingArray = jsonDoc.RootElement.GetProperty("embedding").EnumerateArray().Select(e => (float)e.GetDouble()).ToArray();
                        embeddings.Add(embeddingArray);
                    }
                    return embeddings;
                }
            }
        }
        ```
    -   **Imports**: `using System.Collections.Generic;`, `using System.Linq;`, `using System.Net.Http;`, `using System.Text;`, `using System.Text.Json;`, `using System.Threading.Tasks;`, `using CodeContext.Core;`

### User Story 3: Implement AST Parsing and Indexing Service
**As Alisha, I want to** integrate AST parsing and create an indexing service, **so that** the backend can process code and store embeddings.

**Actions to Undertake:**
1.  **Filepath**: `CodeContext.Core/Services/ParsingService.cs` (New File)
    -   **Action**: Create `ParsingService` to handle Abstract Syntax Tree (AST) parsing of code files. (Conceptual, as specific AST library is not chosen yet).
    -   **Implementation**:
        ```csharp
        using System.Collections.Generic;
        using System.Threading.Tasks;

        namespace CodeContext.Core.Services
        {
            public class ParsingService
            {
                public Task<List<string>> ParseCodeFileAsync(string filePath)
                {
                    // This is a placeholder. Actual implementation would use a library
                    // like Microsoft.CodeAnalysis (Roslyn) for C#, or similar for other languages.
                    // It would extract meaningful code snippets, function definitions, etc.
                    return Task.FromResult(new List<string> { $"Content of {filePath} for embedding." });
                }
            }
        }
        ```
    -   **Imports**: `using System.Collections.Generic;`, `using System.Threading.Tasks;`
2.  **Filepath**: `CodeContext.Core/Services/IndexingService.cs` (New File)
    -   **Action**: Create `IndexingService` to orchestrate the indexing workflow (parsing, embedding, upserting).
    -   **Implementation**:
        ```csharp
        using System.Collections.Generic;
        using System.Threading.Tasks;
        using CodeContext.Core; // For IEmbeddingProvider, IVectorDatabaseClient, VectorData

        namespace CodeContext.Core.Services
        {
            public class IndexingService
            {
                private readonly ParsingService _parsingService;
                private readonly IEmbeddingProvider _embeddingProvider;
                private readonly IVectorDatabaseClient _vectorDatabaseClient;

                public IndexingService(
                    ParsingService parsingService,
                    IEmbeddingProvider embeddingProvider,
                    IVectorDatabaseClient vectorDatabaseClient)
                {
                    _parsingService = parsingService;
                    _embeddingProvider = embeddingProvider;
                    _vectorDatabaseClient = vectorDatabaseClient;
                }

                public async Task IndexRepositoryAsync(string repositoryPath, string collectionName)
                {
                    // Placeholder: In a real scenario, you'd enumerate files in repositoryPath
                    // and process them.
                    var filePaths = new List<string> {
                        "path/to/file1.cs",
                        "path/to/file2.ts"
                    };

                    foreach (var filePath in filePaths)
                    {
                        var codeSnippets = await _parsingService.ParseCodeFileAsync(filePath);
                        if (codeSnippets.Any())
                        {
                            var embeddings = await _embeddingProvider.GenerateEmbeddingsAsync(codeSnippets);

                            var vectorsToUpsert = new List<VectorData>();
                            for (int i = 0; i < embeddings.Count; i++)
                            {
                                vectorsToUpsert.Add(new VectorData
                                {
                                    Id = $"{filePath}_{i}", // Unique ID for each snippet
                                    Vector = embeddings[i],
                                    Payload = new Dictionary<string, object> { { "filePath", filePath }, { "snippet", codeSnippets[i] } }
                                });
                            }
                            await _vectorDatabaseClient.UpsertAsync(collectionName, vectorsToUpsert);
                        }
                    }
                }
            }
        }
        ```
    -   **Imports**: `using System.Collections.Generic;`, `using System.Threading.Tasks;`, `using CodeContext.Core;`

### User Story 4: Register Services and Create Index Endpoint
**As Alisha, I want to** register all new services with the DI container and create an `/index` endpoint, **so that** the API can trigger the indexing process.

**Actions to Undertake:**
1.  **Filepath**: `CodeContext.Api/Program.cs`
    -   **Action**: Register `QdrantClient`, `OllamaProvider`, `ParsingService`, and `IndexingService` with the DI container.
    -   **Implementation**:
        ```csharp
        using CodeContext.Core;
        using CodeContext.Core.Services;
        using CodeContext.Infrastructure.DatabaseClients;
        using CodeContext.Infrastructure.EmbeddingProviders;
        using System.Net.Http; // For HttpClient

        // ... existing builder.Services ...

        // Register HttpClient for OllamaProvider
        builder.Services.AddHttpClient<OllamaProvider>(); // Registers HttpClient and OllamaProvider

        // Register concrete client implementations
        // For QdrantClient, you might need configuration for host/port
        builder.Services.AddSingleton<IVectorDatabaseClient>(sp =>
        {
            // Read configuration for Qdrant host/port
            var configuration = sp.GetRequiredService<IConfiguration>();
            var qdrantHost = configuration["Qdrant:Host"] ?? "localhost";
            var qdrantPort = int.Parse(configuration["Qdrant:Port"] ?? "6334");
            return new QdrantClient(qdrantHost, qdrantPort);
        });

        builder.Services.AddSingleton<IEmbeddingProvider>(sp =>
        {
            // Read configuration for Ollama API URL and model name
            var configuration = sp.GetRequiredService<IConfiguration>();
            var ollamaApiUrl = configuration["Ollama:ApiUrl"] ?? "http://localhost:11434";
            var ollamaModel = configuration["Ollama:Model"] ?? "llama2"; // Default model
            var httpClient = sp.GetRequiredService<HttpClient>(); // Get HttpClient from DI
            return new OllamaProvider(httpClient, ollamaApiUrl, ollamaModel);
        });

        // Register services
        builder.Services.AddSingleton<ParsingService>();
        builder.Services.AddSingleton<IndexingService>();

        // ... existing app.MapGet("/health") ...
        ```
    -   **Imports**: `using CodeContext.Core;`, `using CodeContext.Core.Services;`, `using CodeContext.Infrastructure.DatabaseClients;`, `using CodeContext.Infrastructure.EmbeddingProviders;`, `using System.Net.Http;`, `using Microsoft.Extensions.Configuration;`
2.  **Filepath**: `CodeContext.Api/Program.cs`
    -   **Action**: Create a `POST /index` endpoint that triggers the `IndexingService`.
    -   **Implementation**:
        ```csharp
        // ... existing app.MapGet("/health") ...

        app.MapPost("/index", async (IndexingService indexingService) =>
        {
            // In a real scenario, you'd get the repository path from the request or configuration
            // For now, use a placeholder or read from appsettings.json
            var repositoryPath = "/path/to/your/code/repository"; // Placeholder
            var collectionName = "code_context_collection"; // Placeholder

            await indexingService.IndexRepositoryAsync(repositoryPath, collectionName);
            return Results.Ok("Indexing started.");
        });

        app.Run();
        ```
    -   **Imports**: None.

**Acceptance Criteria:**
-   `Qdrant.Client` NuGet package is added to `CodeContext.Infrastructure`.
-   `QdrantClient` class implements `IVectorDatabaseClient` and correctly handles `UpsertAsync` and `QueryAsync` (though `QueryAsync` is not explicitly tested in this sprint's AC).
-   `OllamaProvider` class implements `IEmbeddingProvider` and correctly makes HTTP requests to Ollama and parses responses.
-   `ParsingService` and `IndexingService` classes are created in `CodeContext.Core/Services`.
-   All new services (`QdrantClient`, `OllamaProvider`, `ParsingService`, `IndexingService`) are registered with the DI container in `Program.cs`.
-   A `POST /index` endpoint exists in the API that triggers the `IndexingService`.

**Testing Plan:**
-   **Test Case 1**: Build the C# solution (`dotnet build CodeContext.sln`). Ensure no compilation errors.
-   **Test Case 2**: Run the API project (`dotnet run --project CodeContext.Api`).
-   **Test Case 3**: Use a tool like Postman or `curl` to send a `POST` request to `http://localhost:<port>/index`. Verify a `200 OK` response and that the indexing process (even if placeholder) is initiated.
-   **Test Case 4**: (Requires local Qdrant and Ollama instances) Start local Qdrant and Ollama containers. Run the API and trigger the `/index` endpoint. Observe logs for successful communication with Qdrant and Ollama. Verify data is inserted into Qdrant (e.g., using Qdrant's API or UI).
-   **Test Case 5**: (Unit Tests) Write unit tests for `QdrantClient` and `OllamaProvider` using mocking frameworks (e.g., Moq) to ensure their methods behave as expected without requiring actual external services.
