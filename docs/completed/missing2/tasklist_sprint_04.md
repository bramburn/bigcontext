# Task List: Sprint 4 - XML Result Formatting

**Goal:** To create a dedicated service for formatting the final, deduplicated search results into a `repomix`-style XML string.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **4.1** | ☐ To Do | **Install XML Builder Library:** Open a terminal in the root directory and run `npm install xmlbuilder2` to add the library to the project. | `package.json` |
| **4.2** | ☐ To Do | **Create Formatting Directory:** Create a new directory at `src/formatting`. | `src/formatting/` |
| **4.3** | ☐ To Do | **Create `XmlFormatterService.ts`:** Create a new file `XmlFormatterService.ts` in the `formatting` directory. Define the `XmlFormatterService` class within it. | `src/formatting/XmlFormatterService.ts` |
| **4.4** | ☐ To Do | **Implement `formatResults` Method:** In `XmlFormatterService`, create a public method `formatResults(results: QueryResult[]): string`. | `src/formatting/XmlFormatterService.ts` |
| **4.5** | ☐ To Do | **Build XML Structure:** Inside `formatResults`, use `xmlbuilder2` to create a root `<files>` element. Loop through the `results` array. For each result, create a `<file>` child element. | `src/formatting/XmlFormatterService.ts` |
| **4.6** | ☐ To Do | **Add `path` Attribute:** When creating each `<file>` element, add a `path` attribute containing the `result.filePath`. | `src/formatting/XmlFormatterService.ts` |
| **4.7** | ☐ To Do | **Wrap Content in CDATA:** Inside the loop, check if `result.content` exists. If it does, use the builder's `.dat()` method to add the content inside a `<![CDATA[...]]>` section within the `<file>` element. | `src/formatting/XmlFormatterService.ts` |
| **4.8** | ☐ To Do | **Return Formatted XML:** At the end of `formatResults`, call `.end({ prettyPrint: true })` on the root element to generate and return the final, formatted XML string. | `src/formatting/XmlFormatterService.ts` |
| **4.9** | ☐ To Do | **Integrate into `ExtensionManager`:** In `src/extensionManager.ts`, import and create an instance of `XmlFormatterService`. Pass this instance to the `MessageRouter`'s constructor. | `src/extensionManager.ts` |
| **4.10**| ☐ To Do | **Integrate into `MessageRouter`:** In `src/messageRouter.ts`, modify the `queryContext` handler. After getting the results from `ContextService`, pass them to `xmlFormatterService.formatResults` to get the XML string. | `src/messageRouter.ts` |
| **4.11**| ☐ To Do | **Update `MessageRouter` Payload:** Change the `postMessage` call in the `queryContext` handler to send the final XML string to the webview, not the raw result object. | `src/messageRouter.ts` |
| **4.12**| ☐ To Do | **Update `QueryView.svelte` Display:** In `webview/src/lib/components/QueryView.svelte`, wrap the `{results}` variable in a `<pre><code>` block to ensure the XML is displayed correctly with proper indentation. | `webview/src/lib/components/QueryView.svelte` |
| **4.13**| ☐ To Do | **Create Formatter Test File:** Create a new test file at `src/test/suite/xmlFormatterService.test.ts`. | `src/test/suite/xmlFormatterService.test.ts` |
| **4.14**| ☐ To Do | **Write CDATA Unit Test:** In the new test file, write a test that passes mock results containing special XML characters (e.g., `<`, `&`) to `formatResults`. Assert that the output contains a valid `CDATA` section and is well-formed. | `src/test/suite/xmlFormatterService.test.ts` |
| **4.15**| ☐ To Do | **Test End-to-End:** Launch the extension. Run a query with "Include file content" checked. Verify the results are displayed as a formatted XML string in the UI. | `(Manual Test)` |
