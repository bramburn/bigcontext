# Task List: Sprint 1 - Unified Build & Local Packaging

**Goal:** To create a stable, unified build process and local publishing script for the monorepo.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Locate and Open `package.json`:** Find the `package.json` file in the root of the project. | `package.json` |
| **1.2** | ☐ To Do | **Add C# Build Script:** Inside the `scripts` object in `package.json`, add the following line: `"build:csharp": "dotnet publish ./CodeContext.Api -c Release -o ./dist/backend"`. | `package.json` |
| **1.3** | ☐ To Do | **Add Webview Build Script:** In the same `scripts` object, add the following line: `"build:webview": "npm run build --workspace=webview"`. | `package.json` |
| **1.4** | ☐ To Do | **Verify TypeScript Compile Script:** Ensure a script for compiling TypeScript exists in the `scripts` object. It should look similar to `"compile": "tsc -p ./"`. If it doesn't exist, add it. | `package.json` |
| **1.5** | ☐ To Do | **Create Unified Build Script:** In the `scripts` object, add a new script that runs the previous steps in order: `"build:all": "npm run compile && npm run build:webview && npm run build:csharp"`. | `package.json` |
| **1.6** | ☐ To Do | **Locate and Open `.vscodeignore`:** Find the `.vscodeignore` file in the root of the project. | `.vscodeignore` |
| **1.7** | ☐ To Do | **Update `.vscodeignore` for Packaged Artifacts:** Add the following lines to the `.vscodeignore` file to ensure the build artifacts are included in the extension package. Remove any existing lines that might exclude them: `!webview/build/**` and `!dist/backend/**`. | `.vscodeignore` |
| **1.8** | ☐ To Do | **Update `package` Script:** In `package.json`, find the existing `package` script and modify it to run the new unified build: `"package": "npm run build:all && vsce package --no-dependencies"`. | `package.json` |
| **1.9** | ☐ To Do | **Create Local Publish Script:** In the `package.json` `scripts` object, add a new script for manual publishing: `"publish:vsce": "vsce publish --pat $VSCE_PAT"`. | `package.json` |
| **1.10**| ☐ To Do | **Document Local Publish Process:** Open the `README.md` file. Add a new section titled "Local Publishing" and explain that to publish, one must set the `VSCE_PAT` environment variable and then run `npm run publish:vsce`. | `README.md` |