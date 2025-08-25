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

### Features Implemented (Sprint 1)

- ✅ VS Code Extension boilerplate with TypeScript
- ✅ Webview integration with Fluent UI components
- ✅ Basic UI with Index Now button and progress indicators
- ✅ VS Code theme integration (light/dark mode support)
- ✅ Message passing between extension and webview
- ✅ Mock search functionality
- ✅ Settings integration

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
│   └── extension.ts          # Main extension logic
├── webview/
│   ├── src/
│   │   ├── index.ts         # Webview TypeScript entry point
│   │   ├── index.html       # Webview HTML template
│   │   └── styles.css       # Webview styles with VS Code theme integration
│   ├── dist/                # Built webview files
│   └── package.json         # Webview dependencies
├── out/                     # Compiled extension files
├── package.json             # Extension manifest and dependencies
└── tsconfig.json           # TypeScript configuration
```
