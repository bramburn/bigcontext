# Task List: Sprint 2 - CI/CD Automation

**Goal:** To automate the build, test, and release process using GitHub Actions.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Create Workflow Directory:** Create a new directory path `.github/workflows` if it doesn't already exist. | `.github/workflows/` (New) |
| **2.2** | ☐ To Do | **Create `ci.yml` file:** Inside `.github/workflows`, create a new file named `ci.yml`. | `.github/workflows/ci.yml` (New) |
| **2.3** | ☐ To Do | **Define CI Trigger:** In `ci.yml`, define the trigger for the workflow to run on pull requests to the `main` branch: `on: pull_request: branches: [ main ]`. | `.github/workflows/ci.yml` |
| **2.4** | ☐ To Do | **Add CI Job:** In `ci.yml`, define a job named `build_and_test`. Specify that it runs on `ubuntu-latest`. | `.github/workflows/ci.yml` |
| **2.5** | ☐ To Do | **Add Checkout Step:** In the `build_and_test` job, add the first step to check out the repository's code: `uses: actions/checkout@v3`. | `.github/workflows/ci.yml` |
| **2.6** | ☐ To Do | **Add Node.js Setup Step:** Add a step to set up Node.js: `uses: actions/setup-node@v3` with a specific Node.js version (e.g., 18). | `.github/workflows/ci.yml` |
| **2.7** | ☐ To Do | **Add .NET SDK Setup Step:** Add a step to set up the .NET SDK: `uses: actions/setup-dotnet@v3` with a specific .NET version (e.g., 6.0.x). | `.github/workflows/ci.yml` |
| **2.8** | ☐ To Do | **Add Dependency Installation Step:** Add a step to install all npm dependencies: `run: npm install && npm install --workspace=webview`. | `.github/workflows/ci.yml` |
| **2.9** | ☐ To Do | **Add Build Step:** Add a step to run the unified build command: `run: npm run build:all`. | `.github/workflows/ci.yml` |
| **2.10**| ☐ To Do | **Add Test Step:** Add a step to run the tests: `run: npm test`. | `.github/workflows/ci.yml` |
| **2.11**| ☐ To Do | **Create `release.yml` file:** Inside `.github/workflows`, create a new file named `release.yml`. | `.github/workflows/release.yml` (New) |
| **2.12**| ☐ To Do | **Define Release Triggers:** In `release.yml`, define two triggers: a manual `workflow_dispatch` trigger and a trigger for when a release is published: `on: workflow_dispatch: release: types: [published]`. | `.github/workflows/release.yml` |
| **2.13**| ☐ To Do | **Add Packaging Job to `release.yml`:** Create a `package` job that runs on `ubuntu-latest`. It should perform all the setup and build steps from `ci.yml`. | `.github/workflows/release.yml` |
| **2.14**| ☐ To Do | **Add Packaging Step:** In the `package` job, add a step to run `vsce package`: `run: npm run package`. | `.github/workflows/release.yml` |
| **2.15**| ☐ To Do | **Add Artifact Upload Step:** Add a step to upload the generated `.vsix` file as a workflow artifact using `actions/upload-artifact@v3`. | `.github/workflows/release.yml` |
| **2.16**| ☐ To Do | **Add Draft Release Job:** Add a new job `create_draft_release` that runs only on `workflow_dispatch`. Use an action like `actions/create-release` to create a draft release and `actions/upload-release-asset` to attach the `.vsix` file. | `.github/workflows/release.yml` |
| **2.17**| ☐ To Do | **Add `VSCE_PAT` Secret to GitHub:** Go to the repository's Settings > Secrets and variables > Actions. Create a new repository secret named `VSCE_PAT` and paste the Personal Access Token from the VS Code Marketplace. | `(GitHub Settings)` |
| **2.18**| ☐ To Do | **Add Publish Job to `release.yml`:** Create a final job `publish` that `needs: package` and runs only on the `release:published` trigger. It should download the `.vsix` artifact and run `vsce publish` using the `VSCE_PAT` secret. | `.github/workflows/release.yml` |