### Implementation Guide: Sprint 7 - Documentation & Publishing

**Objective:** To create high-quality documentation and publish the extension to the marketplace.

#### **Analysis**

This final sprint focuses on the crucial aspects of product delivery: comprehensive documentation and marketplace publishing. Effective documentation (README, contributing guide) is vital for user adoption and community engagement. Publishing to the VS Code Marketplace makes the extension discoverable and easily installable. Automating the publishing process via GitHub Actions ensures consistency and reduces manual errors.

#### **Prerequisites and Setup**

1.  **Completed Extension:** The extension should be fully functional and tested from previous sprints.
2.  **GitHub Repository:** Your project must be hosted on GitHub.
3.  **VS Code Extension Publisher Account:** You will need to create one on the Azure DevOps organization for VS Code publishers.
4.  **`vsce` (Visual Studio Code Extension Manager):** This tool is used for packaging and publishing VS Code extensions.
    ```bash
    npm install -g vsce
    ```

#### **Implementation Guide**

Here's a step-by-step guide to creating documentation and publishing your extension:

**1. Write `README.md` Content**

The `README.md` is the first thing users see. It should clearly explain what your extension does, how to install it, configure it, and use it.

  *   **File:** `README.md`
  *   **Key Sections to Include:**
      *   **Title and Overview:** A clear, concise description of the extension.
      *   **Features:** A bulleted list of key functionalities.
      *   **Installation:** Step-by-step instructions for installing from the Marketplace or manually.
      *   **Configuration:** How to access and change settings, with examples.
      *   **Usage:** A guide on how to use the extension's core features.
      *   **Screenshots/GIFs:** Visual aids are highly recommended.
      *   **Contributing (Optional):** Link to `CONTRIBUTING.md`.
      *   **License:** Information about the extension's license.

  *   **Example Structure:**
    ```markdown
    # Code Context Engine VS Code Extension

    ![Demo GIF](assets/demo.gif) <!-- Link to your demo GIF -->

    A powerful VS Code extension that helps developers understand their codebase by providing contextual information through semantic search and LSP integration.

    ## Features
    - Intelligent code indexing using AST parsing and LSP data.
    - Semantic search for related files and code snippets.
    - Customizable embedding providers (Ollama, OpenAI).
    - Local Qdrant vector database integration.
    - Intuitive settings UI for easy configuration.

    ## Installation
    1.  **From VS Code Marketplace:** Search for "Code Context Engine" in the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`) and click "Install".
    2.  **Manual Installation:**
        a.  Clone this repository: `git clone https://github.com/your-username/code-context-engine.git`
        b.  Navigate to the project root: `cd code-context-engine`
        c.  Package the extension: `vsce package`
        d.  Install the `.vsix` file: Open VS Code, go to Extensions view, click `...` (More Actions) -> `Install from VSIX...` and select the generated `.vsix` file.

    ## Configuration
    To configure the extension, open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and search for "Code Context Engine: Open Settings".

    -   **Embedding Provider:** Select your preferred embedding model (e.g., Ollama for local models, OpenAI for cloud-based).
    -   **Database Connection String:** Specify the URL for your Qdrant instance (e.g., `http://localhost:6333`).

    ## Usage
    1.  **Index Your Repository:** Open the Code Context Engine panel (View -> Open View -> Code Context Engine) and click "Index Now".
    2.  **Query Context:** Use the search bar in the panel to ask questions about your codebase (e.g., "Show me authentication logic", "Find files related to user profiles").

    ## Contributing
    We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

    ## License
    [Your License Here]
    ```

**2. Create Demo GIF**

A short, animated GIF demonstrating the core functionality of your extension can significantly improve user understanding and engagement.

  *   **Tool:** Use screen recording software (e.g., OBS Studio, ShareX, macOS built-in recorder) to capture your workflow. Then, use a GIF converter (e.g., online tools, FFmpeg) to create an optimized GIF.
  *   **File:** `assets/demo.gif` (or similar path, referenced in `README.md`)
  *   **Tips:**
      *   Keep it short and focused (10-30 seconds).
      *   Highlight the most impactful features.
      *   Ensure good resolution and clear text.
      *   Optimize file size for faster loading.

**3. Write `CONTRIBUTING.md`**

This file provides guidelines for potential contributors, making it easier for others to get involved with your project.

  *   **File:** `CONTRIBUTING.md`
  *   **Key Sections to Include:**
      *   **How to Contribute:** General overview.
      *   **Local Development Setup:** Instructions for cloning, installing dependencies, and running the project locally.
      *   **Running Tests:** How to execute unit and integration tests.
      *   **Code Style and Linting:** Any specific coding conventions or tools.
      *   **Submitting Changes:** Guidelines for pull requests (e.g., branch naming, commit message format).
      *   **Reporting Bugs/Suggesting Features:** How to open issues.

  *   **Example Structure:**
    ```markdown
    # Contributing to Code Context Engine

    We welcome and appreciate contributions to the Code Context Engine VS Code extension! By contributing, you help us make this tool better for everyone.

    ## How to Get Started

    1.  **Fork the Repository:** Start by forking the `code-context-engine` repository on GitHub.
    2.  **Clone Your Fork:** `git clone https://github.com/your-username/code-context-engine.git`
    3.  **Install Dependencies:** Navigate to the project root and install all necessary dependencies:
        ```bash
        npm install
        ```
    4.  **Open in VS Code:** Open the cloned project in Visual Studio Code.

    ## Local Development

    -   **Run Extension:** Press `F5` in VS Code to launch a new Extension Development Host window with your extension loaded.
    -   **Build Webview:** If you make changes to the SvelteKit webview, navigate to the `webview` directory and run `npm run build` to compile the changes.

    ## Running Tests

    To run the project's tests:

    ```bash
    npm test
    ```

    ## Code Style and Linting

    We use ESLint and Prettier to maintain code quality and consistency. Please ensure your code passes linting checks before submitting a pull request:

    ```bash
    npm run lint
    ```

    ## Submitting Changes (Pull Requests)

    1.  **Create a Branch:** Create a new branch for your feature or bug fix:
        `git checkout -b feature/your-feature-name` or `git checkout -b bugfix/issue-number`
    2.  **Make Your Changes:** Implement your feature or fix the bug.
    3.  **Write Tests:** Ensure your changes are covered by appropriate unit or integration tests.
    4.  **Commit Your Changes:** Write clear, concise commit messages that explain *what* and *why*.
    5.  **Push to Your Fork:** `git push origin your-branch-name`
    6.  **Open a Pull Request:** Go to the original `code-context-engine` repository on GitHub and open a new pull request from your branch.

    ## Reporting Issues / Suggesting Features

    If you find a bug or have a feature request, please open an issue on our [GitHub Issues page](https://github.com/your-username/code-context-engine/issues).
    ```

**4. Create Marketplace Publisher Identity**

To publish your extension, you need a publisher ID. This is done through Azure DevOps.

  *   **Action:** Follow the official VS Code documentation to create a publisher. This typically involves:
      1.  Going to the Azure DevOps organization for VS Code publishers.
      2.  Creating a new organization if you don't have one.
      3.  Creating a Personal Access Token (PAT) with `Marketplace (Publish)` scope.
  *   **Reference:** [Publishing Extensions - Visual Studio Code](https://code.visualstudio.com/api/references/publishing-extensions)

**5. Update GitHub Actions for Manual Release Trigger**

Modify your `ci.yml` workflow to include a `workflow_dispatch` event, allowing you to manually trigger the release job from the GitHub Actions UI.

  *   **File:** `.github/workflows/ci.yml`
  *   **Key Concept:** `workflow_dispatch` enables manual triggering of workflows.

  *   **Implementation Example (add to `on` section):**
    ```yaml
    on:
      push:
        branches:
          - main
      pull_request:
        branches:
          - main
      workflow_dispatch: # This enables manual triggering
    ```

**6. Implement Publishing Step in CI/CD Pipeline**

Add a new job to your `ci.yml` that will execute the `vsce publish` command. This job should depend on the `build` job and use a GitHub Secret to store your `vsce` Personal Access Token (PAT).

  *   **File:** `.github/workflows/ci.yml`
  *   **Key Concepts:**
      *   `needs`: Specifies that a job depends on the successful completion of another job.
      *   `if`: Conditional execution of a job.
      *   `secrets`: Securely store sensitive information like API keys.
      *   `vsce publish -p <token>`: Command to publish the extension.

  *   **Implementation Example (add a new job after `build` job):**
    ```yaml
    # ... (existing build job)

    release:
      needs: build # This job depends on the 'build' job completing successfully
      runs-on: ubuntu-latest
      if: github.event_name == 'workflow_dispatch' # Only run this job when manually triggered

      steps:
        - name: Checkout repository
          uses: actions/checkout@v3

        - name: Set up Node.js
          uses: actions/setup-node@v3
          with:
            node-version: '18' # Or your project's Node.js version

        - name: Install vsce
          run: npm install -g vsce

        - name: Download VSIX artifact
          uses: actions/download-artifact@v3
          with:
            name: vsix-package
            path: .

        - name: Publish to VS Code Marketplace
          run: vsce publish -p ${{ secrets.VSCE_TOKEN }}
          env:
            VSCE_TOKEN: ${{ secrets.VSCE_TOKEN }} # Pass the token as an environment variable
    ```
    *   **Important:** You must add `VSCE_TOKEN` as a repository secret in your GitHub repository settings (Settings -> Secrets and variables -> Actions -> New repository secret).

**7. Test the Release Process**

After setting up the workflow, perform a test release to ensure everything works as expected.

  *   **Action:**
      1.  Go to your GitHub repository -> Actions tab.
      2.  Select your `CI/CD` workflow.
      3.  Click `Run workflow` button (usually on the right side).
      4.  Select the `main` branch and click `Run workflow`.
      5.  Monitor the workflow run for success.
      6.  Check the VS Code Marketplace for your published extension.

This completes the implementation guide for Sprint 7. You now have a well-documented extension and an automated process for publishing it to the VS Code Marketplace, making it accessible to a wider audience.