### User Story: Automated Versioning & Publishing
**As a** maintainer (Alisha), **I want to** use a single npm script to automatically increment the version, create a git tag, and publish the extension, **so that** I can release new versions quickly and reliably.

**Actions to Undertake:**
1.  **Filepath**: `package.json`
    -   **Action**: Add `shelljs` as a new development dependency.
    -   **Implementation**: In the `devDependencies` section, add `"shelljs": "^0.8.5"`.
    -   **Imports**: N/A.
2.  **Filepath**: `scripts/release.js` (New File)
    -   **Action**: Create a new script file to contain the release logic.
    -   **Implementation**: Create the file and add a basic Node.js script structure.
    -   **Imports**: `const shell = require('shelljs');`
3.  **Filepath**: `scripts/release.js`
    -   **Action**: Implement the core release logic. The script should:
        -   Check for a clean git working directory.
        -   Parse the version bump type (`patch`, `minor`, `major`) from command-line arguments.
        -   Verify that the `VSCE_PAT` environment variable is set.
        -   Execute `npm version <type>` to bump the version and create a tag.
        -   Execute `vsce publish` to publish the extension.
        -   Execute `git push && git push --tags` to push the commit and tag.
    -   **Implementation**: Use `shelljs.exec()` to run the shell commands and `process.argv` to get the version type.
    -   **Imports**: N/A.
4.  **Filepath**: `package.json`
    -   **Action**: Add the new `release` script to the `scripts` section.
    -   **Implementation**: `"release": "node scripts/release.js"`
    -   **Imports**: N/A.
5.  **Filepath**: `CONTRIBUTING.md`
    -   **Action**: Document the new release process for contributors.
    -   **Implementation**: Add a "Publishing" section explaining how to use `npm run release -- <patch|minor|major>`.
    -   **Imports**: N/A.

**Acceptance Criteria:**
-   A new `release` script exists in `package.json`.
-   Running `npm run release -- patch` (or minor/major) successfully increments the version in `package.json`, creates a corresponding git tag, and publishes the extension to the marketplace.
-   The script pushes the new commit and tag to the remote repository.
-   The script fails with a clear error message if the git working directory is not clean.
-   The script fails with a clear error message if the `VSCE_PAT` environment variable is not set.

**Testing Plan:**
-   **Test Case 1**: Run `npm run release -- patch` with a dirty git working directory; verify it fails.
-   **Test Case 2**: Unset the `VSCE_PAT` variable and run the script; verify it fails with the expected error.
-   **Test Case 3**: With a clean working directory and `VSCE_PAT` set, run `npm run release -- patch`. Verify the version is bumped, a tag is created, the extension is published (check marketplace), and the changes are pushed to git.
