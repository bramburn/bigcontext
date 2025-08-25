# Task List: Sprint 7 - Documentation & Publishing

**Goal:** To create high-quality documentation and publish the extension to the marketplace.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **7.1** | ☐ To Do | **Write `README.md` Content:** Open `README.md` in the project root. Draft the main sections: Features, Requirements, Installation, Configuration, and Usage. Ensure clear and concise language. | `README.md` |
| **7.2** | ☐ To Do | **Create Demo GIF:** Use screen recording software to capture the core indexing and querying workflow of the extension. Optimize the recording and convert it into an animated GIF (e.g., `assets/demo.gif`). | `assets/demo.gif` |
| **7.3** | ☐ To Do | **Embed GIF in `README.md`:** In `README.md`, add markdown syntax to display the `demo.gif` at an appropriate location (e.g., `![Demo GIF](assets/demo.gif)`). | `README.md` |
| **7.4** | ☐ To Do | **Write `CONTRIBUTING.md`:** Create a new file named `CONTRIBUTING.md` in the project root. Write a guide for developers on how to set up the project, run tests, adhere to code style, and submit pull requests. | `CONTRIBUTING.md` |
| **7.5** | ☐ To Do | **Create Marketplace Publisher:** Follow the official VS Code documentation to create a publisher identity on the Visual Studio Code Marketplace. This involves setting up an Azure DevOps organization and generating a Personal Access Token (PAT) with `Marketplace (Publish)` scope. | `(External - VS Code Marketplace)` |
| **7.6** | ☐ To Do | **Add `VSCE_TOKEN` as GitHub Secret:** In your GitHub repository settings, navigate to `Settings` -> `Secrets and variables` -> `Actions`. Add a new repository secret named `VSCE_TOKEN` and paste the PAT generated in the previous step as its value. | `(GitHub Repository Settings)` |
| **7.7** | ☐ To Do | **Add Manual Release Trigger to CI Workflow:** Open `.github/workflows/ci.yml`. In the `on` section, add `workflow_dispatch:` to enable manual triggering of the workflow from the GitHub Actions UI. | `.github/workflows/ci.yml` |
| **7.8** | ☐ To Do | **Define Release Job in CI Workflow:** In `.github/workflows/ci.yml`, add a new job named `release` after the `build` job. This job should `needs: build` and run conditionally `if: github.event_name == 'workflow_dispatch'`. | `.github/workflows/ci.yml` |
| **7.9** | ☐ To Do | **Add Steps to Release Job:** In the `release` job, add steps to: checkout the repository, set up Node.js, install `vsce` globally (`npm install -g vsce`), download the `.vsix` artifact from the `build` job, and finally run `vsce publish -p ${{ secrets.VSCE_TOKEN }}` to publish the extension. | `.github/workflows/ci.yml` |
| **7.10** | ☐ To Do | **Test the Release Process:** Go to your GitHub repository's `Actions` tab. Select the `CI/CD` workflow and click `Run workflow`. Choose the `main` branch and click `Run workflow`. Monitor the job execution to ensure it completes successfully. | `(GitHub Actions UI)` |
| **7.11** | ☐ To Do | **Verify Publication:** After the release workflow completes, search for your extension on the Visual Studio Code Marketplace to confirm it has been successfully published and is publicly accessible. | `(External - VS Code Marketplace)` |
