### User Story 1: Comprehensive User Documentation

**As a** user, **I want to** have clear and comprehensive documentation for the extension, **so that** I can easily install, configure, and use it.

**Actions to Undertake:**
1.  **Filepath**: `README.md`
    -   **Action**: Update the `README.md` file with a feature list, installation instructions, and a guide on configuring the settings.
    -   **Implementation**: (Write content for `README.md`)
        ```markdown
        # Code Context Engine VS Code Extension

        ## Features
        - Code indexing and semantic search
        - LSP integration for rich context
        - Customizable settings for embedding providers and database

        ## Installation
        1. Install from VS Code Marketplace (link to be added).
        2. Alternatively, clone this repository and run `vsce package` then `code --install-extension your-extension.vsix`.

        ## Configuration
        Access settings via `Ctrl+Shift+P` (Cmd+Shift+P) and search for "Code Context Engine: Open Settings".
        - **Embedding Provider**: Choose between Ollama, OpenAI, etc.
        - **Database Connection String**: Specify your Qdrant instance.

        ## Usage
        (Detailed steps on how to use the extension, e.g., how to trigger indexing, how to perform queries)
        ```
    -   **Imports**: None.
2.  **Filepath**: `assets/demo.gif` (New File)
    -   **Action**: Create an animated GIF demonstrating the core workflow of the extension.
    -   **Implementation**: (Use screen recording software to capture workflow and convert to optimized GIF)
        ```
        <!-- In README.md -->
        ![Demo GIF](assets/demo.gif)
        ```
    -   **Imports**: None.
3.  **Filepath**: `CONTRIBUTING.md` (New File)
    -   **Action**: Create a `CONTRIBUTING.md` file with guidelines for new developers.
    -   **Implementation**: (Write content for `CONTRIBUTING.md`)
        ```markdown
        # Contributing to Code Context Engine

        We welcome contributions! Here's how to get started:

        ## Setup
        1. Clone the repository.
        2. Run `npm install`.
        3. Open in VS Code.

        ## Running Tests
        `npm test`

        ## Submitting Changes
        - Fork the repository.
        - Create a new branch for your feature or bug fix.
        - Ensure your code adheres to our linting rules (`npm run lint`).
        - Write clear commit messages.
        - Open a pull request.
        ```
    -   **Imports**: None.

### User Story 2: Publish to VS Code Marketplace

**As a** project owner, **I want to** publish the extension to the VS Code Marketplace, **so that** it is easily discoverable and accessible to all users.

**Actions to Undertake:**
1.  **Filepath**: `(External)`
    -   **Action**: Create a publisher identity on the VS Code Marketplace.
    -   **Implementation**: (Follow instructions on VS Code Marketplace publisher creation)
    -   **Imports**: None.
2.  **Filepath**: `.github/workflows/ci.yml`
    -   **Action**: Update the GitHub Actions pipeline with a manual "release" trigger.
    -   **Implementation**: (Add `workflow_dispatch` to `on` section)
        ```yaml
        on:
          push:
            branches:
              - main
          pull_request:
            branches:
              - main
          workflow_dispatch: # Manual trigger
        ```
    -   **Imports**: None.
3.  **Filepath**: `.github/workflows/ci.yml`
    -   **Action**: Implement a job in the CI/CD pipeline that automatically packages and publishes the extension to the marketplace when triggered.
    -   **Implementation**: (Add a new job, potentially with `vsce publish` and secrets)
        ```yaml
        # ... existing build job ...

        release:
          needs: build # Ensure build job completes successfully first
          runs-on: ubuntu-latest
          if: github.event_name == 'workflow_dispatch' # Only run on manual trigger

          steps:
            - uses: actions/checkout@v3
            - name: Use Node.js
              uses: actions/setup-node@v3
              with:
                node-version: '18'
            - name: Install dependencies
              run: npm install
            - name: Download VSIX artifact
              uses: actions/download-artifact@v3
              with:
                name: vsix-package
            - name: Publish to VS Code Marketplace
              run: npx vsce publish -p ${{ secrets.VSCE_TOKEN }}
              env:
                VSCE_TOKEN: ${{ secrets.VSCE_TOKEN }}
        ```
    -   **Imports**: None.

**Acceptance Criteria:**
-   The `README.md` file is updated with all required sections (features, installation, configuration, usage).
-   An animated GIF demonstrating the core workflow is present in the `assets` directory and linked in `README.md`.
-   A `CONTRIBUTING.md` file is created with clear guidelines for contributors.
-   A publisher identity is successfully created on the VS Code Marketplace.
-   The GitHub Actions workflow includes a manual trigger for publishing.
-   Triggering the release workflow successfully publishes the extension to the VS Code Marketplace.

**Testing Plan:**
-   **Test Case 1**: Review `README.md` and `CONTRIBUTING.md` for completeness, clarity, and accuracy.
-   **Test Case 2**: Verify the animated GIF plays correctly and effectively demonstrates the extension's functionality.
-   **Test Case 3**: Manually trigger the GitHub Actions release workflow. Monitor the workflow run for successful completion.
-   **Test Case 4**: After successful release, search for the extension on the VS Code Marketplace to confirm its presence and correct listing.
-   **Test Case 5**: Install the published extension in a fresh VS Code instance and verify its basic functionality.
