# Sprint 4: Context Query API - Usage Guide

## Overview

Sprint 4 adds advanced context query capabilities to the Code Context Engine. You can now retrieve file content, discover related files, and perform sophisticated queries with filtering and metadata.

## New Features

### 1. Enhanced Search Interface

The search interface now provides:
- **Similarity scores** for each result (percentage match)
- **Code type indicators** (function, class, method, etc.)
- **Language badges** for each code chunk
- **Direct file opening** from search results
- **Related files discovery** automatically shown with search results

### 2. Service Status Monitoring

Real-time status display showing:
- **Database Connection**: Qdrant connectivity status
- **Embedding Provider**: Current provider (Ollama/OpenAI) status
- **Collection Status**: Whether your workspace is indexed

### 3. File Content Viewer

Click "Open" on any search result to:
- View complete file content in a modal
- See file metadata (size, last modified, language)
- Navigate to specific line numbers
- View related code chunks from the same file

### 4. Related Files Discovery

For each search, the system automatically finds:
- Files with similar code patterns
- Related functionality across your codebase
- Similarity scores and reasoning for each suggestion
- Chunk counts showing how much related code exists

## API Capabilities

### File Content Retrieval

```typescript
// Get file content with related chunks
const content = await vscodeApi.getFileContent('src/utils/helper.ts', true);

// Result includes:
// - Full file content
// - File metadata (size, modified date, language)
// - Related code chunks from the same file
```

### Related Files Discovery

```typescript
// Find files related to a query
const relatedFiles = await vscodeApi.findRelatedFiles(
    'authentication logic',
    'src/auth/login.ts',  // exclude current file
    10,                   // max results
    0.6                   // minimum similarity threshold
);

// Results include:
// - File paths with similarity scores
// - Reasoning for why files are related
// - Chunk counts and language information
```

### Advanced Context Queries

```typescript
// Perform sophisticated queries with filtering
const result = await vscodeApi.queryContext({
    query: 'error handling patterns',
    includeRelated: true,
    maxResults: 20,
    minSimilarity: 0.7,
    fileTypes: ['typescript', 'javascript']  // filter by language
});

// Results include:
// - Matching code chunks with metadata
// - Related files automatically discovered
// - Processing time and total result counts
```

### Service Status Monitoring

```typescript
// Check service health and configuration
const status = await vscodeApi.getServiceStatus();

// Returns:
// - Qdrant database connectivity
// - Embedding provider status
// - Collection existence and info
```

## Enhanced UI Features

### Search Results

Each search result now displays:
- **File path** with clickable "Open" button
- **Code snippet** with syntax highlighting
- **Similarity percentage** as a badge
- **Code type and name** (e.g., "function: authenticateUser")
- **Line number and language** information

### Related Files Panel

Automatically populated with each search:
- **File paths** with similarity scores
- **Reasoning** explaining why files are related
- **Chunk counts** showing amount of related code
- **Language indicators** for each file

### Service Status Bar

Always visible status indicators:
- **Database**: Connected/Disconnected status
- **Embeddings**: Current provider (ollama:nomic-embed-text, openai:text-embedding-ada-002)
- **Collection**: Ready/Not indexed status

### File Content Modal

Click any "Open" button to see:
- **Complete file content** with syntax highlighting
- **File metadata** (size, modification date, language)
- **Related chunks** from the same file (if requested)
- **Easy navigation** with scroll and search

## Message-Based Architecture

The new API uses a robust message-passing system:

### Request/Response Pattern
- **Unique request IDs** for tracking
- **Timeout handling** (30 seconds default)
- **Error propagation** with detailed messages
- **Type-safe interfaces** for all operations

### Event Handling
- **Real-time updates** for indexing progress
- **Service status changes** automatically reflected
- **Search result streaming** for large result sets

## Performance Optimizations

### Batch Processing
- **Related files** discovered in parallel with search
- **File content** loaded on-demand
- **Service status** cached and updated periodically

### Smart Caching
- **Request deduplication** for identical queries
- **Status caching** to reduce API calls
- **Result pagination** for large datasets

## Error Handling

Comprehensive error handling for:
- **Network timeouts** with retry logic
- **Service unavailability** with graceful degradation
- **Invalid queries** with helpful error messages
- **File access errors** with fallback options

## Integration Points

### VS Code Integration
- **Command palette** access to all features
- **Settings synchronization** with VS Code preferences
- **Theme integration** for consistent appearance
- **Keyboard shortcuts** for common operations

### Extension API
- **Message routing** for all webview communication
- **Context service** handling all business logic
- **Type safety** throughout the request/response cycle
- **Extensible architecture** for future enhancements

## Next Steps

Sprint 5 will add:
- **Settings UI** for configuring providers and preferences
- **Advanced filtering** options in the interface
- **Workspace-specific** configurations
- **Performance tuning** controls

The Context Query API provides a solid foundation for intelligent code exploration and discovery!
