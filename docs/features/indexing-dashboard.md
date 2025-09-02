# Enhanced Indexing Dashboard & Controls

## Overview

The Enhanced Indexing Dashboard provides comprehensive visibility and control over the indexing process. It features real-time status monitoring, pause/resume controls, detailed progress tracking, and error reporting to give users complete control over their search index.

## Features

### Real-time Status Monitoring
- **Live Updates**: Status refreshes every 2 seconds during active indexing
- **Visual Indicators**: Clear status icons and color coding for different states
- **Progress Tracking**: Real-time progress bar with file counts and percentages
- **Current File Display**: Shows which file is currently being processed

### Indexing Controls
- **Pause/Resume**: Ability to pause indexing and resume from where it left off
- **Graceful Pausing**: Current file completes processing before pausing
- **State Persistence**: Remembers remaining files when paused
- **Safe Operations**: Prevents data corruption during pause/resume cycles

### Comprehensive Error Tracking
- **Error Collection**: Captures all indexing errors with detailed information
- **Timestamp Tracking**: Records when each error occurred
- **File-specific Errors**: Shows exactly which files failed and why
- **Error History**: Maintains error log throughout the indexing session

### Performance Statistics
- **Processing Metrics**: Files processed, total files, completion percentage
- **Time Estimates**: Estimated time remaining based on current progress
- **Throughput Tracking**: Files processed per second
- **Session Statistics**: Total time, success rate, error count

## User Interface

### Status Card
The main status card displays:
- **Current Status**: Idle, Indexing, Paused, or Error
- **Active File**: Currently processing file (when indexing)
- **Control Buttons**: Pause/Resume based on current state
- **Progress Bar**: Visual progress indicator with percentage

### Statistics Grid
Four key metrics displayed prominently:
- **Total Files**: Number of files to be indexed
- **Processed**: Number of files completed
- **Errors**: Number of files that failed processing
- **Est. Remaining**: Estimated time to completion (when available)

### Error Display
When errors occur, a detailed table shows:
- **File Path**: Full path to the file that failed (truncated for display)
- **Error Message**: Specific error description (truncated for display)
- **Timestamp**: When the error occurred
- **Tooltips**: Full information available on hover

## Indexing States

### State Definitions
- **Idle**: No indexing operation in progress
- **Indexing**: Actively processing files
- **Paused**: Indexing temporarily stopped, can be resumed
- **Error**: Critical error occurred, manual intervention needed

### State Transitions
```
Idle → Indexing (when indexing starts)
Indexing → Paused (when user clicks pause)
Paused → Indexing (when user clicks resume)
Indexing → Idle (when indexing completes)
Any State → Error (when critical error occurs)
```

### Visual Indicators
- **Idle**: Green checkmark icon
- **Indexing**: Blue spinning indicator
- **Paused**: Yellow pause icon
- **Error**: Red error icon

## API Integration

### Message Commands
The dashboard communicates with the extension through these commands:

#### Status Retrieval
```typescript
// Get current indexing status
postMessage('getIndexingStatus');

// Response format
{
  command: 'getIndexingStatusResponse',
  success: true,
  data: {
    status: 'indexing' | 'paused' | 'idle' | 'error',
    currentFile?: string,
    processedFiles: number,
    totalFiles: number,
    errors: Array<{
      filePath: string,
      error: string,
      timestamp: string
    }>,
    startTime?: string,
    estimatedTimeRemaining?: number
  }
}
```

#### Control Commands
```typescript
// Pause indexing
postMessage('pauseIndexing');

// Resume indexing
postMessage('resumeIndexing');

// Response format for both
{
  command: 'pauseIndexingResponse' | 'resumeIndexingResponse',
  success: boolean,
  error?: string
}
```

### Backend Integration
The dashboard integrates with several backend services:

#### IndexingService
- **Status Tracking**: Maintains current indexing state
- **Progress Reporting**: Updates processed file counts
- **Error Collection**: Captures and stores indexing errors
- **Pause/Resume Logic**: Handles state transitions safely

#### MessageRouter
- **Command Handling**: Processes dashboard requests
- **Response Management**: Sends status updates back to UI
- **Error Handling**: Manages communication errors

## Usage Guide

### Starting Indexing
1. Navigate to the Indexing Dashboard view
2. The dashboard will show current status (typically "Idle")
3. Start indexing from another view or command
4. Dashboard automatically updates to show progress

### Monitoring Progress
- **Progress Bar**: Shows visual completion percentage
- **File Counter**: Displays "X of Y files processed"
- **Current File**: Shows which file is being processed
- **Statistics**: View key metrics in the stats grid

### Pausing and Resuming
1. **To Pause**: Click the "Pause" button during indexing
   - Current file will complete processing
   - Status changes to "Paused"
   - Button changes to "Resume"

2. **To Resume**: Click the "Resume" button when paused
   - Indexing continues from where it left off
   - Status changes back to "Indexing"
   - Button changes to "Pause"

### Error Handling
- **Error Display**: Errors appear in the error table automatically
- **Error Details**: Hover over truncated text for full information
- **Error Persistence**: Errors remain visible throughout the session
- **Error Recovery**: Indexing continues despite individual file errors

## Configuration

### Update Frequency
The dashboard updates every 2 seconds by default. This can be adjusted:

```typescript
// In IndexingDashboard component
const interval = setInterval(loadIndexingStatus, 2000); // 2 seconds
```

### Display Limits
- **File Path Length**: Truncated to 50 characters with ellipsis
- **Error Message Length**: Truncated to 80 characters with ellipsis
- **Error History**: No limit, all errors are preserved

### Responsive Design
- **Grid Layout**: Statistics adapt to available space
- **Mobile Friendly**: Works on smaller screens
- **Accessibility**: Full keyboard navigation and screen reader support

## Performance Considerations

### Efficient Updates
- **Selective Rendering**: Only updates changed elements
- **Debounced Requests**: Prevents excessive API calls
- **Memory Management**: Cleans up intervals and listeners

### Resource Usage
- **Minimal Impact**: Dashboard updates don't affect indexing performance
- **Background Updates**: Continues updating even when not visible
- **Cleanup**: Properly disposes resources when component unmounts

## Troubleshooting

### Common Issues

**Dashboard not updating:**
- Check browser console for JavaScript errors
- Verify extension is running and responsive
- Restart VS Code if communication is broken

**Pause/Resume not working:**
- Ensure indexing is actually in progress
- Check for backend errors in VS Code output panel
- Verify IndexingService is properly initialized

**Missing error information:**
- Errors may be truncated for display - use tooltips
- Check VS Code output panel for full error details
- Verify error tracking is enabled in IndexingService

### Debug Information
Enable detailed logging to troubleshoot issues:

```json
{
  "code-context-engine.logLevel": "debug"
}
```

## Future Enhancements

### Planned Features
- **Historical Data**: Track indexing performance over time
- **Detailed Metrics**: More granular performance statistics
- **Export Functionality**: Export error logs and statistics
- **Custom Alerts**: Notifications for specific conditions

### UI Improvements
- **Dark Mode**: Enhanced dark theme support
- **Customizable Layout**: User-configurable dashboard layout
- **Advanced Filtering**: Filter errors by type, file, or time
- **Real-time Charts**: Visual representation of indexing progress

### Integration Features
- **Workspace Integration**: Show indexing status in VS Code status bar
- **Command Palette**: Quick access to pause/resume commands
- **Settings Integration**: Configure dashboard behavior in VS Code settings
