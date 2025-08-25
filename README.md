# Code Context Engine

AI-powered code context and search extension for VS Code.

## Development Setup

### Prerequisites
- Node.js 16.x or higher
- VS Code

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd webview && npm install
   ```

### Building
1. Build the extension:
   ```bash
   npm run compile
   ```

2. Build the webview:
   ```bash
   cd webview && npm run build
   ```

### Testing the Extension

1. Open this project in VS Code
2. Press `F5` to launch the Extension Development Host
3. In the new VS Code window, open the Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
4. Run the command: "Open Code Context Panel"
5. The webview should open with the Code Context Engine interface

### Features Implemented

#### Sprint 1: VS Code Extension Boilerplate & UI Setup ✅
- ✅ VS Code Extension boilerplate with TypeScript
- ✅ Webview integration with Fluent UI components
- ✅ Basic UI with Index Now button and progress indicators
- ✅ VS Code theme integration (light/dark mode support)
- ✅ Message passing between extension and webview
- ✅ Mock search functionality
- ✅ Settings integration

#### Sprint 2: AST Parser & Code Chunking ✅
- ✅ Tree-sitter integration for TypeScript, JavaScript, Python, and C#
- ✅ FileWalker service for discovering and filtering code files
- ✅ AstParser service for parsing code into Abstract Syntax Trees
- ✅ Chunker service for breaking ASTs into meaningful code segments
- ✅ IndexingService orchestrating the complete indexing pipeline
- ✅ Real-time progress reporting during indexing
- ✅ Support for .gitignore patterns and common ignore rules
- ✅ Comprehensive error handling and recovery

#### Sprint 3: Vectorization & DB Integration ✅
- ✅ Qdrant vector database integration with Docker Compose setup
- ✅ QdrantService for collection management and vector operations
- ✅ IEmbeddingProvider interface for pluggable embedding providers
- ✅ OllamaProvider for local embedding generation (nomic-embed-text)
- ✅ OpenAIProvider for cloud-based embeddings (text-embedding-ada-002)
- ✅ Complete vectorization pipeline integrated into IndexingService
- ✅ Semantic search functionality with similarity scoring
- ✅ Automatic collection creation and batch vector storage
- ✅ Real-time search through indexed code with VS Code integration

#### Sprint 4: Context Query API ✅
- ✅ ContextService for advanced query logic and file operations
- ✅ File content retrieval with related chunks discovery
- ✅ Related files discovery with similarity-based ranking
- ✅ Advanced context queries with filtering and metadata
- ✅ Comprehensive webview message handling and API routing
- ✅ TypeScript API client with request/response management
- ✅ Enhanced UI with service status, related files, and file preview
- ✅ Real-time service health monitoring and status display
- ✅ Modal file content viewer with syntax highlighting

#### Sprint 5: Settings UI & Configuration ✅
- ✅ Comprehensive configuration schema with 12+ settings
- ✅ Settings command registration and webview panel
- ✅ Complete settings UI with provider selection and testing
- ✅ Settings API handlers for get/save/reset operations
- ✅ Connection testing for Qdrant and embedding providers
- ✅ Configuration-driven service initialization
- ✅ Real-time settings validation and error handling
- ✅ Secure API key storage in VS Code settings
- ✅ Advanced options for batch sizes, thresholds, and patterns

#### Sprint 6: LSP Integration & DevOps ✅
- ✅ LSP service integration with VS Code language servers
- ✅ Enhanced code chunks with semantic metadata (symbols, definitions, references)
- ✅ Automatic LSP data enrichment during indexing process
- ✅ Comprehensive GitHub Actions CI/CD pipeline
- ✅ Multi-Node.js version testing (18.x, 20.x)
- ✅ Automated VSIX packaging and artifact generation
- ✅ Security scanning and code quality checks
- ✅ Docker services integration for testing with Qdrant
- ✅ Release automation with GitHub releases

### Commands Available

- `code-context-engine.openMainPanel` - Opens the main Code Context Engine panel
- `code-context-engine.startIndexing` - Starts repository indexing (placeholder implementation)

### Configuration

The extension contributes the following settings:

- `code-context-engine.embeddingProvider` - Choose between "ollama" and "openai"
- `code-context-engine.databaseConnectionString` - Qdrant database connection string
- `code-context-engine.openaiApiKey` - OpenAI API key (stored securely)

## Next Steps

This completes Sprint 1. The next sprints will implement:

- Sprint 2: AST parsing and code chunking with tree-sitter
- Sprint 3: Vectorization and Qdrant database integration
- Sprint 4: Context query API
- Sprint 5: Settings UI
- Sprint 6: LSP integration and DevOps
- Sprint 7: Documentation and marketplace publishing

## Project Structure

```
├── src/
│   ├── extension.ts          # Main extension logic
│   ├── indexing/
│   │   ├── fileWalker.ts    # File discovery and filtering service
│   │   └── indexingService.ts # Main indexing orchestrator
│   ├── parsing/
│   │   ├── astParser.ts     # AST parsing with tree-sitter
│   │   └── chunker.ts       # Code chunking service
│   ├── db/
│   │   └── qdrantService.ts # Vector database operations
│   ├── embeddings/
│   │   ├── embeddingProvider.ts # Embedding provider interface
│   │   ├── ollamaProvider.ts    # Local Ollama embeddings
│   │   └── openaiProvider.ts    # OpenAI embeddings
│   ├── context/
│   │   └── contextService.ts    # Advanced context queries and file operations
│   └── types/
│       └── tree-sitter-languages.d.ts # Type declarations
├── webview/
│   ├── src/
│   │   ├── index.ts         # Webview TypeScript entry point
│   │   ├── index.html       # Webview HTML template
│   │   ├── styles.css       # Webview styles with VS Code theme integration
│   │   └── lib/
│   │       └── vscodeApi.ts # VS Code API client wrapper
│   ├── dist/                # Built webview files
│   └── package.json         # Webview dependencies
├── out/                     # Compiled extension files
├── docker-compose.yml       # Qdrant database setup
├── package.json             # Extension manifest and dependencies
└── tsconfig.json           # TypeScript configuration
```
