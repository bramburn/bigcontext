### How to Implement Sprint 1: C# Web API Boilerplate

This sprint focuses on setting up the foundational C# ASP.NET Core Web API project with a clean architecture.

**Key Technologies and Concepts:**

*   **ASP.NET Core Minimal APIs:** A simplified approach to building HTTP APIs in .NET 6 and later, reducing boilerplate code.
*   **.NET CLI:** Command-line interface for developing .NET applications.
*   **Dependency Injection (DI):** Built-in feature in ASP.NET Core for managing object dependencies, promoting loose coupling.
*   **Swagger/OpenAPI:** Tools for documenting and testing RESTful APIs.
*   **Clean Architecture:** Organizing code into layers (e.g., Core, Infrastructure, API) to separate concerns and improve maintainability.

**Detailed Implementation Steps and Code Examples:**

1.  **Create .NET Solution and Projects:**
    Use the `dotnet new` command to scaffold the solution and projects.
    *   **Command:**
        ```bash
        dotnet new sln -n CodeContext
        dotnet new webapi -n CodeContext.Api -o CodeContext.Api
        dotnet new classlib -n CodeContext.Core -o CodeContext.Core
        dotnet new classlib -n CodeContext.Infrastructure -o CodeContext.Infrastructure
        dotnet sln CodeContext.sln add CodeContext.Api/CodeContext.Api.csproj
        dotnet sln CodeContext.sln add CodeContext.Core/CodeContext.Core.csproj
        dotnet sln CodeContext.sln add CodeContext.Infrastructure/CodeContext.Infrastructure.csproj
        ```
    *   **Guidance:** The `-o` flag creates the project in a new directory. `dotnet sln add` links the projects to the solution file.

2.  **Set Project References:**
    Edit the `CodeContext.Api.csproj` file to add references to the Core and Infrastructure projects. This allows the API layer to access types defined in the other layers.
    *   **File:** `CodeContext.Api/CodeContext.Api.csproj`
    *   **Code Example (add inside `<Project>` tag):**
        ```xml
        <ItemGroup>
            <ProjectReference Include="..\CodeContext.Core\CodeContext.Core.csproj" />
            <ProjectReference Include="..\CodeContext.Infrastructure\CodeContext.Infrastructure.csproj" />
        </ItemGroup>
        ```
    *   **Guidance:** Ensure the `Include` paths correctly point to the `.csproj` files of the Core and Infrastructure projects relative to the API project.

3.  **Implement Health Check Endpoint:**
    Modify `Program.cs` in the API project to add a simple `/health` endpoint. This is crucial for monitoring the API's availability.
    *   **File:** `CodeContext.Api/Program.cs`
    *   **Code Example (add before `app.Run();`):**
        ```csharp
        // ... existing code ...

        app.MapGet("/health", () => Results.Ok());

        app.Run();
        ```
    *   **Guidance:** `Results.Ok()` is part of the `Microsoft.AspNetCore.Http.Results` class, which is implicitly available in minimal API contexts. This endpoint will return an HTTP 200 OK status.

4.  **Add Swagger/OpenAPI:**
    Integrate Swashbuckle to generate OpenAPI specifications and provide a Swagger UI for API documentation and testing.
    *   **File:** `CodeContext.Api/Program.cs`
    *   **Code Example (add in `builder.Services` section):**
        ```csharp
        // ... existing code ...
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }
        // ... existing code ...
        ```
    *   **Guidance:** `AddEndpointsApiExplorer()` is needed for minimal APIs to be discovered by Swagger. `AddSwaggerGen()` registers the Swagger generator. `UseSwagger()` and `UseSwaggerUI()` enable the middleware for serving the generated specification and the UI, respectively. These are typically enabled only in development environments.

5.  **Define Core Interfaces:**
    Create placeholder interfaces in the `CodeContext.Core` project. These interfaces will define the contracts for embedding providers and vector database clients, promoting a clean separation of concerns and extensibility.
    *   **File:** `CodeContext.Core/IEmbeddingProvider.cs`
    *   **Code Example:**
        ```csharp
        namespace CodeContext.Core
        {
            public interface IEmbeddingProvider
            {
                // Future methods for generating embeddings will go here, e.g.:
                // Task<float[]> GenerateEmbeddingAsync(string text);
            }
        }
        ```
    *   **File:** `CodeContext.Core/IVectorDatabaseClient.cs`
    *   **Code Example:**
        ```csharp
        namespace CodeContext.Core
        {
            public interface IVectorDatabaseClient
            {
                // Future methods for interacting with vector databases will go here, e.g.:
                // Task UpsertAsync(string id, float[] vector, Dictionary<string, object> payload);
                // Task<List<QueryResult>> QueryAsync(float[] vector, int topK);
            }
        }
        ```
    *   **Guidance:** These interfaces are currently empty but establish the architectural placeholders.

6.  **Define Infrastructure Placeholders:**
    Create directories within the `CodeContext.Infrastructure` project to logically separate concrete implementations of database clients and embedding providers.
    *   **Action:** Manually create the following directories:
        *   `CodeContext.Infrastructure/DatabaseClients`
        *   `CodeContext.Infrastructure/EmbeddingProviders`
    *   **Guidance:** These folders will house the actual implementations (e.g., `QdrantClient.cs`, `OllamaProvider.cs`) in later sprints.

**Verification:**

After implementing these steps, build the solution (`dotnet build CodeContext.sln`) and run the API project (`dotnet run --project CodeContext.Api`). Verify that:
*   The API starts successfully.
*   You can access `http://localhost:<port>/health` and get a 200 OK response.
*   You can access `http://localhost:<port>/swagger` and see the Swagger UI.
