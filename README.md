# Code Context Engine

🚀 **AI-powered code context and search extension for VS Code**

Transform your development workflow with intelligent code search, semantic understanding, and AI-powered context discovery. The Code Context Engine helps you navigate large codebases, understand complex relationships, and find relevant code using natural language queries.

## ✨ Features

- 🔍 **Intelligent Code Search**: Use natural language to find code - "function that validates email" or "React component for user authentication"
- 🧠 **Semantic Understanding**: AI-powered search that understands code context and relationships
- 🏗️ **Interactive Setup**: Guided configuration with system validation and connection testing
- 📊 **Rich Results**: Relevance scoring, file previews, and direct navigation to code locations
- 🔧 **Flexible Configuration**: Support for multiple databases and embedding providers
- 📄 **XML Export**: Export search results in structured XML format for integration with other tools
- ⚡ **Keyboard Shortcuts**: Quick access with customizable hotkeys
- 🎨 **Modern UI**: SvelteKit-based interface with VS Code theme integration

## 🚀 Quick Start

### Installation
1. Install from VS Code Marketplace (coming soon) or build from source
2. Open the main panel: `Ctrl+Alt+C` (Windows/Linux) or `Cmd+Alt+C` (macOS)
3. Follow the setup wizard to configure your database and embedding provider
4. Start indexing: `Ctrl+Alt+I` or `Cmd+Alt+I`
5. Begin searching with natural language queries!

### First Search
Try queries like:
- "function that handles user authentication"
- "React component for displaying user profiles"
- "code that processes file uploads"
- "how to connect to the database"

## 📖 Documentation

- **[User Guide](docs/USER_GUIDE.md)**: Complete guide for end users
- **[Contributing Guide](docs/CONTRIBUTING.md)**: Development setup and contribution guidelines
- **[Technical Documentation](docs/)**: Detailed technical documentation

## 🛠️ Development Setup

### Prerequisites
- Node.js 18.x or 20.x
- VS Code 1.74.0 or higher
- Git

### Quick Setup
```bash
# Clone and install dependencies
git clone https://github.com/bramburn/bigcontext.git
cd bigcontext
npm install
cd webview-react; npm install; cd ..

# Build the project
npm run compile
npm run build-webview

# Start development
npm run watch  # In one terminal
cd webview-react && npm run dev  # In another terminal
```

### Testing the Extension
1. Open this project in VS Code
2. Press `F5` to launch the Extension Development Host
3. Use `Ctrl+Shift+P` → "Code Context: Open Main Panel"
4. The extension interface will open in a webview panel

## 🎯 Implementation Status

All major sprints have been completed! The Code Context Engine is now a fully functional VS Code extension with comprehensive features.

### ✅ Sprint 1: SvelteKit Migration (Complete)
- 🔄 **Migrated from vanilla HTML to SvelteKit**: Modern, reactive UI framework
- 🎨 **Enhanced UI Components**: Rich, interactive interface with Fluent UI integration
- 🔗 **Improved State Management**: Reactive stores and component communication
- 📱 **Responsive Design**: Optimized for different panel sizes and VS Code themes
- ⚡ **Performance Optimizations**: Faster rendering and better user experience

### ✅ Sprint 2: Intuitive Settings & Diagnostics UI (Complete)
- 🛠️ **Interactive Setup Wizard**: Guided configuration process with validation
- 🔍 **System Validation**: Real-time validation of database and embedding provider settings
- 🧪 **Connection Testing**: Test connections before committing to configuration
- 📊 **Rich Diagnostics Panel**: Monitor system health, indexing progress, and performance
- ⚙️ **Native Settings Integration**: Seamless integration with VS Code settings UI

### ✅ Sprint 3: Advanced Search UI & Logic (Complete)
- 🎛️ **Advanced Search Controls**: Max results and content inclusion options
- 🔄 **Result Deduplication**: Intelligent deduplication by file path with highest relevance scores
- 📈 **Enhanced Search Logic**: Improved ranking and filtering algorithms
- 🎯 **Precision Controls**: Fine-tune search behavior for better results
- 🔍 **Smart Result Processing**: Optimized search pipeline for better performance

### ✅ Sprint 4: XML Result Formatting (Complete)
- 📄 **XML Export Service**: Dedicated service for formatting search results
- 🏗️ **Structured Output**: Repomix-style XML with proper CDATA handling
- 🔧 **Flexible Formatting**: Configurable output options (pretty print, metadata inclusion)
- ✅ **XML Validation**: Built-in validation to ensure well-formed output
- 📊 **Formatting Statistics**: Detailed metrics about formatting operations

### ✅ Sprint 5: State Management & Hotkeys (Complete)
- ⌨️ **Keyboard Shortcuts**: `Ctrl+Alt+C` for main panel, `Ctrl+Alt+I` for indexing
- 🏛️ **Robust State Manager**: Centralized state management preventing conflicts
- 🔄 **Event-Driven Architecture**: Real-time state updates across components
- 🛡️ **Operation Safety**: Prevents concurrent operations and handles errors gracefully
- ⚙️ **Native Settings Integration**: Direct integration with VS Code settings UI

### ✅ Sprint 6: CI/CD Pipeline & Documentation (Complete)
- 🚀 **GitHub Actions CI/CD**: Comprehensive pipeline with build, test, and release automation
- 🔒 **Security Scanning**: Automated dependency audits and vulnerability checks
- 📊 **Code Quality Gates**: Linting, type checking, and formatting validation
- 🐳 **Docker Integration**: Automated testing with Qdrant services
- 📚 **Complete Documentation**: User guide, contributor guide, and technical documentation

## 🏗️ Architecture Overview

The extension follows a modern, modular architecture:

```
┌─────────────────┐    ┌─────────────────┐
│   SvelteKit UI  │◄──►│  MessageRouter  │
└─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │ ExtensionManager│
                       └─────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│ContextService│      │IndexingService│      │StateManager │
└─────────────┘        └─────────────┘        └─────────────┘
        │                       │                       │
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│QdrantService│        │  Parsers    │        │ConfigManager│
└─────────────┘        └─────────────┘        └─────────────┘
```

### 🏛️ Foundation Features (Previously Implemented)
- ✅ **VS Code Extension Boilerplate**: TypeScript-based extension with proper VS Code API integration
- ✅ **Tree-sitter Integration**: Multi-language AST parsing for TypeScript, JavaScript, Python, C#
- ✅ **Code Chunking**: Intelligent code segmentation for optimal indexing and search
- ✅ **Vector Database Integration**: Qdrant integration for semantic search capabilities
- ✅ **Embedding Providers**: Support for multiple AI embedding services
- ✅ **File System Integration**: Robust file watching and workspace management
- ✅ **Configuration Management**: Flexible configuration system with validation
- ✅ **Error Handling**: Comprehensive error handling and user feedback
- ✅ **Performance Monitoring**: Built-in performance tracking and optimization

## 🎮 Usage

### Keyboard Shortcuts
| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Open Main Panel | `Ctrl+Alt+C` | `Cmd+Alt+C` |
| Start Indexing | `Ctrl+Alt+I` | `Cmd+Alt+I` |

### Command Palette
- `Code Context: Open Main Panel`
- `Code Context: Start Indexing`
- `Code Context: Setup Project`
- `Code Context: Open Settings`
- `Code Context: Open Diagnostics`

## 🔧 Configuration

The extension supports various configuration options accessible through VS Code settings:

- **Database Settings**: Configure Qdrant connection details
- **Embedding Providers**: Choose and configure AI embedding services
- **Indexing Options**: Control file filters, chunk sizes, and processing limits
- **UI Preferences**: Customize interface behavior and appearance
- **Performance Tuning**: Adjust timeouts, batch sizes, and resource limits

## 🧪 Testing

## RAG for LLM: Setup & Indexing UI (Phase 3)

This repository now includes a RAG (Retrieval-Augmented Generation) setup and indexing workflow integrated into the VS Code extension.

- Backend APIs (webview message handlers):
  - GET/POST /settings
  - GET /indexing-status
  - POST /indexing-start
- Frontend (React webview) in webview-react/ with Settings and Indexing views
- Message routing integrated via RagMessageHandler and MessageRouterIntegration

### Running contract tests (Vitest)

```bash
# Contract tests from the spec folder
npx vitest run specs/001-we-currently-have/tests/contracts/ --reporter=verbose

# Unit tests for services
npx vitest run src/tests/unit --reporter=verbose
```



```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "ContextService"

# Run integration tests (requires Qdrant)
npm run test:integration
```

## 📦 Building and Packaging

```bash
# Build for production
npm run vscode:prepublish

# Create VSIX package
npm run package

# Clean build artifacts
npm run clean
```

## 🚀 Publishing

### Local Publishing Process

To publish the extension locally to the VS Code Marketplace:

```bash
# Set your VS Code Marketplace Personal Access Token
export VSCE_PAT='your-personal-access-token-here'

# Build and publish directly
npm run publish:vsce
```

### Automated Release Process

The extension includes an automated release script that handles version bumping, building, testing, and publishing:

```bash
# Ensure you're on the main branch with a clean working directory
git checkout main
git pull

# Set your VS Code Marketplace Personal Access Token
export VSCE_PAT='your-personal-access-token-here'

# Run the automated release script
npm run release -- patch   # For bug fixes
npm run release -- minor   # For new features
npm run release -- major   # For breaking changes
```

The release script will:
1. Validate the git working directory is clean
2. Check for the required `VSCE_PAT` environment variable
3. Run the build and test suite
4. Bump the version in `package.json` and create a git tag
5. Publish to the VS Code Marketplace
6. Push the changes and tags to the remote repository

### Manual Publishing

To publish the extension to the VS Code Marketplace manually:

1. **Get a Personal Access Token (PAT)** from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
2. **Set the environment variable:**
   ```bash
   export VSCE_PAT='your-personal-access-token-here'
   ```
3. **Publish the extension:**
   ```bash
   npm run publish:vsce
   ```

**Note:** Keep your PAT secure and never commit it to version control. The PAT should have the `Marketplace (publish)` scope.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details on:

- Development setup and workflow
- Code style and standards
- Testing requirements
- Pull request process
- Architecture guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **VS Code Team**: For the excellent extension API and development tools
- **Qdrant**: For the powerful vector database capabilities
- **SvelteKit**: For the modern, reactive UI framework
- **Tree-sitter**: For robust code parsing capabilities
- **Fluent UI**: For beautiful, accessible UI components

## 📞 Support

- **Documentation**: Check the [docs/](docs/) folder for comprehensive guides
- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/bramburn/bigcontext/issues)
- **Discussions**: Join the conversation in [GitHub Discussions](https://github.com/bramburn/bigcontext/discussions)

---

**Made with ❤️ for developers who love intelligent code navigation**
