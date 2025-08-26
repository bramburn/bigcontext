# Task List: Sprint 6 - Resource Management

**Goal:** To provide users with control over the extension's resource consumption by implementing an "Indexing Intensity" setting.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **6.1** | ☐ To Do | **Define `indexingIntensity` Setting:** In `package.json`, define the new `code-context-engine.indexingIntensity` setting under `contributes.configuration`. | `package.json` |
| **6.2** | ☐ To Do | **Add getter to `ConfigService`:** In `src/configService.ts`, add a new getter method `getIndexingIntensity()` to retrieve the configured value from the workspace configuration. | `src/configService.ts` |
| **6.3** | ☐ To Do | **Create delay helper:** In `src/indexing/indexingService.ts`, create a simple async `delay` helper function. | `src/indexing/indexingService.ts` |
| **6.4** | ☐ To Do | **Implement throttling logic:** In `src/indexing/indexingService.ts`, in the main file processing loop, read the intensity setting and `await` a delay based on its value. | `src/indexing/indexingService.ts` |
