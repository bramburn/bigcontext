# Task List: Sprint 1 - Automated Versioning & Publishing

**Goal:** To create a unified npm script that automates the process of versioning and publishing the extension.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Install `shelljs`:** Add `shelljs` as a dev dependency to run shell commands from a Node.js script. | `package.json` |
| **1.2** | ☐ To Do | **Create `scripts/release.js`:** Create a new Node.js script to handle the release logic. | `scripts/release.js` (New) |
| **1.3** | ☐ To Do | **Implement Version Logic:** In `release.js`, read the version type (`patch`, `minor`, `major`) from the command-line arguments. Use `shelljs.exec` to run `npm version <type>`. | `scripts/release.js` |
| **1.4** | ☐ To Do | **Implement Publish Logic:** In `release.js`, after the version command, run `vsce publish`. Check for the `VSCE_PAT` environment variable and exit with an error if it's not set. | `scripts/release.js` |
| **1.5** | ☐ To Do | **Implement Git Push Logic:** After a successful publish, use `shelljs.exec` to run `git push` and `git push --tags`. | `scripts/release.js` |
| **1.6** | ☐ To Do | **Create `release` npm script:** In the root `package.json`, add a script: `"release": "node scripts/release.js"`. | `package.json` |
| **1.7** | ☐ To Do | **Document the Script:** In `README.md` or `CONTRIBUTING.md`, document how to use the new `npm run release -- <version_type>` command. | `README.md` |
