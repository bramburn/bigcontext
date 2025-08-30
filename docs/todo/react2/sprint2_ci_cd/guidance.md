**Objective:**
To create a GitHub Actions workflow that automates the build, test, and release process, including publishing to the VS Code Marketplace.

**Parent Sprint:**
PRD 1, Sprint 2: CI/CD Automation

**Tasks:**

1.  **Create CI Workflow:** Create a `.github/workflows/ci.yml` file that triggers on pull requests. The workflow should set up Node.js and .NET, install all dependencies, and run the `npm run build:all` and `npm test` commands.
2.  **Create Release Workflow:** Create a `.github/workflows/release.yml` file that triggers on `workflow_dispatch` (manual trigger) and `release` (when a GitHub release is published).
3.  **Implement Packaging in Release Workflow:** The release workflow will run the `npm run package` command and then upload the generated `.vsix` file as a release asset.
4.  **Add PAT as GitHub Secret:** Add the VS Code Marketplace PAT to the GitHub repository's secrets with the name `VSCE_PAT`.
5.  **Implement Automated Publishing:** Add a job to the `release.yml` workflow that runs `vsce publish` using the `VSCE_PAT` secret. This job should only run when a release is published, not on the manual trigger.

**Acceptance Criteria:**

  * Opening a pull request successfully triggers the `ci.yml` workflow, which builds and tests the extension.
  * Manually triggering the `release.yml` workflow creates a draft GitHub release with the `.vsix` file attached.
  * Creating and publishing a new release on GitHub successfully triggers the `release.yml` workflow, which then publishes the extension to the marketplace.

**Dependencies:**

  * Sub-Sprint 1 must be complete.
  * The VS Code Marketplace PAT must be available.

**Timeline:**

  * **Start Date:** 2025-09-03
  * **End Date:** 2025-09-09
