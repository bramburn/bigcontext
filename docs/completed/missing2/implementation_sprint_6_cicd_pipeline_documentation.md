This guide provides implementation details for Sprint 6: CI/CD Pipeline & Documentation.

### 1. Creating the GitHub Actions CI Workflow

A Continuous Integration (CI) workflow automates the testing and build process. GitHub Actions is the perfect tool for this, as it's integrated directly into the repository.

**Location**: `.github/workflows/ci.yml`

**Web Search/API Info**: A search for "github actions nodejs vscode extension" confirms the standard workflow: Checkout -> Setup Node -> Install -> Lint -> Test -> Build -> Upload Artifact. We will use official actions like `actions/checkout`, `actions/setup-node`, and `actions/upload-artifact`.

**Complete `ci.yml` Implementation**:
```yaml
name: Build and Test Extension

# Triggers the workflow on pushes to the main branch and on any pull request
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-test:
    # Use the latest stable version of Ubuntu
    runs-on: ubuntu-latest

    steps:
      # 1. Check out the repository code
      - name: Checkout code
        uses: actions/checkout@v3

      # 2. Set up the specific version of Node.js required by the project
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm' # Cache npm dependencies for faster runs

      # 3. Install dependencies for the main extension
      - name: Install root dependencies
        run: npm install

      # 4. Install dependencies for the SvelteKit webview
      - name: Install webview dependencies
        run: npm install
        working-directory: ./webview # Run the command in the webview sub-folder

      # 5. Run the linter to check for code style issues
      - name: Lint source code
        run: npm run lint

      # 6. Run the automated test suite
      - name: Run tests
        run: npm run test

      # 7. Build the .vsix package if all previous steps passed
      - name: Build VSIX Package
        run: npm run vscode:prepublish

      # 8. Upload the generated .vsix file as a build artifact
      - name: Upload VSIX Artifact
        uses: actions/upload-artifact@v3
        with:
          name: extension-vsix-package # Name of the artifact
          path: "*.vsix" # Glob pattern to find the .vsix file
```

### 2. Creating High-Quality Documentation

Good documentation is essential for user adoption and community contributions.

#### `README.md` Structure

This is the front door for your project. It should be clear, concise, and provide all the key information a user needs.

**Recommended `README.md` Template**:
````markdown
# Code Context Engine

![Demo of the Code Context Engine](assets/demo.gif)

The Code Context Engine is a VS Code extension that uses AI to provide deep, context-aware search and analysis for your codebase.

## Features

*   **Vector-Based Search**: Find code based on conceptual meaning, not just keywords.
*   **Configurable Backend**: Supports local (Ollama) and remote (OpenAI) embedding providers.
*   **Machine-Readable Output**: Generates results in a `repomix`-style XML format for use in other AI pipelines.

## Installation

1.  Open **VS Code**.
2.  Navigate to the **Extensions** view (Cmd+Shift+X).
3.  Search for "**Code Context Engine**".
4.  Click **Install**.

## Configuration

The extension can be configured via the native VS Code settings (Cmd+,). Key settings include:

| Setting                                   | Description                                | Default                |
| ----------------------------------------- | ------------------------------------------ | ---------------------- |
| `code-context-engine.embeddingProvider`   | The embedding provider to use.             | `ollama`               |
| `code-context-engine.databaseConnectionString` | Connection string for the Qdrant database. | `http://localhost:6333`|
| `code-context-engine.maxSearchResults`    | The maximum number of results to return.   | `20`                   |

## Keyboard Shortcuts

| Command           | macOS       | Windows/Linux |
| ----------------- | ----------- | ------------- |
| Open Main Panel   | `Cmd+Alt+C` | `Ctrl+Alt+C`  |
| Start Indexing    | `Cmd+Alt+I` | `Ctrl+Alt+I`  |
````

#### `CONTRIBUTING.md` Structure

This file tells other developers how to get involved.

**Recommended `CONTRIBUTING.md` Template**:
````markdown
# Contributing to Code Context Engine

We welcome contributions from the community! Thank you for your interest.

## Development Environment Setup

1.  **Fork and Clone**: Fork the repository and clone it to your local machine.
    ```bash
    git clone https://github.com/YOUR_USERNAME/bigcontext.git
    ```

2.  **Install Dependencies**: This project has dependencies in both the root and the `webview` folder.
    ```bash
    # Install root dependencies
    npm install

    # Install webview dependencies
    cd webview
    npm install
    cd ..
    ```

3.  **Open in VS Code**: Open the project folder in VS Code. Press `F5` to start a new Extension Development Host window with the extension running.

## Running Tests

To run the automated test suite from the command line:

```bash
npm run test
```

## Pull Request Process

1.  Ensure any new code is accompanied by tests.
2.  Ensure the full test suite passes (`npm run test`).
3.  Create a pull request detailing your changes.
````

### 3. Creating a Demo GIF

A short, silent GIF is often more effective than a long video.

**Recommended Tools**:
-   **macOS**: [Kap](https://getkap.co/) (Free)
-   **Windows/macOS**: [LICEcap](https://www.cockos.com/licecap/) (Free)
-   **Linux**: [Peek](https://github.com/phw/peek) (Free)

**Recording Script**:
1.  Start with the main panel open.
2.  Briefly show the Diagnostics/Settings UI.
3.  Use the "Start Indexing" command.
4.  Switch to the "Indexing" view to show progress.
5.  Once done, switch to the "Query" view.
6.  Type a conceptual query (e.g., "how does the application handle user state?").
7.  Show the final XML results displayed in the view.
8.  Keep the GIF under 30 seconds.
