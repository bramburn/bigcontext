# Sprint 3: Vectorization & DB Integration - Usage Guide

## Overview

Sprint 3 adds AI-powered semantic search capabilities to the Code Context Engine. Your code is now vectorized using embedding models and stored in a Qdrant vector database for intelligent similarity search.

## Prerequisites

### 1. Start Qdrant Database

```bash
# Start Qdrant using Docker Compose
docker-compose up -d

# Verify Qdrant is running
curl http://localhost:6333/health
```

### 2. Choose Embedding Provider

#### Option A: Ollama (Local, Free)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the embedding model
ollama pull nomic-embed-text

# Verify Ollama is running
curl http://localhost:11434/api/tags
```

#### Option B: OpenAI (Cloud, Requires API Key)
1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Set it in VS Code settings: `code-context-engine.openaiApiKey`
3. Set provider to "openai": `code-context-engine.embeddingProvider`

## Configuration

Open VS Code settings and configure:

```json
{
  "code-context-engine.embeddingProvider": "ollama", // or "openai"
  "code-context-engine.databaseConnectionString": "http://localhost:6333",
  "code-context-engine.openaiApiKey": "your-api-key-here" // Only for OpenAI
}
```

## Usage

### 1. Index Your Repository

1. Open your project in VS Code
2. Run command: `Code Context Engine: Open Main Panel`
3. Click "Index Repository"
4. Watch the progress through phases:
   - **Discovering**: Finding code files
   - **Parsing**: Creating ASTs with tree-sitter
   - **Chunking**: Breaking code into segments
   - **Embedding**: Generating vector embeddings
   - **Storing**: Saving to Qdrant database

### 2. Search Your Code

1. In the Code Context Engine panel, enter a search query
2. Examples:
   - "function that handles user authentication"
   - "error handling for API requests"
   - "database connection setup"
   - "React component for user profile"

3. Results show:
   - **File path** and **line numbers**
   - **Code snippet** with context
   - **Similarity score** (higher = more relevant)
   - **Code type** (function, class, method, etc.)

## How It Works

### Indexing Pipeline

1. **File Discovery**: Finds all code files, respects .gitignore
2. **AST Parsing**: Uses tree-sitter to parse code structure
3. **Code Chunking**: Breaks code into meaningful segments:
   - Functions and methods
   - Classes and interfaces
   - Modules and namespaces
   - Important code blocks

4. **Vectorization**: Converts code chunks to embeddings:
   - **Ollama**: Uses local `nomic-embed-text` model (768 dimensions)
   - **OpenAI**: Uses `text-embedding-ada-002` (1536 dimensions)

5. **Storage**: Saves vectors and metadata to Qdrant:
   - Collection name: `code_context_{workspace_name}`
   - Includes file path, line numbers, code type, content
   - Optimized for similarity search

### Search Process

1. **Query Embedding**: Your search query is converted to a vector
2. **Similarity Search**: Qdrant finds most similar code chunks
3. **Ranking**: Results ranked by cosine similarity score
4. **Formatting**: Results formatted for VS Code display

## Supported Languages

- **TypeScript** (.ts, .tsx)
- **JavaScript** (.js, .jsx)
- **Python** (.py)
- **C#** (.cs)

## Troubleshooting

### Qdrant Issues
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# View Qdrant logs
docker-compose logs qdrant

# Restart Qdrant
docker-compose restart qdrant
```

### Ollama Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Pull embedding model
ollama pull nomic-embed-text

# List available models
ollama list
```

### OpenAI Issues
- Verify API key is correct in VS Code settings
- Check API quota and billing status
- Ensure internet connectivity

### Search Returns No Results
1. Verify indexing completed successfully
2. Check Qdrant collection exists: `curl http://localhost:6333/collections`
3. Try broader search terms
4. Re-index if collection is empty

## Performance Tips

- **Large repositories**: Indexing may take several minutes
- **Batch processing**: Embeddings are processed in batches for efficiency
- **Memory usage**: Large codebases require more RAM for vector storage
- **Search speed**: First search may be slower due to model loading

## Next Steps

Sprint 4 will add:
- Advanced query capabilities
- File content retrieval
- Related files discovery
- Context-aware suggestions
