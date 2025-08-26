### User Story 1: XML Output Generation
**As a** backend developer (Alisha), **I want to** create an `XmlFormatterService` that transforms search results into a `repomix`-style XML string, **so that** the output is consistent and machine-readable for use in other AI workflows.

**Actions to Undertake:**
1.  **Filepath**: `package.json`
    -   **Action**: Add a robust XML building library to the project's dependencies.
    -   **Implementation**: Run `npm install xmlbuilder2`.
    -   **Imports**: N/A
2.  **Filepath**: `src/formatting/XmlFormatterService.ts` (New File)
    -   **Action**: Create a new service dedicated to formatting search results into XML.
    -   **Implementation**: Define a class `XmlFormatterService` with a public method `formatResults`.
    -   **Imports**: `import { create } from 'xmlbuilder2';`, `import { QueryResult } from '../types';`
3.  **Filepath**: `src/formatting/XmlFormatterService.ts`
    -   **Action**: Implement the `formatResults` method to build the XML structure.
    -   **Implementation**:
        ```typescript
        public formatResults(results: QueryResult[]): string {
          const root = create({ version: '1.0' }).ele('files');
          for (const result of results) {
            const fileEle = root.ele('file', { path: result.filePath });
            // CDATA section will be added in the next story
          }
          return root.end({ prettyPrint: true });
        }
        ```
    -   **Imports**: `import { create } from 'xmlbuilder2';`
4.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: Integrate the `XmlFormatterService` into the message handling flow.
    -   **Implementation**: After receiving results from `ContextService`, pass them to the `XmlFormatterService` and send the resulting XML string to the webview in the `queryResult` message.
    -   **Imports**: `import { XmlFormatterService } from './formatting/XmlFormatterService';`
5.  **Filepath**: `webview/src/lib/components/QueryView.svelte`
    -   **Action**: Update the results display area to render the raw XML string inside a `<pre><code>` block for proper formatting.
    -   **Implementation**: `<pre><code>{xmlResult}</code></pre>`
    -   **Imports**: N/A

**Acceptance Criteria:**
-   A query to the backend returns a valid XML string.
-   The XML has a root `<files>` element.
-   Each search result corresponds to a `<file>` element with a `path` attribute.
-   The webview correctly displays the formatted XML output.

**Testing Plan:**
-   **Test Case 1**: Run a query and verify the response received by the webview is a string starting with `<?xml version="1.0"?>` and containing a `<files>` root element.
-   **Unit Test**: Write a test for `formatResults` that passes an array of mock `QueryResult` objects and asserts the output XML has the correct structure and attributes.

---

### User Story 2: Preserve Code with CDATA
**As a** backend developer (Alisha), **I want** the `XmlFormatterService` to wrap all file content in `<![CDATA[...]]>` sections, **so that** special characters like `<` and `&` in the source code are preserved correctly and do not break the XML structure.

**Actions to Undertake:**
1.  **Filepath**: `src/formatting/XmlFormatterService.ts`
    -   **Action**: Modify the `formatResults` method to wrap file content in a `CDATA` section.
    -   **Implementation**:
        ```typescript
        // ... inside the for loop
        const fileEle = root.ele('file', { path: result.filePath });
        if (result.content) {
          fileEle.dat(result.content);
        }
        ```
    -   **Imports**: N/A
2.  **Filepath**: `src/test/suite/xmlFormatterService.test.ts` (New File)
    -   **Action**: Write a unit test that specifically validates the correct use of CDATA for special characters.
    -   **Implementation**: Create a test case where the mock `QueryResult` content includes characters like `<script>`, `&amp;`, and `&&`. Assert that the output XML is well-formed and that the content inside the CDATA section is identical to the input, without any XML escaping.
    -   **Imports**: `import * as assert from 'assert';`, `import { XmlFormatterService } from '../../formatting/XmlFormatterService';`

**Acceptance Criteria:**
-   When a search result includes file content, that content is enclosed within a `<![CDATA[...]]>` section in the final XML.
-   The generated XML is valid and can be parsed by a standard XML parser, even if the source code contains special XML characters.
-   Characters like `<`, `>`, and `&` within the code are not escaped (e.g., `&` is not converted to `&amp;`).

**Testing Plan:**
-   **Unit Test**: Create a test for `formatResults` with content `const x = a < b && c > d;`. Verify the output XML contains `<![CDATA[const x = a < b && c > d;]]>` exactly.
-   **Integration Test**: Run a query that returns a file containing HTML or XML-like syntax. Copy the resulting XML output and validate it using an online XML validator to ensure it is well-formed.
