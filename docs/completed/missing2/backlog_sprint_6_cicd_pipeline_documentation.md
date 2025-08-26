### User Story 1: CI/CD Automation
**As a** backend developer (Alisha), **I want** a CI/CD pipeline using GitHub Actions to automate builds and testing, **so that** we can ensure code quality, catch regressions early, and streamline the release process.

**Actions to Undertake:**
1.  **Filepath**: `.github/workflows/ci.yml` (New File)
    -   **Action**: Create a new GitHub Actions workflow file to define the Continuous Integration process.
    -   **Implementation**: Define the workflow name and the triggers (`push` to `main` and `pull_request`).
    -   **Imports**: N/A
2.  **Filepath**: `.github/workflows/ci.yml`
    -   **Action**: Define the `build-and-test` job with the necessary steps for validation.
    -   **Implementation**:
        ```yaml
        jobs:
          build-and-test:
            runs-on: ubuntu-latest
            steps:
              - uses: actions/checkout@v3
              - uses: actions/setup-node@v3
                with:
                  node-version: '18'
              - run: npm install
              - run: npm install
                working-directory: ./webview
              - run: npm run lint
              - run: npm run test
        ```
    -   **Imports**: N/A
3.  **Filepath**: `.github/workflows/ci.yml`
    -   **Action**: Add steps to build the extension package (`.vsix`) and upload it as a build artifact.
    -   **Implementation**:
        ```yaml
        # (Add to the end of the steps list)
              - name: Build VSIX Package
                run: npm run vscode:prepublish
              - name: Upload VSIX Artifact
                uses: actions/upload-artifact@v3
                with:
                  name: extension-vsix
                  path: "*.vsix"
        ```
    -   **Imports**: N/A

**Acceptance Criteria:**
-   A workflow file exists at `.github/workflows/ci.yml`.
-   The workflow automatically runs on every pull request and push to the `main` branch.
-   The workflow successfully installs all dependencies, runs the linter, and executes tests.
-   If all previous steps pass, the workflow builds the `.vsix` package and saves it as a downloadable artifact named `extension-vsix`.
-   A failing test or linting error causes the workflow to fail.

**Testing Plan:**
-   **Integration Test 1**: Open a new pull request with a minor change. Verify that the GitHub Action is triggered and completes successfully.
-   **Integration Test 2**: Open a pull request that intentionally introduces a linting error. Verify that the workflow fails at the "lint" step.
-   **Integration Test 3**: After a successful run, go to the "Actions" tab in the GitHub repository, select the workflow run, and verify that a `.vsix` file can be downloaded from the "Artifacts" section.

---

### User Story 2: Comprehensive Documentation
**As a** developer (Devin), **I want** clear, comprehensive documentation for the extension, **so that** I know how to install, configure, and use it effectively, and other developers know how to contribute.

**Actions to Undertake:**
1.  **Filepath**: `README.md`
    -   **Action**: Overhaul the `README.md` to be a comprehensive user guide.
    -   **Implementation**: Add sections for Features, Installation, Configuration (detailing the settings in `package.json`), Commands, and default Keyboard Shortcuts.
    -   **Imports**: N/A
2.  **Filepath**: `assets/demo.gif` (New File)
    -   **Action**: Create a short animated GIF demonstrating the core workflow (e.g., setup, index, query).
    -   **Implementation**: Use a screen recording tool (e.g., Kap, LICEcap) to capture the workflow, save it as a GIF, and place it in a new `assets` directory.
    -   **Imports**: N/A
3.  **Filepath**: `README.md`
    -   **Action**: Embed the new demo GIF into the `README.md`.
    -   **Implementation**: `![Code Context Engine Demo](assets/demo.gif)`
    -   **Imports**: N/A
4.  **Filepath**: `CONTRIBUTING.md` (New File)
    -   **Action**: Create a new document with guidelines for developers who want to contribute to the project.
    -   **Implementation**: Add sections for "Setting Up the Development Environment", "Running Tests", and "Submitting a Pull Request".
    -   **Imports**: N/A

**Acceptance Criteria:**
-   The `README.md` file is well-structured and contains all necessary information for an end-user.
-   A `CONTRIBUTING.md` file exists and provides clear instructions for new contributors.
-   A demo GIF is present and correctly displayed in the `README.md`.

**Testing Plan:**
-   **Manual Test 1**: Ask a new user to read the `README.md` and attempt to install and configure the extension. Verify they can do so without assistance.
-   **Manual Test 2**: Ask a developer to follow the `CONTRIBUTING.md` guide to set up the project locally. Verify they can successfully run the tests.
