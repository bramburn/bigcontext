This guide provides implementation details for Sprint 4: XML Result Formatting.

### 1. Choosing and Installing an XML Builder Library

While the PRD mentions `xml-builder-js`, a more modern and powerful choice is **`xmlbuilder2`**. It's a successor to `xmlbuilder.js` and provides a robust API for creating complex XML documents, including excellent support for CDATA sections.

**Installation**:
```bash
npm install xmlbuilder2
```

This library will prevent common errors associated with manual string concatenation for XML, such as improper character escaping.

### 2. Implementing the `XmlFormatterService`

This new service will be solely responsible for converting the array of search results into the final XML string.

**Location**: `src/formatting/XmlFormatterService.ts`

**Full `XmlFormatterService.ts` Implementation**:
```typescript
import { create } from 'xmlbuilder2';
import { QueryResult } from '../types'; // Assuming QueryResult type definition

export class XmlFormatterService {
  /**
   * Formats an array of search results into a repomix-style XML string.
   * @param results - The array of QueryResult objects.
   * @returns A pretty-printed XML string.
   */
  public formatResults(results: QueryResult[]): string {
    // Initialize the XML document with a root <files> element
    const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('files');

    // Loop through each result to create a <file> element
    for (const result of results) {
      const fileEle = root.ele('file', { path: result.filePath });

      // If content exists, wrap it in a CDATA section to preserve special characters
      if (result.content) {
        fileEle.dat(result.content);
      }
    }

    // Convert the XML object to a string with indentation
    return root.end({ prettyPrint: true });
  }
}
```

**Key API Points from `xmlbuilder2`**:
-   `create()`: Starts a new XML document.
-   `.ele('name', { attr: 'value' })`: Creates a new element, optionally with attributes.
-   `.dat('content')`: Creates a `<![CDATA[...]]>` section. This is critical for safely embedding source code.
-   `.end({ prettyPrint: true })`: Finalizes the document and converts it to a formatted string.

### 3. Integrating into `MessageRouter.ts`

The `MessageRouter` must be updated to use the new service before sending the results back to the UI.

**Location**: `src/messageRouter.ts`

**Integration Steps**:
1.  Ensure an instance of `XmlFormatterService` is created in `ExtensionManager` and passed to `MessageRouter`.
2.  Modify the `queryContext` message handler:

```typescript
// In MessageRouter.ts -> handleMessage method

// ... assuming xmlFormatterService is available as this.xmlFormatterService

case 'queryContext':
  try {
    // 1. Get the deduplicated results from the ContextService
    const results = await this.contextService.queryContext(
      message.payload.query,
      message.payload.maxResults,
      message.payload.includeContent
    );

    // 2. Format the results into an XML string using the new service
    const xmlOutput = this.xmlFormatterService.formatResults(results);

    // 3. Post the final XML string back to the webview
    webview.postMessage({
      command: 'queryResult',
      payload: xmlOutput
    });
  } catch (error) {
    // ... error handling
  }
  break;
```

### 4. Unit Testing the `XmlFormatterService`

A focused unit test will confirm that the XML generation is correct, especially the handling of CDATA.

**Location**: `src/test/suite/xmlFormatterService.test.ts`

**Example Test Case**:
```typescript
import * as assert from 'assert';
import { XmlFormatterService } from '../../formatting/XmlFormatterService';
import { QueryResult } from '../../types';

suite('XmlFormatterService Test Suite', () => {
  let formatter: XmlFormatterService;

  setup(() => {
    formatter = new XmlFormatterService();
  });

  test('should format results with content and special characters into XML with CDATA', () => {
    // Arrange: Mock data with special XML characters
    const mockResults: QueryResult[] = [
      {
        id: '1',
        score: 0.9,
        filePath: 'src/test.ts',
        content: 'const check = 1 < 2 && "hello";'
      },
      {
        id: '2',
        score: 0.8,
        filePath: 'src/another.ts',
        // This result has no content
      }
    ];

    // Act
    const xmlString = formatter.formatResults(mockResults);

    // Assert: Check for exact CDATA block and overall structure
    const expectedContent = '<![CDATA[const check = 1 < 2 && "hello";]]>';
    assert.ok(xmlString.includes(expectedContent), 'Content should be wrapped in CDATA');
    assert.ok(xmlString.includes('<file path="src/test.ts">'), 'Should contain first file element');
    assert.ok(xmlString.includes('<file path="src/another.ts"/>'), 'Should contain second, self-closing file element');
  });
});
```
