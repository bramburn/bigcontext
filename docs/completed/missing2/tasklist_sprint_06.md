# Task List: Sprint 6 - CI/CD Pipeline & Documentation

**Goal:** To automate the build and test process with GitHub Actions and create comprehensive user and contributor documentation.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **6.1** | ☐ To Do | **Create Workflow Directory:** In the root of the project, create the necessary directories for the workflow file by running `mkdir -p .github/workflows`. | `.github/workflows/` |
| **6.2** | ☐ To Do | **Create Workflow File:** Create a new, empty file named `ci.yml` inside the `.github/workflows` directory. | `.github/workflows/ci.yml` |
| **6.3** | ☐ To Do | **Define Workflow Name and Triggers:** In `ci.yml`, add the `name` of the workflow and the `on` section to trigger it on `push` to `main` and on `pull_request` events. | `.github/workflows/ci.yml` |
| **6.4** | ☐ To Do | **Define Build & Test Job:** In `ci.yml`, define a job named `build-and-test` that `runs-on: ubuntu-latest`. | `.github/workflows/ci.yml` |
| **6.5** | ☐ To Do | **Add Checkout Step:** Add the first step to the job using `uses: actions/checkout@v3` to check out the repository code. | `.github/workflows/ci.yml` |
| **6.6** | ☐ To Do | **Add Node.js Setup Step:** Add a step using `uses: actions/setup-node@v3` to install and configure Node.js version 18. | `.github/workflows/ci.yml` |
| **6.7** | ☐ To Do | **Add Root Install Step:** Add a `run` step with the command `npm install` to install the main extension dependencies. | `.github/workflows/ci.yml` |
| **6.8** | ☐ To Do | **Add Webview Install Step:** Add a `run` step with the command `npm install` and set `working-directory: ./webview` to install the webview dependencies. | `.github/workflows/ci.yml` |
| **6.9** | ☐ To Do | **Add Lint Step:** Add a `run` step with the command `npm run lint` to execute the linter. | `.github/workflows/ci.yml` |
| **6.10**| ☐ To Do | **Add Test Step:** Add a `run` step with the command `npm run test` to execute the automated test suite. | `.github/workflows/ci.yml` |
| **6.11**| ☐ To Do | **Add Build Step:** Add a `run` step with the command `npm run vscode:prepublish` to compile the code and build the `.vsix` package. | `.github/workflows/ci.yml` |
| **6.12**| ☐ To Do | **Add Upload Artifact Step:** Add a final step using `uses: actions/upload-artifact@v3`. Configure it to upload the generated `.vsix` file with an appropriate artifact name (e.g., `extension-vsix-package`). | `.github/workflows/ci.yml` |
| **6.13**| ☐ To Do | **Update `README.md`:** Overhaul the `README.md` file. Add detailed sections for Features, Installation from the marketplace, all Configuration options, Commands, and Keyboard Shortcuts. | `README.md` |
| **6.14**| ☐ To Do | **Create Demo GIF:** Use a screen recording tool to record a short GIF of the main user workflow (setup, index, query). Create an `assets` directory and save the file as `assets/demo.gif`. | `assets/demo.gif` |
| **6.15**| ☐ To Do | **Embed Demo GIF:** Add the markdown `![Demo](assets/demo.gif)` to the top of the `README.md` file. | `README.md` |
| **6.16**| ☐ To Do | **Create `CONTRIBUTING.md`:** Create a new `CONTRIBUTING.md` file in the root directory. Add sections for setting up the development environment, running tests, and the pull request process. | `CONTRIBUTING.md` |
| **6.17**| ☐ To Do | **Test CI Pipeline:** Push a commit to a new branch and open a pull request to `main`. Verify that the CI workflow is triggered and all steps execute successfully on GitHub. | `(Manual Test on GitHub)` |
