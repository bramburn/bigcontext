# Sub-Sprint 2: Dynamic Resource Loading

**Objective:**
To implement dynamic resource loading that adapts to the chosen webview implementation, ensuring proper asset resolution and CSP configuration for all implementation types.

**Parent Sprint:**
PRD 1, Sprint 1: Multi-Implementation Framework

**Tasks:**

1. **Implement getBuildDirectory Helper:**
   - Create centralized method to determine build directory based on configuration
   - Support switching between 'sveltekit', 'react', and 'svelte-simple' implementations
   - Ensure consistent directory resolution across all webview creation points

2. **Update localResourceRoots Configuration:**
   - Modify sidebar webview configuration to use dynamic build directory
   - Update main panel webview configuration
   - Update settings panel webview configuration
   - Remove all hardcoded 'webview/build' references

3. **Implement Asset Path Rewriting:**
   - Update getWebviewContent method to handle different asset patterns
   - Support SvelteKit's `/_app/` pattern for dynamic imports
   - Support React/Simple Svelte direct file references
   - Ensure proper URI conversion for all asset types

4. **Add Implementation Selection Setting:**
   - Add VS Code configuration setting for webview implementation choice
   - Provide enum options with clear descriptions
   - Ensure setting changes take effect on webview reload
   - Add validation for supported implementation types

**Acceptance Criteria:**

- `getBuildDirectory()` method correctly returns path based on configuration setting
- All webview creation points use dynamic `localResourceRoots` configuration
- Asset path rewriting works correctly for all three implementations
- VS Code setting allows switching between implementations
- No hardcoded build paths remain in the codebase
- Resource loading works in both local and panel webview contexts

**Dependencies:**

- Sub-Sprint 1 must be complete (all implementations built)
- VS Code extension configuration system
- Understanding of webview resource loading mechanisms

**Timeline:**

- **Start Date:** Week 1, Day 4
- **End Date:** Week 1, Day 7

**Files to Create/Modify:**

- `src/webviewManager.ts` (getBuildDirectory method, localResourceRoots updates)
- `package.json` (add webview.implementation configuration)
- `src/webviewManager.ts` (getWebviewContent asset rewriting logic)
