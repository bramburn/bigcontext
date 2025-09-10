# AST Parser Error Fixes

## Problem Summary

The code context engine was encountering errors when processing certain Python files from the xerparser project:

```
Worker error: Failed to process /Users/bramburn/dev/xerparser/local/enhanced_forensic_report.py: Failed to parse AST for /Users/bramburn/dev/xerparser/local/enhanced_forensic_report.py - parser returned null tree
Worker error: Failed to process /Users/bramburn/dev/xerparser/local/libs/total_float_method.py: Failed to parse AST for /Users/bramburn/dev/xerparser/local/libs/total_float_method.py - parser returned null tree
Worker error: Failed to process /Users/bramburn/dev/xerparser/local/libs/window_xer.py: Failed to parse AST for /Users/bramburn/dev/xerparser/local/libs/window_xer.py - parser returned null tree
Worker error: Failed to process /Users/bramburn/dev/xerparser/xerparser/src/activity_modifier.py: Failed to parse AST for /Users/bramburn/dev/xerparser/xerparser/src/activity_modifier.py - parser returned null tree
Worker error: Failed to process /Users/bramburn/dev/xerparser/xerparser/src/programme_progressor.py: Failed to parse AST for /Users/bramburn/dev/xerparser/xerparser/src/programme_progressor.py - parser returned null tree
Failed to store chunks in Qdrant
```

## Root Cause Analysis

The issue was caused by the tree-sitter Python parser throwing "Invalid argument" errors for specific Python files. Investigation revealed:

1. **The Python files are syntactically valid** - They compile successfully with Python's built-in compiler
2. **Simple Python files work fine** - The AST parser works correctly with basic Python code
3. **Specific content patterns cause issues** - Certain large Python files with complex patterns trigger tree-sitter errors
4. **No fallback mechanism existed** - When AST parsing failed, the entire indexing process failed

## Solutions Implemented

### 1. Enhanced Error Handling in AST Parser (`src/parsing/astParser.ts`)

**Changes Made:**
- Added try-catch around tree-sitter parse calls
- Implemented retry logic with normalized line endings for Python files
- Added detailed error logging with code previews
- Improved validation of parsed trees

**Key Improvements:**
```typescript
// Try parsing with additional error handling for tree-sitter issues
let tree: Parser.Tree | null = null;
try {
  tree = this.parser.parse(code);
} catch (parseError) {
  console.error(`AstParser: Tree-sitter parse error for ${language}:`, parseError);
  // For Python files, try to handle encoding issues
  if (language === 'python') {
    try {
      // Try parsing with normalized line endings
      const normalizedCode = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      tree = this.parser.parse(normalizedCode);
      if (tree) {
        console.log(`AstParser: Successfully parsed ${language} after normalizing line endings`);
      }
    } catch (retryError) {
      console.error(`AstParser: Retry parse failed for ${language}:`, retryError);
    }
  }
}
```

### 2. Fallback Mechanism in Indexing Worker (`src/indexing/indexingWorker.ts`)

**Changes Made:**
- Replaced hard failure with graceful fallback to simple text chunking
- Added warning logs when AST parsing fails
- Maintained full functionality by using existing `createSimpleTextChunks` function

**Key Improvements:**
```typescript
if (!parseResult.tree) {
  console.warn(`IndexingWorker: AST parsing failed for ${filePath}, falling back to simple text chunking`);
  errors.push(`AST parsing failed for ${filePath}, using simple text chunking as fallback`);
  
  // Fall back to simple text chunking when AST parsing fails
  const simpleChunks = createSimpleTextChunks(filePath, content, language);
  
  // Continue with embedding generation...
}
```

### 3. Cleanup of Problematic Data

**Actions Taken:**
- Removed the corrupted Qdrant collection `code_context_xerparser_knhiik`
- This prevents the system from trying to use partially indexed data

## Testing Results

**Before Fix:**
- ❌ All 5 problematic Python files failed with "Invalid argument" errors
- ❌ Entire indexing process failed
- ❌ No chunks were stored in Qdrant

**After Fix:**
- ✅ Simple Python files parse correctly with AST
- ✅ Problematic files gracefully fall back to simple text chunking
- ✅ All files can now be processed and indexed
- ✅ System continues working even when AST parsing fails

## Benefits

1. **Improved Robustness**: System no longer fails completely when encountering problematic files
2. **Better Error Reporting**: Detailed logging helps diagnose issues
3. **Graceful Degradation**: Falls back to simple text chunking when AST parsing fails
4. **Maintained Functionality**: Files are still indexed and searchable, just without AST-based structure
5. **Future-Proof**: Handles similar issues that might occur with other files

## Monitoring

The system now logs when fallback mechanisms are used:
- Warning logs when AST parsing fails
- Error details in the processing results
- Clear indication when simple text chunking is used as fallback

## Next Steps

1. **Monitor for patterns**: Track which files commonly require fallback
2. **Tree-sitter updates**: Consider updating tree-sitter-python version if newer versions fix these issues
3. **Alternative parsers**: Evaluate other Python parsing options for problematic files
4. **File analysis**: Investigate what specific patterns in the problematic files cause tree-sitter issues

## Files Modified

- `src/parsing/astParser.ts` - Enhanced error handling and retry logic
- `src/indexing/indexingWorker.ts` - Added fallback mechanism
- `docs/ast-parser-fixes.md` - This documentation

## Verification

The fixes can be verified by:
1. Running the indexing process on the xerparser project
2. Checking that all files are processed (some with AST, some with fallback)
3. Confirming that no "Failed to parse AST" errors cause complete failures
4. Verifying that chunks are successfully stored in Qdrant
