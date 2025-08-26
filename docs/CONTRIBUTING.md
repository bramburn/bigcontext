# Contributing to Code Context Engine

Thank you for your interest in contributing to the Code Context Engine! This guide will help you get started with development and contributing to the project.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [Code Style and Standards](#code-style-and-standards)
6. [Submitting Changes](#submitting-changes)
7. [Architecture Overview](#architecture-overview)
8. [Adding New Features](#adding-new-features)
9. [Debugging](#debugging)
10. [Release Process](#release-process)

## Development Setup

### Prerequisites

- **Node.js**: Version 18.x or 20.x (see `.nvmrc` for exact version)
- **VS Code**: Latest stable version
- **Git**: For version control
- **Docker**: Optional, for running Qdrant locally

### Initial Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/bramburn/bigcontext.git
   cd bigcontext
   ```

2. **Install Dependencies**
   ```bash
   # Install main extension dependencies
   npm install
   
   # Install webview dependencies
   cd webview
   npm install
   cd ..
   ```

3. **Build the Project**
   ```bash
   # Compile TypeScript
   npm run compile
   
   # Build webview
   npm run build-webview
   ```

4. **Start Development**
   ```bash
   # Watch mode for TypeScript
   npm run watch
   
   # In another terminal, watch webview changes
   cd webview && npm run dev
   ```

### Development Environment

1. **Open in VS Code**
   ```bash
   code .
   ```

2. **Launch Extension Development Host**
   - Press `F5` or use "Run and Debug" view
   - Select "Launch Extension" configuration
   - This opens a new VS Code window with your extension loaded

3. **Test Changes**
   - Make changes to the code
   - Reload the extension host window (`Ctrl+R` / `Cmd+R`)
   - Test your changes in the development environment

## Project Structure

```
bigcontext/
├── src/                          # Main extension source code
│   ├── context/                  # Context and search services
│   ├── db/                       # Database integrations (Qdrant)
│   ├── embeddings/               # Embedding providers
│   ├── formatting/               # XML formatting services
│   ├── indexing/                 # Code indexing and parsing
│   ├── configuration/            # Configuration management
│   ├── test/                     # Test files
│   ├── extensionManager.ts       # Main extension manager
│   ├── messageRouter.ts          # Message routing between UI and backend
│   └── extension.ts              # Extension entry point
├── webview/                      # SvelteKit-based UI
│   ├── src/
│   │   ├── lib/components/       # Svelte components
│   │   ├── lib/stores/           # Svelte stores for state management
│   │   └── routes/               # SvelteKit routes
│   ├── static/                   # Static assets
│   └── build/                    # Built webview files
├── docs/                         # Documentation
├── .github/workflows/            # CI/CD pipelines
├── package.json                  # Extension manifest and dependencies
└── README.md                     # Project overview
```

### Key Components

- **ExtensionManager**: Central coordinator for all services
- **MessageRouter**: Handles communication between webview and backend
- **ContextService**: Core search and context functionality
- **IndexingService**: Code parsing and indexing
- **StateManager**: Global state management
- **WebviewManager**: Manages the SvelteKit-based UI

## Development Workflow

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the existing code patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Run tests
   npm test
   
   # Test in development environment
   # Press F5 in VS Code to launch extension host
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Format

We follow conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add XML export functionality to search results
fix: resolve indexing timeout issues
docs: update user guide with new features
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --grep "ContextService"
```

### Test Structure

- **Unit Tests**: Located in `src/test/suite/`
- **Integration Tests**: Test service interactions
- **UI Tests**: Test webview components (in `webview/src/test/`)

### Writing Tests

1. **Create Test Files**
   - Place in `src/test/suite/`
   - Name with `.test.ts` suffix
   - Follow existing test patterns

2. **Test Structure Example**
   ```typescript
   import * as assert from 'assert';
   import { YourService } from '../../path/to/service';
   
   suite('YourService Tests', () => {
       let service: YourService;
       
       setup(() => {
           service = new YourService();
       });
       
       test('should do something', () => {
           const result = service.doSomething();
           assert.strictEqual(result, expectedValue);
       });
   });
   ```

### Testing Guidelines

- Write tests for all new functionality
- Aim for high test coverage
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies

## Code Style and Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Follow existing naming conventions

### Code Organization

- Keep files focused and single-purpose
- Use dependency injection for services
- Implement proper error handling
- Follow SOLID principles
- Use async/await over Promises

### Linting and Formatting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix

# Check formatting (if Prettier is configured)
npx prettier --check "src/**/*.ts"
```

## Submitting Changes

### Pull Request Process

1. **Ensure Tests Pass**
   ```bash
   npm test
   npm run compile
   npm run build-webview
   ```

2. **Create Pull Request**
   - Push your branch to GitHub
   - Create a pull request against `main`
   - Fill out the PR template
   - Link any related issues

3. **PR Requirements**
   - All tests must pass
   - Code must be properly formatted
   - Documentation must be updated
   - Changes must be backwards compatible

### Code Review

- All PRs require review from maintainers
- Address feedback promptly
- Keep PRs focused and reasonably sized
- Be responsive to questions and suggestions

## Architecture Overview

### Extension Architecture

The extension follows a modular architecture with clear separation of concerns:

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

### Key Design Principles

- **Dependency Injection**: Services are injected rather than directly instantiated
- **Event-Driven**: State changes are communicated through events
- **Async/Await**: All I/O operations use async/await pattern
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Testability**: Services are designed to be easily testable

## Adding New Features

### Adding a New Service

1. **Create Service Class**
   ```typescript
   export class YourService {
       constructor(private dependency: SomeDependency) {}
       
       public async doSomething(): Promise<Result> {
           // Implementation
       }
   }
   ```

2. **Register in ExtensionManager**
   ```typescript
   // In extensionManager.ts
   this.yourService = new YourService(dependency);
   ```

3. **Add to MessageRouter** (if needed)
   ```typescript
   // In messageRouter.ts
   case 'yourAction':
       await this.handleYourAction(message, webview);
       break;
   ```

### Adding UI Components

1. **Create Svelte Component**
   ```svelte
   <!-- webview/src/lib/components/YourComponent.svelte -->
   <script lang="ts">
       // Component logic
   </script>
   
   <!-- Component template -->
   
   <style>
       /* Component styles */
   </style>
   ```

2. **Add to Route** (if needed)
   ```svelte
   <!-- webview/src/routes/+page.svelte -->
   <script>
       import YourComponent from '$lib/components/YourComponent.svelte';
   </script>
   
   <YourComponent />
   ```

### Adding Configuration Options

1. **Update package.json**
   ```json
   "contributes": {
       "configuration": {
           "properties": {
               "codeContextEngine.yourSetting": {
                   "type": "string",
                   "default": "defaultValue",
                   "description": "Description of your setting"
               }
           }
       }
   }
   ```

2. **Access in Code**
   ```typescript
   const config = vscode.workspace.getConfiguration('codeContextEngine');
   const yourSetting = config.get<string>('yourSetting');
   ```

## Debugging

### Extension Debugging

1. **Set Breakpoints** in VS Code
2. **Launch Extension** (`F5`)
3. **Debug in Extension Host** window
4. **Use Console** for logging

### Webview Debugging

1. **Open Developer Tools**
   - In extension host window: `Ctrl+Shift+I`
   - Or right-click webview → "Inspect"

2. **Debug Svelte Components**
   - Use browser dev tools
   - Check console for errors
   - Inspect component state

### Common Debugging Scenarios

- **Message Passing**: Check MessageRouter logs
- **Database Issues**: Verify Qdrant connection
- **Indexing Problems**: Check file permissions and parsing errors
- **UI Issues**: Use browser dev tools in webview

## Release Process

### Version Management

1. **Update Version**
   ```bash
   npm version patch|minor|major
   ```

2. **Update Changelog**
   - Document new features
   - List bug fixes
   - Note breaking changes

3. **Create Release**
   - Push tags to GitHub
   - CI/CD will create release artifacts
   - Publish to VS Code Marketplace (maintainers only)

### CI/CD Pipeline

The project uses GitHub Actions for:
- **Build and Test**: On all PRs and pushes
- **Security Scanning**: Dependency audits
- **Code Quality**: Linting and type checking
- **Release**: Automated VSIX creation
- **Docker Services**: Integration testing with Qdrant

---

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Documentation**: Check the `docs/` folder for detailed guides
- **Code Review**: Maintainers are happy to help with code review

Thank you for contributing to Code Context Engine!
