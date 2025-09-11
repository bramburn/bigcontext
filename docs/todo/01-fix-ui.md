### New Document: PRD 1: Foundational Diagnosis of Tailwind CSS and Radix UI Loading Issues - Guidance.md

**1. Title & Overview**  
- **Project:** VS Code Extension Webview Styling Diagnosis  
- **Summary:** This foundational phase focuses on systematically diagnosing why Tailwind CSS and Radix UI styles are not applying correctly in the webview. The application interfaces load but appear unstyled, indicating potential issues with asset loading, build configuration, or VS Code webview restrictions. We will add logging, inspect network requests, and create initial tests without modifying core functionality. This phase builds incrementally on the existing Vite + React + Tailwind setup in `webview-react/`, ensuring minimal disruption to the current architecture (e.g., no changes to `src/webviewManager.ts` localResourceRoots yet).  
- **Dependencies:** Existing `webview-react/` build process (Vite with Tailwind/PostCSS) and VS Code webview setup in `src/webviewManager.ts`. Requires access to Playwright for e2e testing of webview rendering.  

**2. Goals & Success Metrics**  
- **Business Objectives:** Identify root causes of styling failures to enable a targeted fix, reducing debugging time by 50% and preventing future webview asset issues. Ensure the diagnosis integrates seamlessly with the current extension lifecycle.  
- **Developer & System Success Metrics:**  
  - Logs capture CSS/JS asset loading status (success/failure) for 100% of webview initializations.  
  - Playwright tests verify that Tailwind classes (e.g., `flex`, `p-4`) are present in DOM but not applying styles in 80% of test runs.  
  - Radix UI component mounting is confirmed via console logs without runtime errors.  
  - Diagnosis report generated with evidence (screenshots/logs) for Phase 2 handover.  

**3. User Personas**  
- **Developer Alex (Extension Maintainer):** Alex needs detailed logs and tests to understand why styles fail in webviews without disrupting the running extension. He wants non-invasive diagnostics that can run in development mode.  
- **Tester Jordan (QA Engineer):** Jordan requires automated Playwright tests to reproduce the unstyled UI issue across VS Code themes (light/dark) and verify asset loading isolation.  

**4. Requirements Breakdown**  
This phase spans two sprints: one for logging and inspection setup, another for initial testing and analysis. User stories focus on atomic diagnostic steps, assessing impact on existing `webview-react/src/App.tsx` and `src/webviewManager.ts`.  

| Phase | Sprint | User Story | Acceptance Criteria | Duration |  
|-------|--------|------------|---------------------|----------|  
| **Phase 1: Diagnosis** | **Sprint 1: Logging and Asset Inspection Setup** | As Developer Alex, I want to add console logging in the webview to track Tailwind CSS and Radix UI asset loading so I can identify if files are fetched but not applied. | 1. In `webview-react/src/index.tsx`, add `console.log` after CSS import to confirm `@tailwind` directives execute.<br>2. In `webview-react/src/App.tsx`, log `getComputedStyle` for a Tailwind-classed element (e.g., `flex` div) on mount.<br>3. Reload webview via `codeContextEngine.showSearch` command; logs appear in VS Code Output panel (Extension Host).<br>4. No errors in extension console; logs show CSS file path from Vite build (e.g., `/assets/index-*.css`). | **2 Weeks** |  
| | | As Developer Alex, I want to inspect network requests in the webview to verify if built assets (CSS/JS) are served correctly from `webview-react/dist/` so I can detect 404s or CSP blocks. | 1. In `src/webviewManager.ts` (resolveWebviewView), add `webview.onDidReceiveMessage` handler to log asset requests if `command: 'assetLoad'`.<br>2. In `webview-react/src/App.tsx`, postMessage on window load with loaded asset URLs (e.g., CSS href).<br>3. Trigger webview load; extension logs show successful fetches (status 200) for `dist/assets/*.css` and Radix JS bundles.<br>4. If failure, log VS Code webview CSP details (e.g., script-src 'self'). Backward-compatible: No changes to existing message routing. | |  
| | | As Tester Jordan, I want basic error boundaries in the webview to capture Radix UI mounting failures without crashing the UI so I can isolate component-specific style issues. | 1. Wrap `App.tsx` root in existing `ErrorBoundary` component; log Radix import errors (e.g., `@radix-ui/react-dialog`).<br>2. Add a test Radix component (e.g., `<Dialog>`) in `App.tsx`; log if styles (e.g., `--radix-dialog-overlay-background`) compute to defaults.<br>3. Webview loads without JS errors in console; logs show Radix CSS vars present but possibly overridden by VS Code themes.<br>4. Feature flag via env var to toggle Radix test component. | |  
| **Phase 1: Diagnosis** | **Sprint 2: Playwright E2E Tests and Analysis** | As Tester Jordan, I want Playwright tests to simulate webview loading and assert Tailwind class presence vs. style application so I can reproduce the unstyled UI issue. | 1. Create `webview-react/tests/e2e/webview-styling.test.ts`; mock VS Code API with `acquireVsCodeApi`.<br>2. Test: Launch dev server (`npm run dev`), navigate to webview-equivalent page, assert `document.querySelector('.flex')` has class but `window.getComputedStyle(el).display !== 'flex'`.<br>3. Run `npx playwright test`; 2/3 tests pass (class presence, asset load, style fail); generates report with screenshots.<br>4. Integrate with extension: Mock webview HTML injection in test. No disruption to prod build. | **2 Weeks** |  
| | | As Developer Alex, I want a diagnostic report generator to compile logs and test results into a markdown file so I can document findings for Phase 2 fixes. | 1. In `src/webviewManager.ts`, add method to export logs on command (`codeContextEngine.diagnoseStyling`).<br>2. Collect: Asset load status, computed styles for 5 Tailwind classes, Radix var values; save to `docs/diagnosis-styling.md`.<br>3. Run command in VS Code; file generates with sections (e.g., "Tailwind: CSS loaded but purged incorrectly").<br>4. Report confirms issues (e.g., "Tailwind purge excludes webview classes") without altering DB/UI components. | |  
| | | As Tester Jordan, I want cross-theme tests (light/dark) to verify if VS Code theme vars override Tailwind/Radix so I can identify specificity conflicts. | 1. Extend Playwright test: Mock VS Code themes via CSS vars (e.g., `--vscode-editor-background`).<br>2. Assert: In dark mode, Tailwind `bg-blue-500` computes to VS Code var if conflicted; log overrides.<br>3. Tests run in headed mode; video capture shows unstyled elements; 100% coverage of theme switches.<br>4. Dependencies: Existing theme toggle in `App.tsx`; no new APIs needed. | |  

**5. Timeline & Sprints**  
- **Total Estimated Time:** 4 Weeks  
- **Sprint 1:** Logging and Asset Inspection Setup (2 Weeks) - Focus on non-invasive logs to capture 80% of loading events.  
- **Sprint 2:** Playwright E2E Tests and Analysis (2 Weeks) - Automate reproduction; generate report for handover.  

**6. Risks & Assumptions**  
- **Assumption:** Vite build outputs correct Tailwind CSS to `webview-react/dist/assets/`; existing `@tailwind` directives in `index.css` are valid. Webview supports console logging via VS Code Output.  
- **Risk:** Playwright cannot fully mock VS Code webview CSP, leading to false negatives in asset loading tests.  
  - **Mitigation:** Use VS Code's built-in webview debug mode (Developer: Inspect Webview) as fallback; phase in manual inspection if needed. Feature flags for all logs/tests to avoid prod impact.  
- **Risk:** Radix UI styles conflict with VS Code vars without clear logs.  
  - **Mitigation:** Limit to read-only inspection; document overrides in report. If unavoidable, defer to Phase 3.  

**7. Success Metrics**  
- 100% of diagnostic logs captured without extension crashes.  
- Playwright test suite passes with clear failure reproduction (e.g., style mismatch rate >70%).  
- Diagnosis report identifies at least 2 root causes (e.g., localResourceRoots misconfig, Tailwind purge).  

### New Document: tasklist_sprint_01.md  
# Task List: Sprint 1 - Logging and Asset Inspection Setup  
**Goal:** Implement non-invasive logging to capture Tailwind CSS and Radix UI loading events in the webview, focusing on asset fetches and computed styles without altering the core extension flow.  

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |  
|---------|--------|----------------------------------------------|-------------------|  
| **1.1** | ☐ To Do | **Add CSS Import Logging:** Open `webview-react/src/index.tsx`. After `@import './index.css';`, add `console.log('Tailwind CSS imported successfully');`. Rebuild with `npm run build`. | `webview-react/src/index.tsx` |  
| **1.2** | ☐ To Do | **Log Computed Styles in App:** In `webview-react/src/App.tsx` useEffect (line ~30), select `.flex` element via `document.querySelector('.flex')`, log `getComputedStyle(el).display`. Ensure log includes "Tailwind class check". | `webview-react/src/App.tsx` |  
| **1.3** | ☐ To Do | **Test Log Output:** Run extension, trigger webview via command palette (`codeContextEngine.showSearch`). Check VS Code Output > Extension Host for logs. Verify no errors. | N/A |  
| **1.4** | ☐ To Do | **Add Asset Request Logging in WebviewManager:** In `src/webviewManager.ts` resolveWebviewView (line ~157), in onDidReceiveMessage, if `message.command === 'assetLoad'`, log `message.data.url` and status. | `src/webviewManager.ts` |  
| **1.5** | ☐ To Do | **Post Asset Messages from Webview:** In `webview-react/src/App.tsx` useEffect, after VS Code API acquire (line ~40), postMessage `{command: 'assetLoad', data: {css: document.querySelector('link[href*=".css"]')?.href}}`. | `webview-react/src/App.tsx` |  
| **1.6** | ☐ To Do | **Verify Network Logs:** Reload webview; confirm extension logs show CSS URL (e.g., `dist/assets/index-abc.css`) with status 200. If 404, note in console. | N/A |  
| **1.7** | ☐ To Do | **Add Radix Error Boundary Logging:** In `webview-react/src/components/ErrorBoundary.tsx`, in `componentDidCatch`, log `error.message` if includes "radix" or "CSS var". Test with dummy `<Dialog open={true}>` in App.tsx. | `webview-react/src/components/ErrorBoundary.tsx`, `webview-react/src/App.tsx` |  
| **1.8** | ☐ To Do | **Feature Flag for Radix Test:** In `webview-react/src/App.tsx`, wrap Radix component in `if (process.env.NODE_ENV === 'development')`. Rebuild and test in dev mode only. | `webview-react/src/App.tsx` |  

### New Document: tasklist_sprint_02.md  
# Task List: Sprint 2 - Playwright E2E Tests and Analysis  
**Goal:** Create automated tests to reproduce styling issues and generate a diagnosis report, ensuring 100% coverage of asset loading and style computation failures.  

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |  
|---------|--------|----------------------------------------------|-------------------|  
| **2.1** | ☐ To Do | **Setup Playwright for Webview:** In `webview-react/`, run `npx playwright init --ct electron` (mocks VS Code). Create `tests/e2e/webview-styling.test.ts`. | `webview-react/tests/e2e/webview-styling.test.ts` |  
| **2.2** | ☐ To Do | **Test Tailwind Class Presence:** In test file, `await page.goto('http://localhost:5173')` (dev server), `await expect(page.locator('.flex')).toHaveClass('flex')`. | `webview-react/tests/e2e/webview-styling.test.ts` |  
| **2.3** | ☐ To Do | **Assert Style Mismatch:** Evaluate `getComputedStyle(document.querySelector('.flex')).display !== 'flex'`, expect true for failure repro. Add screenshot on fail. | `webview-react/tests/e2e/webview-styling.test.ts` |  
| **2.4** | ☐ To Do | **Run and Verify Tests:** Execute `npx playwright test`; confirm 2/3 tests pass (class present, asset loaded, style fails). Generate HTML report. | N/A |  
| **2.5** | ☐ To Do | **Add Theme Toggle Test:** Mock dark theme CSS vars, re-run test; assert Tailwind overrides (e.g., `bg-blue-500` not VS Code var). | `webview-react/tests/e2e/webview-styling.test.ts` |  
| **2.6** | ☐ To Do | **Implement Report Generator:** In `src/webviewManager.ts`, add `diagnoseStyling()` method; collect logs via `console` spy, write to `docs/diagnosis-styling.md` using `fs.writeFileSync`. | `src/webviewManager.ts` |  
| **2.7** | ☐ To Do | **Register Diagnosis Command:** In `src/extension.ts`, add `vscode.commands.registerCommand('codeContextEngine.diagnoseStyling', () => manager.getWebviewManager().diagnoseStyling())`. | `src/extension.ts` |  
| **2.8** | ☐ To Do | **Generate and Review Report:** Run command; verify MD file has sections like "Asset Loads: Success", "Style Conflicts: Tailwind purged classes". | `docs/diagnosis-styling.md` |  

### New Document: Sub-Sprint 1.1: Webview Logging Initialization  
**Objective:**  
Set up basic console logging in the React webview to track initialization and CSS import without impacting performance.  

**Parent Sprint:**  
PRD 1, Sprint 1: Logging and Asset Inspection Setup  

**Tasks:**  
1. Open `webview-react/src/index.tsx` and add log after Tailwind import.  
2. Rebuild the project with `npm run build` in `webview-react/`.  
3. Test by reloading VS Code and opening webview.  

**Acceptance Criteria:**  
- Console logs "Tailwind CSS imported successfully" on webview load.  
- No build errors; extension starts without crashes.  
- Logs visible in VS Code Developer Tools > Console for webview.  

**Dependencies:**  
- Existing Vite build setup.  

**Timeline:**  
- **Start Date:** 2025-09-15  
- **End Date:** 2025-09-16  

### New Document: Sub-Sprint 1.2: Computed Style Inspection  
**Objective:**  
Implement style computation checks for Tailwind classes in the main App component to detect application failures.  

**Parent Sprint:**  
PRD 1, Sprint 1: Logging and Asset Inspection Setup  

**Tasks:**  
1. In `webview-react/src/App.tsx` useEffect, query and log computed style for a test element.  
2. Add error handling if element not found.  
3. Rebuild and test in extension.  

**Acceptance Criteria:**  
- Logs show e.g., "Tailwind flex: computed display=block (expected flex)" on mismatch.  
- Handles missing elements gracefully.  
- Backward-compatible with existing theme toggle.  

**Dependencies:**  
- Sub-Sprint 1.1 complete.  

**Timeline:**  
- **Start Date:** 2025-09-17  
- **End Date:** 2025-09-18  

### New Document: Sub-Sprint 1.3: Network Asset Logging  
**Objective:**  
Extend webview manager to log asset requests, focusing on CSS/JS fetches from dist folder.  

**Parent Sprint:**  
PRD 1, Sprint 1: Logging and Asset Inspection Setup  

**Tasks:**  
1. Update `src/webviewManager.ts` onDidReceiveMessage to handle 'assetLoad'.  
2. In App.tsx, post asset URLs on load.  
3. Test fetch status in console.  

**Acceptance Criteria:**  
- Extension logs "CSS fetched: /assets/index.css status: 200".  
- Detects 404s with error details.  
- No interference with existing messages.  

**Dependencies:**  
- Sub-Sprint 1.2 complete.  

**Timeline:**  
- **Start Date:** 2025-09-19  
- **End Date:** 2025-09-20  

### New Document: Sub-Sprint 2.1: Playwright Setup and Basic Tests  
**Objective:**  
Initialize Playwright and create tests for Tailwind class presence in a mocked webview environment.  

**Parent Sprint:**  
PRD 1, Sprint 2: Playwright E2E Tests and Analysis  

**Tasks:**  
1. Run `npx playwright init` in `webview-react/`.  
2. Create test file with page.goto to dev server.  
3. Assert class existence.  

**Acceptance Criteria:**  
- Tests run successfully; report shows class detected.  
- No dependencies on real VS Code.  

**Dependencies:**  
- Sprint 1 complete.  

**Timeline:**  
- **Start Date:** 2025-09-22  
- **End Date:** 2025-09-23  

### New Document: Sub-Sprint 2.2: Style Application Tests  
**Objective:**  
Add assertions for computed styles to reproduce the unstyled issue.  

**Parent Sprint:**  
PRD 1, Sprint 2: Playwright E2E Tests and Analysis  

**Tasks:**  
1. Extend test to evaluate getComputedStyle.  
2. Add failure screenshot.  
3. Run headed mode for visual verification.  

**Acceptance Criteria:**  
- Test fails on style mismatch with screenshot evidence.  
- Coverage includes 5 Tailwind classes.  

**Dependencies:**  
- Sub-Sprint 2.1 complete.  

**Timeline:**  
- **Start Date:** 2025-09-24  
- **End Date:** 2025-09-25  

### New Document: Sub-Sprint 2.3: Theme and Report Generation  
**Objective:**  
Test theme interactions and implement the diagnosis report output.  

**Parent Sprint:**  
PRD 1, Sprint 2: Playwright E2E Tests and Analysis  

**Tasks:**  
1. Mock CSS vars in test for dark/light.  
2. Add diagnoseStyling method and command.  
3. Generate MD report with findings.  

**Acceptance Criteria:**  
- Report file created with log excerpts and test results.  
- Theme test passes, noting overrides.  

**Dependencies:**  
- Sub-Sprint 2.2 complete.  

**Timeline:**  
- **Start Date:** 2025-09-26  
- **End Date:** 2025-09-27  

### New Document: PRD 2: Tailwind CSS Loading and Build Fixes - Guidance.md

**1. Title & Overview**  
- **Project:** VS Code Extension Webview Styling Fixes - Tailwind  
- **Summary:** Building on Phase 1 diagnosis (e.g., assets load but classes purged/not applied), this phase fixes Tailwind CSS integration. We extend the Vite/PostCSS config for webview-safe purging and update `src/webviewManager.ts` localResourceRoots to include `webview-react/dist/assets`. Changes are backward-compatible (e.g., optional params in webview options) and phased to avoid disrupting sidebar webview.  
- **Dependencies:** PRD 1 diagnosis report confirming purge/CSP issues. Existing Tailwind config in `webview-react/tailwind.config.js` (inferred from package.json).  

**2. Goals & Success Metrics**  
- **Business Objectives:** Achieve fully styled webview UI, improving user experience and reducing support tickets by 70%. Minimize build time impact (<10% increase).  
- **Developer & System Success Metrics:**  
  - Tailwind classes (e.g., `p-4`) compute correctly in 95% of elements post-fix.  
  - Webview loads assets from correct URIs without CSP violations.  
  - Playwright tests pass with style application assertions.  
  - No regressions in existing VS Code theme integration.  

**3. User Personas**  
- **Developer Alex (Extension Maintainer):** Alex wants build config tweaks that ensure Tailwind scans webview-specific classes without manual safelisting.  
- **Designer Sam (UI Specialist):** Sam needs styled prototypes in webview to validate Radix + Tailwind harmony before full rollout.  

**4. Requirements Breakdown**  

| Phase | Sprint | User Story | Acceptance Criteria | Duration |  
|-------|--------|------------|---------------------|----------|  
| **Phase 2: Tailwind Fixes** | **Sprint 3: Build and Purge Configuration** | As Developer Alex, I want to update Tailwind config to include webview paths in content scanning so purged classes are retained for dynamic UI. | 1. In `webview-react/tailwind.config.js`, add `content: ['./src/**/*.{ts,tsx}']` to scan all components.<br>2. Rebuild; verify `dist/assets/*.css` includes utilities like `flex justify-between` via grep.<br>3. No size increase >20%; test in dev server shows styles apply. Backward-compatible: Existing purge unchanged. | **2 Weeks** |  
| | | As Developer Alex, I want PostCSS/Vite plugins configured for webview asset hashing so URIs match in `getWebviewContent` rewrites. | 1. In `webview-react/vite.config.ts`, ensure `build.assetsInlineLimit: 0` for external CSS; add Tailwind plugin if missing.<br>2. Build and inspect `dist/index.html`; confirm CSS href like `/assets/index-[hash].css`.<br>3. In `src/webviewManager.ts getWebviewContent`, verify regex replaces to `webview.asWebviewUri`. No breaking changes to JS bundles. | |  
| **Phase 2: Tailwind Fixes** | **Sprint 4: Webview Resource Roots and CSP** | As Developer Alex, I want localResourceRoots updated in panel creation to include `webview-react/dist` so assets load without 404s. | 1. In `src/webviewManager.ts createPanel` (line ~281), set `localResourceRoots: [Uri.joinPath(context.extensionUri, 'webview-react/dist')]`.<br>2. Add optional param for config; default to existing 'resources' for backward compat.<br>3. Reload extension; webview fetches CSS from dist without errors in console. | **2 Weeks** |  
| | | As Designer Sam, I want VS Code CSP headers relaxed for Tailwind/Radix inline styles so dynamic classes apply. | 1. In `src/webviewManager.ts`, add `webview.options.enableScripts = true; cspSource = new vscode.WebviewContentSecurityPolicySource()` if needed.<br>2. Test: Inject Tailwind class dynamically; assert no CSP violation logs.<br>3. Dependencies: Phase 1 logs confirm CSP as issue; flag for prod disable. | |  
| | | As Tester Jordan, I want updated Playwright tests to verify fixed Tailwind application across builds. | 1. Extend `webview-react/tests/e2e/`; after rebuild, assert `getComputedStyle('.p-4').padding === '16px'`.<br>2. Test post-fix: 100% pass rate; include asset URI validation.<br>3. Integrate CI: Run on build; fail if purge removes classes. | |  

**5. Timeline & Sprints**  
- **Total Estimated Time:** 4 Weeks  
- **Sprint 3:** Build and Purge Configuration (2 Weeks) - Optimize Tailwind for webview without bloat.  
- **Sprint 4:** Webview Resource Roots and CSP (2 Weeks) - Ensure secure asset loading.  

**6. Risks & Assumptions**  
- **Assumption:** Diagnosis from PRD 1 identifies purge as primary issue; Vite handles webview URIs correctly.  
- **Risk:** Updating localResourceRoots breaks existing resource access (e.g., icons).  
  - **Mitigation:** Use array union for roots; test with feature flag. Modular: Changes isolated to createPanel.  
- **Risk:** CSP strictness blocks fixes in Remote SSH.  
  - **Mitigation:** Fallback to inline CSS if needed; document for VS Code updates.  

**7. Success Metrics**  
- Build generates complete Tailwind CSS (>90% utility retention).  
- Webview styles apply in both themes; Playwright coverage 95%.  
- No new errors in extension logs post-fix.  

### New Document: tasklist_sprint_03.md  
# Task List: Sprint 3 - Build and Purge Configuration  
**Goal:** Refine Tailwind and Vite build to ensure webview classes are not purged and assets are hashed correctly for URI replacement.  

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |  
|---------|--------|----------------------------------------------|-------------------|  
| **3.1** | ☐ To Do | **Update Tailwind Content Paths:** Open `webview-react/tailwind.config.js`; add `./src/views/**/*.{tsx,ts}` to content array. | `webview-react/tailwind.config.js` |  
| **3.2** | ☐ To Do | **Rebuild and Verify Purge:** Run `npm run build`; grep `dist/assets/*.css` for `flex`; confirm presence. | N/A |  
| **3.3** | ☐ To Do | **Configure Vite for External CSS:** In `webview-react/vite.config.ts`, set `build.rollupOptions.output.assetFileNames = 'assets/[name].[hash][extname]'`. | `webview-react/vite.config.ts` |  
| **3.4** | ☐ To Do | **Test Asset Hashing:** Build; inspect `dist/index.html` for hashed CSS href. Update regex in webviewManager if needed. | `webview-react/dist/index.html`, `src/webviewManager.ts` |  
| **3.5** | ☐ To Do | **Add Tailwind Plugin if Missing:** In `vite.config.ts`, import and use `tailwindcss()` in PostCSS plugins. | `webview-react/vite.config.ts` |  
| **3.6** | ☐ To Do | **Validate Build Size:** Compare pre/post CSS size; ensure <20% increase. Test dev server styles. | N/A |  
| **3.7** | ☐ To Do | **Safelist Critical Classes:** In tailwind.config.js, add safelist: [/^bg-/, /^p-/] for webview essentials. | `webview-react/tailwind.config.js` |  
| **3.8** | ☐ To Do | **Commit and Test in Extension:** Rebuild, reload VS Code; check if classes now in computed styles via logs. | N/A |  

### New Document: tasklist_sprint_04.md  
# Task List: Sprint 4 - Webview Resource Roots and CSP  
**Goal:** Update webview configuration for proper asset access and CSP handling to enable Tailwind/Radix rendering.  

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |  
|---------|--------|----------------------------------------------|-------------------|  
| **4.1** | ☐ To Do | **Update localResourceRoots in createPanel:** In `src/webviewManager.ts` (line 281), add `Uri.joinPath(context.extensionUri, 'webview-react/dist')` to array. | `src/webviewManager.ts` |  
| **4.2** | ☐ To Do | **Add Config Param for Roots:** Modify WebviewConfig interface; default to union with 'resources'. | `src/webviewManager.ts` |  
| **4.3** | ☐ To Do | **Test Asset Load Post-Update:** Reload extension; confirm no 404 in logs for dist assets. | N/A |  
| **4.4** | ☐ To Do | **Relax CSP for Styles:** In createPanel options, set `cspSource = new WebviewContentSecurityPolicySource(); cspSource.add('style-src', 'unsafe-inline');` if Radix needs it. | `src/webviewManager.ts` |  
| **4.5** | ☐ To Do | **Dynamic CSP Flag:** Add env check for dev mode to enable unsafe-inline. | `src/webviewManager.ts` |  
| **4.6** | ☐ To Do | **Update Playwright for Fix Verification:** In test, assert padding/computed values match Tailwind defaults. | `webview-react/tests/e2e/webview-styling.test.ts` |  
| **4.7** | ☐ To Do | **Run Full Test Suite:** Execute `npx playwright test`; confirm 100% pass on style application. | N/A |  
| **4.8** | ☐ To Do | **Document Changes:** Add to README: "Webview assets now from dist; rebuild on Tailwind changes." | `README.md` |  

### New Document: Sub-Sprint 3.1: Tailwind Config Refinement  
**Objective:**  
Scan and retain webview-specific Tailwind classes during purge to prevent style loss.  

**Parent Sprint:**  
PRD 2, Sprint 3: Build and Purge Configuration  

**Tasks:**  
1. Edit `tailwind.config.js` content paths.  
2. Safelist essentials.  
3. Rebuild and grep verify.  

**Acceptance Criteria:**  
- CSS file contains expected utilities.  
- No purge of `webview-react/src/App.tsx` classes.  

**Dependencies:**  
- PRD 1 complete.  

**Timeline:**  
- **Start Date:** 2025-09-29  
- **End Date:** 2025-09-30  

### New Document: Sub-Sprint 3.2: Vite Asset Optimization  
**Objective:**  
Ensure hashed assets are generated and rewritable for webview URIs.  

**Parent Sprint:**  
PRD 2, Sprint 3: Build and Purge Configuration  

**Tasks:**  
1. Update `vite.config.ts` rollup options.  
2. Add Tailwind PostCSS if absent.  
3. Build and inspect HTML/CSS.  

**Acceptance Criteria:**  
- Hashed CSS in dist; regex matches in manager.  
- Dev/prod builds consistent.  

**Dependencies:**  
- Sub-Sprint 3.1 complete.  

**Timeline:**  
- **Start Date:** 2025-10-01  
- **End Date:** 2025-10-02  

### New Document: Sub-Sprint 4.1: Resource Roots Update  
**Objective:**  
Configure webview to access dist assets securely.  

**Parent Sprint:**  
PRD 2, Sprint 4: Webview Resource Roots and CSP  

**Tasks:**  
1. Modify createPanel localResourceRoots.  
2. Add optional config support.  
3. Test load in extension.  

**Acceptance Criteria:**  
- No 404s; assets from dist.  
- Backward compat with old roots.  

**Dependencies:**  
- Sprint 3 complete.  

**Timeline:**  
- **Start Date:** 2025-10-03  
- **End Date:** 2025-10-04  

### New Document: Sub-Sprint 4.2: CSP and Test Validation  
**Objective:**  
Handle inline styles for Radix and verify fixes via tests.  

**Parent Sprint:**  
PRD 2, Sprint 4: Webview Resource Roots and CSP  

**Tasks:**  
1. Add CSP source for styles.  
2. Flag for dev.  
3. Update/run Playwright.  

**Acceptance Criteria:**  
- No CSP blocks; tests pass styles.  
- Report confirms fix.  

**Dependencies:**  
- Sub-Sprint 4.1 complete.  

**Timeline:**  
- **Start Date:** 2025-10-05  
- **End Date:** 2025-10-06  

### New Document: PRD 3: Radix UI Integration and Style Fixes - Guidance.md

**1. Title & Overview**  
- **Project:** VS Code Extension Webview Styling Fixes - Radix UI  
- **Summary:** With Tailwind fixed, this phase integrates Radix UI components properly, addressing CSS var conflicts with VS Code themes. We add Radix to key UI elements (e.g., dialogs in SetupView) and ensure styles cascade correctly. Incremental: Extend existing imports in `webview-react/src/components/`; use Tailwind for overrides. No rebuild of core auth/UI.  
- **Dependencies:** PRD 2 complete (Tailwind working); package.json Radix deps present.  

**2. Goals & Success Metrics**  
- **Business Objectives:** Enable accessible, styled UI components for better UX; support 5+ Radix primitives without theme breaks.  
- **Developer & System Success Metrics:**  
  - Radix components (e.g., Dialog) render with custom styles in 90% cases.  
  - No JS errors on mount; CSS vars like `--radix-dialog-content-width` apply.  
  - Playwright tests confirm interactive behavior (open/close) with styles.  

**3. User Personas**  
- **Developer Alex:** Needs Radix setup that plays nice with Tailwind and VS Code vars.  
- **Designer Sam:** Wants styled, accessible components for webview prototypes.  

**4. Requirements Breakdown**  

| Phase | Sprint | User Story | Acceptance Criteria | Duration |  
|-------|--------|------------|---------------------|----------|  
| **Phase 3: Radix Fixes** | **Sprint 5: Component Integration** | As Designer Sam, I want to replace plain HTML with Radix primitives (e.g., Dialog in SetupView) so styles apply consistently. | 1. In `webview-react/src/components/SetupView.tsx`, import/use `<Dialog>`; add Tailwind classes for overlay/content.<br>2. Test mount: No unstyled portal; vars like background use Tailwind over defaults.<br>3. Backward-compatible: Fallback to HTML if Radix fails. | **2 Weeks** |  
| | | As Developer Alex, I want CSS vars for Radix customized via Tailwind to avoid VS Code overrides so components look native. | 1. In `webview-react/src/index.css`, add `:root { --radix-dialog-overlay-background: theme(colors.gray.900); }`.<br>2. Rebuild; computed styles show Tailwind priority.<br>3. No conflicts with sidebar view. | |  
| **Phase 3: Radix Fixes** | **Sprint 6: Testing and Polish** | As Tester Jordan, I want Playwright tests for Radix interactions to verify styling post-integration. | 1. Add `webview-react/tests/e2e/radix-styling.test.ts`; click button to open Dialog, assert overlay styles.<br>2. Test themes: Dark mode vars apply correctly.<br>3. 100% pass; video shows smooth animation. | **2 Weeks** |  
| | | As Developer Alex, I want error handling for Radix theme mismatches so webview degrades gracefully. | 1. In ErrorBoundary, catch Radix-specific errors; log and fallback to unstyled.<br>2. Test: Simulate var conflict; UI functional without crash.<br>3. Document in report for maintenance. | |  

**5. Timeline & Sprints**  
- **Total Estimated Time:** 4 Weeks  
- **Sprint 5:** Component Integration (2 Weeks)  
- **Sprint 6:** Testing and Polish (2 Weeks)  

**6. Risks & Assumptions**  
- **Assumption:** Tailwind from PRD 2 resolves base styling; Radix deps up-to-date.  
- **Risk:** Radix portals conflict with webview shadow DOM.  
  - **Mitigation:** Use `forceMount` prop; test in isolation. Modular overrides via CSS.  

**7. Success Metrics**  
- Radix components styled and interactive.  
- Tests cover 80% primitives used.  

### New Document: tasklist_sprint_05.md  
# Task List: Sprint 5 - Component Integration  
**Goal:** Integrate Radix UI into existing components with Tailwind styling.  

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |  
|---------|--------|----------------------------------------------|-------------------|  
| **5.1** | ☐ To Do | **Import Radix in SetupView:** Add `import {Dialog} from '@radix-ui/react-dialog';` in `webview-react/src/components/SetupView.tsx`. | `webview-react/src/components/SetupView.tsx` |  
| **5.2** | ☐ To Do | **Replace HTML Dialog:** Wrap setup form in `<Dialog.Root><Dialog.Trigger>`; add Tailwind to `<Dialog.Content className="p-4 bg-white">`. | `webview-react/src/components/SetupView.tsx` |  
| **5.3** | ☐ To Do | **Test Render:** Rebuild, open webview; confirm Dialog opens without unstyled overlay. | N/A |  
| **5.4** | ☐ To Do | **Add Radix CSS Vars:** In `index.css`, define `--radix-dialog-content-width: 400px;`. | `webview-react/src/index.css` |  
| **5.5** | ☐ To Do | **Verify Computed Vars:** Log in App.tsx; assert vars use Tailwind colors. | `webview-react/src/App.tsx` |  
| **5.6** | ☐ To Do | **Fallback for Errors:** In SetupView, add `|| <div>` if Dialog fails. | `webview-react/src/components/SetupView.tsx` |  
| **5.7** | ☐ To Do | **Integrate Other Primitives:** Add `<Select>` for model dropdown; style with Tailwind. | `webview-react/src/components/SetupView.tsx` |  
| **5.8** | ☐ To Do | **Rebuild and Extension Test:** Run build, reload VS Code; check no regressions. | N/A |  

### New Document: tasklist_sprint_06.md  
# Task List: Sprint 6 - Testing and Polish  
**Goal:** Validate Radix styling and add graceful degradation.  

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |  
|---------|--------|----------------------------------------------|-------------------|  
| **6.1** | ☐ To Do | **Create Radix Test File:** Add `radix-styling.test.ts`; goto dev, click trigger, assert overlay visible. | `webview-react/tests/e2e/radix-styling.test.ts` |  
| **6.2** | ☐ To Do | **Test Interactions:** Assert Dialog open: `expect(locator('[role="dialog"]')).toBeVisible()`. | `webview-react/tests/e2e/radix-styling.test.ts` |  
| **6.3** | ☐ To Do | **Theme-Specific Assertions:** Mock dark vars; assert background color. | `webview-react/tests/e2e/radix-styling.test.ts` |  
| **6.4** | ☐ To Do | **Run Suite:** `npx playwright test`; fix any fails. | N/A |  
| **6.5** | ☐ To Do | **Enhance ErrorBoundary:** Add Radix error catch; log "Radix theme conflict". | `webview-react/src/components/ErrorBoundary.tsx` |  
| **6.6** | ☐ To Do | **Test Degradation:** Simulate error; assert fallback UI shows. | `webview-react/tests/e2e/radix-styling.test.ts` |  
| **6.7** | ☐ To Do | **Document Integration:** Add to README: "Radix + Tailwind setup for webview". | `README.md` |  
| **6.8** | ☐ To Do | **Final Validation:** Full extension test; confirm styled UI. | N/A |  

### New Document: Sub-Sprint 5.1: Radix Dialog Integration  
**Objective:**  
Replace basic modals with styled Radix Dialog in SetupView.  

**Parent Sprint:**  
PRD 3, Sprint 5: Component Integration  

**Tasks:**  
1. Import and wrap form.  
2. Add Tailwind classes.  
3. Test open/close.  

**Acceptance Criteria:**  
- Dialog renders with padding/background.  
- No unstyled elements.  

**Dependencies:**  
- PRD 2 complete.  

**Timeline:**  
- **Start Date:** 2025-10-07  
- **End Date:** 2025-10-08  

### New Document: Sub-Sprint 5.2: CSS Var Customization  
**Objective:**  
Override Radix defaults with Tailwind for theme consistency.  

**Parent Sprint:**  
PRD 3, Sprint 5: Component Integration  

**Tasks:**  
1. Add vars in index.css.  
2. Log and verify computation.  
3. Fallback implementation.  

**Acceptance Criteria:**  
- Vars prioritize Tailwind.  
- Graceful on conflict.  

**Dependencies:**  
- Sub-Sprint 5.1 complete.  

**Timeline:**  
- **Start Date:** 2025-10-09  
- **End Date:** 2025-10-10  

### New Document: Sub-Sprint 6.1: Radix Interaction Tests  
**Objective:**  
Automate Radix behavior verification.  

**Parent Sprint:**  
PRD 3, Sprint 6: Testing and Polish  

**Tasks:**  
1. Create test file.  
2. Assert visibility on trigger.  
3. Add theme mock.  

**Acceptance Criteria:**  
- Tests pass interactions.  
- Screenshots on fail.  

**Dependencies:**  
- Sprint 5 complete.  

**Timeline:**  
- **Start Date:** 2025-10-13  
- **End Date:** 2025-10-14  

### New Document: Sub-Sprint 6.2: Error Handling and Docs  
**Objective:**  
Ensure robustness and document fixes.  

**Parent Sprint:**  
PRD 3, Sprint 6: Testing and Polish  

**Tasks:**  
1. Update ErrorBoundary.  
2. Test fallback.  
3. Add README section.  

**Acceptance Criteria:**  
- No crashes on errors.  
- Docs cover setup.  

**Dependencies:**  
- Sub-Sprint 6.1 complete.  

**Timeline:**  
- **Start Date:** 2025-10-15  
- **End Date:** 2025-10-16