# CodeBuddy Instructions for BigContext

## Key Commands

### Build & Development
```bash
# Build the project
npm run compile
npm run build-webview

# Watch mode (development)
npm run watch  # In one terminal
cd webview-react && npm run dev  # In another terminal

# Clean build artifacts
npm run clean
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "ContextService"

# Run integration tests (requires Qdrant)
npm run test:integration

# Contract tests
npx vitest run specs/001-we-currently-have/tests/contracts/ --reporter=verbose

# Unit tests
npx vitest run src/tests/unit --reporter=verbose
```

### Packaging & Publishing
```bash
# Build for production
npm run vscode:prepublish

# Create VSIX package
npm run package

# Publish to VS Code Marketplace
npm run publish:vsce  # Requires VSCE_PAT env var
```

## Architecture Overview

The extension follows a modular architecture with these core services:
- **SvelteKit UI**: Modern web interface in VS Code webview
- **MessageRouter**: Handles communication between UI and extension
- **ExtensionManager**: Main extension controller
- **ContextService**: Manages semantic search and RAG operations
- **IndexingService**: Handles file processing and vector storage
- **StateManager**: Central state management
- **QdrantService**: Vector database integration
- **ConfigManager**: Handles settings and configuration

Key components interact through message passing and event-driven architecture.