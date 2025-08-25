### How to Implement Sprint 5: Concrete Client Implementation (C#)

This sprint is about bringing our abstract interfaces to life by implementing concrete clients for Qdrant (vector database) and Ollama (embedding provider). We will also introduce the core indexing logic that orchestrates the parsing, embedding, and storage of code context.

**Key Technologies and Concepts:**

*   **Qdrant.Client NuGet Package:** The official .NET client library for interacting with Qdrant.
*   **`HttpClient` (C#):** For making HTTP requests to the Ollama API.
*   **`System.Text.Json`:** For JSON serialization and deserialization when communicating with Ollama.
*   **Abstract Syntax Tree (AST) Parsing:** The process of analyzing source code to build a tree-like representation of its structure. For C#, `Microsoft.CodeAnalysis` (Roslyn) is the standard. For other languages, you'd use appropriate libraries.
*   **Dependency Injection (DI):** Continues to be crucial for injecting our new concrete clients and services.
*   **`IConfiguration`:** For reading settings like API URLs and model names from `appsettings.json`.

**Detailed Implementation Steps and Code Examples:**

1.  **Add Qdrant.Client NuGet Package:**
    Install the official Qdrant .NET client library into your `CodeContext.Infrastructure` project.
    *   **Command:**
        ```bash
        dotnet add CodeContext.Infrastructure/CodeContext.Infrastructure.csproj package Qdrant.Client
        ```
    *   **Guidance:** Always check NuGet.org for the latest stable version.

2.  **Implement `QdrantClient` Class:**
    Create a class that implements `IVectorDatabaseClient` and uses the `Qdrant.Client` library to perform upsert and query operations.
    *   **File:** `CodeContext.Infrastructure/DatabaseClients/QdrantClient.cs`
    *   **Code Example:**
        ```csharp
        using System.Collections.Generic;
        using System.Linq;
        using System.Threading.Tasks;
        using CodeContext.Core; // For IVectorDatabaseClient, VectorData, QueryResult
        using Qdrant.Client;
        using Qdrant.Client.Grpc; // For PointStruct, VectorParams, Distance, etc.

        namespace CodeContext.Infrastructure.DatabaseClients
        {
            public class QdrantClient : IVectorDatabaseClient
            {
                private readonly QdrantGrpcClient _client;
                private readonly string _collectionName; // Default collection name

                public QdrantClient(string host, int port, string collectionName = "code_context_collection")
                {
                    _client = new QdrantGrpcClient(host, port);
                    _collectionName = collectionName;
                }

                public async Task UpsertAsync(string collectionName, List<VectorData> vectors)
                {
                    if (!vectors.Any()) return;

                    // Ensure collection exists or create it.
                    // In a production app, you might check this once on startup or have a dedicated migration.
                    var collections = await _client.Collections.ListAsync();
                    if (!collections.Any(c => c.Name == collectionName))
                    {
                        // Assuming all vectors have the same dimension (size) and cosine distance
                        await _client.Collections.CreateAsync(
                            collectionName,
                            new VectorParams { Size = (ulong)vectors.First().Vector.Length, Distance = Distance.Cosine }
                        );
                    }

                    // Convert our generic VectorData to Qdrant's PointStruct
                    var points = vectors.Select(v => new PointStruct
                    {
                        Id = v.Id, // Qdrant uses string IDs
                        Vectors = v.Vector.ToList(), // Convert float[] to List<float>
                        Payload = v.Payload.ToDictionary(
                            p => p.Key,
                            p => Value.From(p.Value) // Convert generic object to Qdrant's Value type
                        )
                    }).ToList();

                    // Perform the upsert operation
                    await _client.Points.UpsertAsync(collectionName, points);
                }

                public async Task<List<QueryResult>> QueryAsync(string collectionName, float[] vector, int topK)
                {
                    var searchResult = await _client.Points.SearchAsync(
                        collectionName,
                        vector.ToList(), // Convert float[] to List<float>
                        limit: (ulong)topK
                    );

                    // Convert Qdrant's SearchPoint to our generic QueryResult
                    return searchResult.Select(s => new QueryResult
                    {
                        Id = s.Id,
                        Score = s.Score,
                        Payload = s.Payload.ToDictionary(
                            p => p.Key,
                            p => p.Value.ToValue() // Convert Qdrant's Value back to generic object
                        )
                    }).ToList();
                }
            }
        }
        ```
    *   **Guidance:**
        *   `QdrantGrpcClient`: The main client for gRPC communication with Qdrant.
        *   `Value.From(object)` and `Value.ToValue()`: Helper methods for converting between C# objects and Qdrant's internal `Value` type for payload data.
        *   Collection creation: The example includes logic to create the collection if it doesn't exist. In a real application, this might be handled during setup or migration.

3.  **Implement `OllamaProvider` Class:**
    Create a class that implements `IEmbeddingProvider` and makes HTTP POST requests to a local Ollama instance to generate embeddings.
    *   **File:** `CodeContext.Infrastructure/EmbeddingProviders/OllamaProvider.cs`
    *   **Code Example:**
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
                            prompt = text,
                            // You might add options like "keep_alive" for performance
                            // options = new { temperature = 0.0 }
                        };

                        var json = JsonSerializer.Serialize(requestBody);
                        var content = new StringContent(json, Encoding.UTF8, "application/json");

                        var response = await _httpClient.PostAsync($"{_ollamaApiUrl}/api/embeddings", content);
                        response.EnsureSuccessStatusCode(); // Throws an exception for non-2xx status codes

                        var responseBody = await response.Content.ReadAsStringAsync();
                        using (JsonDocument jsonDoc = JsonDocument.Parse(responseBody))
                        {
                            var embeddingArray = jsonDoc.RootElement.GetProperty("embedding").EnumerateArray()
                                .Select(e => (float)e.GetDouble())
                                .ToArray();
                            embeddings.Add(embeddingArray);
                        }
                    }
                    return embeddings;
                }
            }
        }
        ```
    *   **Guidance:**
        *   `HttpClient`: Best practice is to use `IHttpClientFactory` for managing `HttpClient` instances in ASP.NET Core. This is handled by `builder.Services.AddHttpClient<OllamaProvider>();` in `Program.cs`.
        *   Ollama API: The `/api/embeddings` endpoint expects a JSON payload with `model` and `prompt`.
        *   `JsonSerializer`: Used for serializing C# objects to JSON and deserializing JSON responses.

4.  **Add AST Parsing Logic (Placeholder):**
    Create a `ParsingService` that will eventually use an AST library to extract meaningful code snippets. For C#, `Microsoft.CodeAnalysis` (Roslyn) is the go-to.
    *   **File:** `CodeContext.Core/Services/ParsingService.cs`
    *   **Code Example:**
        ```csharp
        using System.Collections.Generic;
        using System.IO;
        using System.Threading.Tasks;

        namespace CodeContext.Core.Services
        {
            public class ParsingService
            {
                /// <summary>
                /// Parses a code file and extracts relevant text snippets for embedding.
                /// This is a placeholder; actual implementation would use an AST library.
                /// </summary>
                /// <param name="filePath">The path to the code file.</param>
                /// <returns>A list of text snippets extracted from the file.</returns>
                public async Task<List<string>> ParseCodeFileAsync(string filePath)
                {
                    if (!File.Exists(filePath))
                    {
                        return new List<string>();
                    }

                    // For now, just return the entire file content as a single snippet.
                    // In a real implementation:
                    // - Use Roslyn for C# files (Microsoft.CodeAnalysis.CSharp)
                    // - Use other parsers for TypeScript, Python, etc.
                    // - Break down code into functions, classes, comments, etc.
                    var content = await File.ReadAllTextAsync(filePath);
                    return new List<string> { content };
                }
            }
        }
        ```
    *   **Guidance:** For C# parsing, you would add `Microsoft.CodeAnalysis.CSharp` NuGet package and use its APIs to traverse the syntax tree.

5.  **Create `IndexingService`:**
    This service orchestrates the entire indexing workflow: reading files, parsing them, generating embeddings, and upserting to the vector database.
    *   **File:** `CodeContext.Core/Services/IndexingService.cs`
    *   **Code Example:**
        ```csharp
        using System.Collections.Generic;
        using System.Linq;
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

                /// <summary>
                /// Indexes a given code repository by parsing files, generating embeddings,
                /// and storing them in the vector database.
                /// </summary>
                /// <param name="repositoryPath">The root path of the code repository.</param>
                /// <param name="collectionName">The name of the Qdrant collection to use.</param>
                public async Task IndexRepositoryAsync(string repositoryPath, string collectionName)
                {
                    // TODO: Implement actual file enumeration (e.g., using Directory.EnumerateFiles)
                    // and filtering (e.g., .gitignore, file extensions).
                    var dummyFilePaths = new List<string> { 
                        Path.Combine(repositoryPath, "src", "Program.cs"), 
                        Path.Combine(repositoryPath, "src", "Utils.ts") 
                    };

                    foreach (var filePath in dummyFilePaths)
                    {
                        Console.WriteLine($"Indexing file: {filePath}"); // For logging progress
                        var codeSnippets = await _parsingService.ParseCodeFileAsync(filePath);

                        if (codeSnippets.Any())
                        {
                            var embeddings = await _embeddingProvider.GenerateEmbeddingsAsync(codeSnippets);

                            var vectorsToUpsert = new List<VectorData>();
                            for (int i = 0; i < embeddings.Count; i++)
                            {
                                vectorsToUpsert.Add(new VectorData
                                {
                                    Id = $"{filePath.Replace("\", "/")}_{i}", // Create a unique ID, normalize path
                                    Vector = embeddings[i],
                                    Payload = new Dictionary<string, object>
                                    {
                                        { "filePath", filePath },
                                        { "snippet", codeSnippets[i] }
                                    }
                                });
                            }
                            await _vectorDatabaseClient.UpsertAsync(collectionName, vectorsToUpsert);
                            Console.WriteLine($"Indexed {embeddings.Count} snippets from {filePath}");
                        }
                    }
                    Console.WriteLine("Indexing complete.");
                }
            }
        }
        ```
    *   **Guidance:** This service takes dependencies on `ParsingService`, `IEmbeddingProvider`, and `IVectorDatabaseClient`, which will be injected by DI.

6.  **Register Services with DI Container:**
    Update `Program.cs` in the API project to register all the new concrete implementations and services.
    *   **File:** `CodeContext.Api/Program.cs`
    *   **Code Example (within `builder.Services` section):**
        ```csharp
        using CodeContext.Core;
        using CodeContext.Core.Services;
        using CodeContext.Infrastructure.DatabaseClients;
        using CodeContext.Infrastructure.EmbeddingProviders;
        using Microsoft.Extensions.Configuration; // For IConfiguration
        using System.Net.Http; // For HttpClient

        // ... existing services ...

        // Register HttpClient for OllamaProvider (best practice for HttpClient management)
        builder.Services.AddHttpClient(); // Registers a default HttpClient

        // Register concrete client implementations as singletons
        builder.Services.AddSingleton<IVectorDatabaseClient>(sp =>
        {
            var configuration = sp.GetRequiredService<IConfiguration>();
            var qdrantHost = configuration["Qdrant:Host"] ?? "localhost";
            var qdrantPort = int.Parse(configuration["Qdrant:Port"] ?? "6334");
            var collectionName = configuration["Qdrant:CollectionName"] ?? "code_context_collection";
            return new QdrantClient(qdrantHost, qdrantPort, collectionName);
        });

        builder.Services.AddSingleton<IEmbeddingProvider>(sp =>
        {
            var configuration = sp.GetRequiredService<IConfiguration>();
            var ollamaApiUrl = configuration["Ollama:ApiUrl"] ?? "http://localhost:11434";
            var ollamaModel = configuration["Ollama:Model"] ?? "llama2"; // Default model
            var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
            var httpClient = httpClientFactory.CreateClient(); // Get a named client if needed, or default
            return new OllamaProvider(httpClient, ollamaApiUrl, ollamaModel);
        });

        // Register core services
        builder.Services.AddSingleton<ParsingService>();
        builder.Services.AddSingleton<IndexingService>();

        // ... existing app.MapGet("/health") ...
        ```
    *   **Guidance:**
        *   `AddHttpClient()`: Registers `IHttpClientFactory`, which is used to create `HttpClient` instances.
        *   `IConfiguration`: You'll need to add `appsettings.json` to your `CodeContext.Api` project to configure Qdrant and Ollama settings.
            ```json
            // appsettings.json
            {
              "Logging": {
                "LogLevel": {
                  "Default": "Information",
                  "Microsoft.AspNetCore": "Warning"
                }
              },
              "AllowedHosts": "*",
              "Qdrant": {
                "Host": "localhost",
                "Port": 6334,
                "CollectionName": "code_context_collection"
              },
              "Ollama": {
                "ApiUrl": "http://localhost:11434",
                "Model": "llama2"
              }
            }
            ```

7.  **Create `/index` Endpoint:**
    Add a new minimal API endpoint that triggers the `IndexingService`.
    *   **File:** `CodeContext.Api/Program.cs`
    *   **Code Example (add before `app.Run();`):**
        ```csharp
        // ... existing endpoints ...

        app.MapPost("/index", async (IndexingService indexingService) =>
        {
            // In a real application, the repository path would come from the request
            // or be managed by the extension. For now, use a hardcoded path or read from config.
            var repositoryPath = "/Users/bramburn/dev/bigcontext"; // Example: Use the current project root
            var collectionName = "code_context_collection"; // Should match Qdrant config

            try
            {
                await indexingService.IndexRepositoryAsync(repositoryPath, collectionName);
                return Results.Ok("Indexing process completed successfully.");
            }
            catch (Exception ex)
            {
                return Results.Problem($"Indexing failed: {ex.Message}", statusCode: 500);
            }
        });

        app.Run();
        ```
    *   **Guidance:** The `IndexingService` is automatically injected into the endpoint handler. Add error handling for robustness.

**Verification:**

*   **Prerequisites:** Ensure you have a local Qdrant instance running (e.g., via Docker) and Ollama installed with a model downloaded (e.g., `ollama run llama2`).
*   **Build and Run:** Build your C# solution (`dotnet build`) and run the API project (`dotnet run --project CodeContext.Api`).
*   **Test `/health`:** Confirm `http://localhost:<port>/health` returns 200 OK.
*   **Test `/index`:** Use a tool like Postman, Insomnia, or `curl` to send a `POST` request to `http://localhost:<port>/index`.
    *   `curl -X POST http://localhost:<port>/index`
*   **Observe Logs:** Check the console output of your running C# API for messages from `IndexingService` and any errors from Qdrant or Ollama communication.
*   **Verify Qdrant Data:** If successful, you should see new points (vectors) added to your Qdrant collection. You can use Qdrant's API or UI to verify this.
