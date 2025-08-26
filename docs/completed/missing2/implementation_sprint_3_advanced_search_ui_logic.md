This guide provides implementation details for Sprint 3: Advanced Search UI & Logic.

### 1. Frontend: Enhancing `QueryView.svelte`

The goal is to add controls for `maxResults` and `includeContent` and pass these values to the backend.

**Location**: `webview/src/lib/components/QueryView.svelte`

**Implementation Strategy**:
Use Svelte's two-way data binding (`bind:value` and `bind:checked`) to link UI controls directly to component state variables. These variables are then included in the `postMessage` payload.

**Example `QueryView.svelte`**:
```html
<script lang="ts">
  import { onMount } from 'svelte';

  const vscode = acquireVsCodeApi();

  let searchQuery = '';
  let maxResults = 20;
  let includeContent = false;
  let results = '';

  function runQuery() {
    vscode.postMessage({
      command: 'queryContext',
      payload: {
        query: searchQuery,
        maxResults: maxResults,
        includeContent: includeContent
      }
    });
  }

  onMount(() => {
    window.addEventListener('message', event => {
      if (event.data.command === 'queryResult') {
        results = event.data.payload;
      }
    });
  });
</script>

<form on:submit|preventDefault={runQuery}>
  <textarea bind:value={searchQuery} placeholder="Enter your context query..."></textarea>
  
  <div class="controls">
    <div>
      <label for="max-results">Max Results</label>
      <input id="max-results" type="number" bind:value={maxResults} min="1" max="100" />
    </div>
    <div>
      <label for="include-content">Include file content</label>
      <input id="include-content" type="checkbox" bind:checked={includeContent} />
    </div>
  </div>

  <button type="submit">Query</button>
</form>

{#if results}
  <pre><code>{results}</code></pre>
{/if}
```

### 2. Backend: Deduplication Logic in `ContextService`

This is the core of the sprint. The `queryContext` method must be updated to handle deduplication, sorting, and conditional content loading.

**Location**: `src/context/contextService.ts`

**API/Library Research**: A web search for "typescript group by and get max" confirms that using a `Map` is a standard and efficient pattern for this task. It avoids nested loops and provides a clean way to store unique items by a key.

**Full `queryContext` Method Implementation**:
```typescript
import * as fs from 'fs';
// Assuming QueryResult and QdrantService are defined elsewhere
// import { QdrantService } from '../db/qdrantService';
// import { QueryResult } from '../types';

export class ContextService {
  private qdrantService: QdrantService;

  constructor(qdrantService: QdrantService) {
    this.qdrantService = qdrantService;
  }

  public async queryContext(
    query: string, 
    maxResults: number = 20, 
    includeContent: boolean = false
  ): Promise<QueryResult[]> {
    
    // 1. Fetch a larger number of results to have a good pool for deduplication.
    // A 5x multiplier is a reasonable heuristic.
    const rawResults = await this.qdrantService.search(query, { limit: maxResults * 5 });

    // 2. Use a Map to store the best (highest score) result for each unique file path.
    const uniqueFiles = new Map<string, QueryResult>();

    for (const result of rawResults) {
      const existing = uniqueFiles.get(result.filePath);
      // If we haven't seen this file, or the new result has a higher score, store it.
      if (!existing || result.score > existing.score) {
        uniqueFiles.set(result.filePath, result);
      }
    }

    // 3. Convert the Map values to an array, sort by score descending, and slice to maxResults.
    let finalResults = Array.from(uniqueFiles.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    // 4. If requested, read the file content for the final list of files.
    // Use Promise.all for efficient, parallel file reading.
    if (includeContent) {
      await Promise.all(finalResults.map(async (result) => {
        try {
          // We only need the content, not the other fields from the result.
          const content = await fs.promises.readFile(result.filePath, 'utf-8');
          result.content = content;
        } catch (error) {
          console.error(`Error reading file ${result.filePath}:`, error);
          result.content = `Error reading file: ${error.message}`;
        }
      }));
    }

    return finalResults;
  }
}
```

### 3. Unit Testing the Deduplication Logic

To ensure the logic is sound, a unit test is essential. This test should not make real service calls but should instead use mock data.

**Location**: `src/test/suite/contextService.test.ts`

**Example Test Case**:
```typescript
import * as assert from 'assert';
import { ContextService } from '../../context/contextService';
import { QdrantService } from '../../db/qdrantService';
import * as sinon from 'sinon';

suite('ContextService Test Suite', () => {
  let qdrantServiceStub: sinon.SinonStubbedInstance<QdrantService>;
  let contextService: ContextService;

  setup(() => {
    // Create a stub for QdrantService to avoid real DB calls
    qdrantServiceStub = sinon.createStubInstance(QdrantService);
    contextService = new ContextService(qdrantServiceStub);
  });

  test('queryContext should deduplicate results and return the highest score per file', async () => {
    // Arrange: Mock data with duplicates
    const mockResults = [
      { id: '1', score: 0.9, filePath: 'fileA.ts', content: '' },
      { id: '2', score: 0.8, filePath: 'fileB.ts', content: '' },
      { id: '3', score: 0.85, filePath: 'fileA.ts', content: '' }, // Duplicate of fileA
      { id: '4', score: 0.95, filePath: 'fileC.ts', content: '' },
      { id: '5', score: 0.7, filePath: 'fileB.ts', content: '' }, // Duplicate of fileB
    ];
    qdrantServiceStub.search.resolves(mockResults);

    // Act: Call the method with maxResults = 3
    const results = await contextService.queryContext('test query', 3, false);

    // Assert
    assert.strictEqual(results.length, 3, 'Should return 3 results');
    assert.strictEqual(results[0].filePath, 'fileC.ts', 'First result should be fileC with highest score');
    assert.strictEqual(results[0].score, 0.95, 'Score for fileC should be 0.95');
    assert.strictEqual(results[1].filePath, 'fileA.ts', 'Second result should be fileA');
    assert.strictEqual(results[1].score, 0.9, 'Score for fileA should be the max of duplicates: 0.9');
    assert.strictEqual(results[2].filePath, 'fileB.ts', 'Third result should be fileB');
    assert.strictEqual(results[2].score, 0.8, 'Score for fileB should be the max of duplicates: 0.8');
  });
});
```
