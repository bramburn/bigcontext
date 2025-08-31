# Task List: Sprint 2 - CI/CD Automation

**Goal:** To automate the build, test, and release process using GitHub Actions.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Create `ci.yml` Workflow:** Create the file `.github/workflows/ci.yml`. Configure it to trigger on `pull_request`. | `.github/workflows/ci.yml` (New) |
| **2.2** | ☐ To Do | **Add Setup Steps to `ci.yml`:** Add steps to check out the code, set up Node.js, and set up the .NET SDK. | `.github/workflows/ci.yml` |
| **2.3** | ☐ To Do | **Add Build & Test Steps to `ci.yml`:** Add steps to install dependencies (`npm install` and `npm install --workspace=webview`), run the unified build (`npm run build:all`), and run tests (`npm test`). | `.github/workflows/ci.yml` |
| **2.4** | ☐ To Do | **Create `release.yml` Workflow:** Create the file `.github/workflows/release.yml`. Configure it to trigger on `workflow_dispatch` and `release: { types: [published] }`. | `.github/workflows/release.yml` (New) |
| **2.5** | ☐ To Do | **Add Packaging Job to `release.yml`:** Create a `package` job that builds everything and runs `vsce package`. It should then upload the `.vsix` file as a workflow artifact. | `.github/workflows/release.yml` |
| **2.6** | ☐ To Do | **Create Draft Release Step:** Modify the `package` job to use a GitHub Action (e.g., `actions/create-release`) to create a draft GitHub release and another action (`actions/upload-release-asset`) to attach the `.vsix` artifact. This part should only run on `workflow_dispatch`. | `.github/workflows/release.yml` |
| **2.7** | ☐ To Do | **Add `VSCE_PAT` Secret:** In the GitHub repository settings, add the VS Code Marketplace PAT as a secret named `VSCE_PAT`. | `(GitHub Settings)` |
| **2.8** | ☐ To Do | **Add Publish Job to `release.yml`:** Create a `publish` job that `needs: package` and runs only on the `release:published` trigger. This job will download the `.vsix` artifact and run `vsce publish` using the `VSCE_PAT` secret. | `.github/workflows/release.yml` |
