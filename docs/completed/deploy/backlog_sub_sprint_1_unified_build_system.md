**Objective:**
To create a set of npm scripts that build all parts of the monorepo (TypeScript, Svelte, C#) and correctly package them into a single `.vsix` file.

**Parent Sprint:**
PRD 1, Sprint 1: Unified Build & Local Packaging

**Tasks:**

1.  **Create C# Build Script:** Add a `build:csharp` script to the root `package.json` that runs `dotnet publish` on the C# API project, outputting to a known directory (e.g., `dist/backend`).
2.  **Update Webview Build Script:** Ensure the `build:webview` script correctly places its output in a known directory (e.g., `webview/build`).
3.  **Create Unified Build Script:** Create a `build:all` script that runs the TypeScript compilation (`tsc`), the webview build, and the C# build in sequence.
4.  **Configure `.vscodeignore`:** Update the `.vscodeignore` file to ensure the `webview/build` and `dist/backend` directories are *included* in the final package.
5.  **Create Packaging Script:** Create a `package` script that first runs `build:all` and then runs `vsce package`.
6.  **Create Local Publish Script:** Create a `publish:vsce` script that runs `vsce publish --pat $VSCE_PAT`.

**Acceptance Criteria:**

  * Running `npm run build:all` from the root directory successfully builds all parts of the project.
  * Running `npm run package` creates a `.vsix` file.
  * The generated `.vsix` can be manually installed and runs correctly.
  * Running `export VSCE_PAT='...' && npm run publish:vsce` successfully publishes the extension.

**Dependencies:**

  * .NET SDK, Node.js, and `vsce` must be installed on the local machine.

**Timeline:**

  * **Start Date:** 2025-08-27
  * **End Date:** 2025-09-02
