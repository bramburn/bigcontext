# Task List: Sprint 1 - Unified Build & Local Packaging

**Goal:** To create a stable, unified build process and local publishing script for the monorepo.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Add C# Build Script:** In the root `package.json`, add a script `"build:csharp": "dotnet publish ./CodeContext.Api -c Release -o ./dist/backend"`. | `package.json` |
| **1.2** | ☐ To Do | **Add Webview Build Script:** In the root `package.json`, add a script `"build:webview": "npm run build --workspace=webview"`. | `package.json` |
| **1.3** | ☐ To Do | **Add TypeScript Compile Script:** In the root `package.json`, ensure a script like `"compile": "tsc -p ./"` exists. | `package.json` |
| **1.4** | ☐ To Do | **Create Unified Build Script:** In `package.json`, add a script `"build:all": "npm run compile && npm run build:webview && npm run build:csharp"`. | `package.json` |
| **1.5** | ☐ To Do | **Update `.vscodeignore`:** Remove any lines that would ignore the `webview/build` or `dist/backend` directories. Add `!webview/build/**` and `!dist/backend/**` to ensure they are included. | `.vscodeignore` |
| **1.6** | ☐ To Do | **Update `package` Script:** In `package.json`, modify the `"package"` script to be `"package": "npm run build:all && vsce package --no-dependencies"`. | `package.json` |
| **1.7** | ☐ To Do | **Create Local Publish Script:** In `package.json`, add a script `"publish:vsce": "vsce publish --pat $VSCE_PAT"`. | `package.json` |
| **1.8** | ☐ To Do | **Document Local Publish Process:** In `README.md`, add a section explaining how to publish locally by setting the `VSCE_PAT` environment variable and running the script. | `README.md` |
