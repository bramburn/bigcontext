# Incremental Indexing

## Overview

The Incremental Indexing feature provides automatic, real-time updates to the search index when files in your workspace are created, modified, or deleted. This ensures that your search results are always current without requiring manual re-indexing.

## Features

### Automatic File Monitoring
- **Real-time Detection**: Monitors file system changes using VS Code's FileSystemWatcher API
- **Comprehensive Coverage**: Watches all supported file types including TypeScript, JavaScript, Python, Java, C++, and more
- **Intelligent Filtering**: Respects .gitignore patterns and focuses on code files

### Debounced Processing
- **Event Storm Protection**: Prevents excessive indexing during rapid file changes (e.g., during git operations)
- **Configurable Delay**: 500ms debounce delay by default to balance responsiveness and performance
- **Per-file Tracking**: Each file has its own debounce timer for optimal handling

### Seamless Integration
- **Background Operation**: File monitoring runs automatically without user intervention
- **Low Resource Usage**: Efficient event handling minimizes CPU and memory impact
- **Error Resilience**: Continues monitoring even if individual file operations fail

## How It Works

### File System Monitoring
The FileWatcherService creates a VS Code FileSystemWatcher that monitors files matching these patterns:
```
**/*.{ts,js,tsx,jsx,py,java,cpp,c,h,hpp,cs,php,rb,go,rs,swift,kt,scala,clj,hs,ml,fs,vb,sql,html,css,scss,sass,less,vue,svelte,md,mdx,txt,json,yaml,yml,xml,toml,ini,cfg,conf}
```

### Event Processing
1. **File Change/Creation**: When a file is modified or created:
   - Event is debounced to prevent rapid-fire updates
   - File content is re-parsed and chunked
   - New embeddings are generated
   - Index is updated with new content

2. **File Deletion**: When a file is deleted:
   - All associated vectors are immediately removed from the index
   - No debouncing needed for deletions

### Integration Points
- **IndexingService**: Handles the actual indexing operations
- **QdrantService**: Manages vector database operations
- **ExtensionManager**: Initializes and manages the file watcher lifecycle

## Configuration

### File Patterns
The default configuration monitors common code file types. You can customize the patterns by modifying the FileWatcherService configuration:

```typescript
const config = {
  patterns: ['**/*.ts', '**/*.js', '**/*.py'], // Custom patterns
  debounceDelay: 1000, // Custom debounce delay in ms
  respectGitignore: true // Whether to respect .gitignore
};
```

### Performance Tuning
- **Debounce Delay**: Adjust the delay based on your workflow (default: 500ms)
- **File Patterns**: Limit to specific file types if you have a large workspace
- **Gitignore Respect**: Enable to automatically exclude ignored files

## Status Monitoring

### Real-time Status
You can check the file watcher status programmatically:

```typescript
const status = fileWatcherService.getStatus();
console.log(`Active: ${status.isActive}`);
console.log(`Pending changes: ${status.pendingChanges}`);
console.log(`Watched patterns: ${status.watchedPatterns.join(', ')}`);
```

### Logging
The service provides detailed logging for monitoring and debugging:
- File change detection
- Processing start/completion
- Error conditions
- Performance metrics

## Benefits

### Developer Experience
- **Always Current**: Search results reflect the latest code changes
- **Zero Maintenance**: No need to manually trigger re-indexing
- **Fast Updates**: Changes are processed within seconds of saving

### Performance
- **Incremental Updates**: Only changed files are re-processed
- **Efficient Processing**: Debouncing prevents unnecessary work
- **Background Operation**: Doesn't interfere with development workflow

### Reliability
- **Error Handling**: Individual file failures don't stop the service
- **Resource Management**: Automatic cleanup of resources and timeouts
- **Graceful Degradation**: Continues working even with partial failures

## Troubleshooting

### Common Issues

**File changes not detected:**
- Check that the file extension is in the watched patterns
- Verify the file is not in .gitignore (if respectGitignore is enabled)
- Check VS Code output panel for error messages

**High CPU usage:**
- Increase debounce delay for workspaces with frequent changes
- Reduce file patterns to focus on essential file types
- Check for file system loops or excessive file operations

**Index inconsistencies:**
- Restart the extension to reinitialize the file watcher
- Perform a full re-index if needed
- Check for file system permission issues

### Debug Information
Enable debug logging by setting the log level in VS Code settings:
```json
{
  "code-context-engine.logLevel": "debug"
}
```

## API Reference

### FileWatcherService

#### Constructor
```typescript
constructor(indexingService: IndexingService, config?: Partial<FileWatcherConfig>)
```

#### Methods
- `initialize(): Promise<void>` - Start file system monitoring
- `getStatus()` - Get current watcher status
- `dispose()` - Clean up resources and stop monitoring

#### Events
The service integrates with the IndexingService to trigger:
- `updateFileInIndex(uri: vscode.Uri)` - For file changes/creations
- `removeFileFromIndex(uri: vscode.Uri)` - For file deletions

## Future Enhancements

### Planned Features
- **Selective Monitoring**: Enable/disable monitoring for specific folders
- **Performance Metrics**: Detailed statistics on processing times and throughput
- **Custom Filters**: User-defined rules for file inclusion/exclusion
- **Batch Processing**: Group related changes for more efficient processing

### Integration Opportunities
- **Git Integration**: Detect branch switches and update index accordingly
- **Project Detection**: Automatically adjust patterns based on project type
- **Remote Workspaces**: Support for remote file system monitoring
