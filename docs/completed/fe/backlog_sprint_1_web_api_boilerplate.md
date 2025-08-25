### User Story 1: Create C# Web API Foundation
**As Alisha, I want to** create a new ASP.NET Core Web API project, **so that** we have the foundational service for our backend logic.

**Actions to Undertake:**
1.  **Filepath**: `(Project Root)`
    -   **Action**: Create a new .NET solution and three projects: `CodeContext.Api` (webapi), `CodeContext.Core` (classlib), and `CodeContext.Infrastructure` (classlib).
    -   **Implementation**:
        ```bash
        dotnet new sln -n CodeContext
        dotnet new webapi -n CodeContext.Api -o CodeContext.Api
        dotnet new classlib -n CodeContext.Core -o CodeContext.Core
        dotnet new classlib -n CodeContext.Infrastructure -o CodeContext.Infrastructure
        dotnet sln CodeContext.sln add CodeContext.Api/CodeContext.Api.csproj
        dotnet sln CodeContext.sln add CodeContext.Core/CodeContext.Core.csproj
        dotnet sln CodeContext.sln add CodeContext.Infrastructure/CodeContext.Infrastructure.csproj
        ```
    -   **Imports**: None.
2.  **Filepath**: `CodeContext.Api/CodeContext.Api.csproj`
    -   **Action**: Add project references from `CodeContext.Api` to `CodeContext.Core` and `CodeContext.Infrastructure`.
    -   **Implementation**:
        ```xml
        <ItemGroup>
            <ProjectReference Include="..\CodeContext.Core\CodeContext.Core.csproj" />
            <ProjectReference Include="..\CodeContext.Infrastructure\CodeContext.Infrastructure.csproj" />
        </ItemGroup>
        ```
    -   **Imports**: None.
3.  **Filepath**: `CodeContext.Api/Program.cs`
    -   **Action**: Implement a basic `/health` endpoint using minimal API syntax.
    -   **Implementation**:
        ```csharp
        app.MapGet("/health", () => Results.Ok());
        ```
    -   **Imports**: `using Microsoft.AspNetCore.Builder;` (already there)
4.  **Filepath**: `CodeContext.Api/Program.cs`
    -   **Action**: Add Swagger/OpenAPI support.
    -   **Implementation**:
        ```csharp
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();
        // ...
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }
        ```
    -   **Imports**: `using Microsoft.OpenApi.Models;` (not directly in Program.cs, but implicitly used by AddSwaggerGen)
5.  **Filepath**: `CodeContext.Core/`
    -   **Action**: Create placeholder interfaces `IEmbeddingProvider.cs` and `IVectorDatabaseClient.cs` in the `CodeContext.Core` project.
    -   **Implementation**:
        ```csharp
        // CodeContext.Core/IEmbeddingProvider.cs
        namespace CodeContext.Core
        {
            public interface IEmbeddingProvider
            {
                // Placeholder for future methods
            }
        }

        // CodeContext.Core/IVectorDatabaseClient.cs
        namespace CodeContext.Core
        {
            public interface IVectorDatabaseClient
            {
                // Placeholder for future methods
            }
        }
        ```
    -   **Imports**: None.
6.  **Filepath**: `CodeContext.Infrastructure/`
    -   **Action**: Create placeholder folders `DatabaseClients` and `EmbeddingProviders` in the `CodeContext.Infrastructure` project.
    -   **Implementation**: (This is a folder creation, not code. I'll describe it.)
        ```
        (Create directory CodeContext.Infrastructure/DatabaseClients)
        (Create directory CodeContext.Infrastructure/EmbeddingProviders)
        ```
    -   **Imports**: None.

**Acceptance Criteria:**
-   A new .NET solution is created containing `CodeContext.Api`, `CodeContext.Core`, and `CodeContext.Infrastructure` projects.
-   The `CodeContext.Api` project correctly references `CodeContext.Core` and `CodeContext.Infrastructure`.
-   A basic `/health` endpoint is accessible and returns a `200 OK` status.
-   Swagger/OpenAPI documentation is available and functional.
-   Placeholder interfaces `IEmbeddingProvider` and `IVectorDatabaseClient` exist in `CodeContext.Core`.
-   Placeholder folders `DatabaseClients` and `EmbeddingProviders` exist in `CodeContext.Infrastructure`.

**Testing Plan:**
-   **Test Case 1**: Run `dotnet build CodeContext.sln` to ensure all projects build successfully.
-   **Test Case 2**: Navigate to the `CodeContext.Api` directory and run `dotnet run`. Verify the API starts without errors.
-   **Test Case 3**: Access `http://localhost:<port>/health` in a browser or via `curl` and confirm a `200 OK` response.
-   **Test Case 4**: Access `http://localhost:<port>/swagger` in a browser and confirm the Swagger UI loads correctly.
