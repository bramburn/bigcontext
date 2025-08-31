how do i implement the sprints 2 to 2 , undertake a full websearch, determine which content is suitable and then, provide code example, api information and further guidance on using external api/packages to complete the task. Review 'prd', (if available) the existing code inin your analysis. Ensure each guide is produced in their own individual canvas document

**Implementation Guidance for Sprint 2: Query Expansion & Re-ranking**

**Objective:** Enhance search capabilities by implementing LLM-powered query expansion to broaden search scope and LLM-powered re-ranking to improve the relevance of top search results.

**Relevant Files:**
-   `src/searchManager.ts` (Orchestrates search flow)
-   `src/queryExpansionService.ts` (New file for query expansion logic)
-   `src/context/contextService.ts` (Will be modified for re-ranking logic)
-   `src/embeddings/embeddingProvider.ts` (Interface for LLM interaction)
-   `src/embeddings/ollamaProvider.ts` or `src/embeddings/openaiProvider.ts` (Concrete LLM implementations)
-   `src/configuration/configurationSchema.ts` (For user settings)
-   `src/configuration/configurationManager.ts` (To read user settings)

**Web Search/API Information:**
-   **LLM Interaction:** The existing `EmbeddingProvider` implementations (e.g., `OpenAIProvider`, `OllamaProvider`) should be extended or utilized for text generation/completion capabilities, not just embeddings.
    -   **OpenAI API:** Refer to the Chat Completions API documentation (`gpt-3.5-turbo`, `gpt-4`) for generating text based on prompts.
    -   **Ollama API:** Consult Ollama documentation for local LLM inference, specifically for text generation endpoints.
-   **Prompt Engineering:** The quality of LLM output heavily depends on the prompt. Experimentation will be key.
    -   **For Query Expansion:** Prompts should guide the LLM to generate synonyms and related concepts. Example: `"Generate synonyms and related concepts for the following term: [query]. Provide them as a comma-separated list." `
    -   **For Re-ranking:** Prompts need to present the original query and the candidate snippets clearly, asking the LLM to re-order them based on relevance. Example: `"Original Query: '[query]'. Given the following code snippets, re-rank them from most relevant to least relevant. Provide only the re-ranked list of snippet IDs (e.g., [1, 3, 2]). [Snippet 1], [Snippet 2], ..."`

**Guidance:**

1.  **Create `src/queryExpansionService.ts`:**
    *   This new service will encapsulate the logic for expanding user queries.
    *   It will depend on an `EmbeddingProvider` (or a more general `LLMService` if created) to interact with the LLM.
    *   Implement a method, e.g., `expandQuery(query: string): Promise<string[]>`, that takes the original query, constructs an LLM prompt, calls the LLM, parses its response (e.g., a comma-separated list of terms), and returns an array of expanded terms (including the original query).
    *   Integrate `ConfigurationManager` to check if query expansion is enabled by the user.

2.  **Modify `src/searchManager.ts`:**
    *   Inject `QueryExpansionService` and `ContextService` (and `ConfigurationManager`) into its constructor.
    *   Before generating the embedding for the user's search query, call `this.queryExpansionService.expandQuery(query)`. Combine the original query and the expanded terms (e.g., by joining them with spaces) before passing to `embeddingProvider.createEmbedding()`.
    *   After performing the initial vector search (e.g., `this.qdrantService.search(queryEmbedding, 10)` to get top 10 candidates), check if LLM re-ranking is enabled via `ConfigurationManager`.
    *   If enabled, call `this.contextService.reRankResults(query, topCandidates)` to get the re-ordered results.
    *   Return the final list of results (either the re-ranked list or the original vector search results).

3.  **Modify `src/context/contextService.ts`:**
    *   Inject `EmbeddingProvider` (or `LLMService`) and `ConfigurationManager` into its constructor.
    *   Add a new asynchronous method, e.g., `reRankResults(originalQuery: string, results: any[]): Promise<any[]>`. This method will:
        *   Check if re-ranking is enabled.
        *   Construct a detailed prompt for the LLM, including the `originalQuery` and the content of each `result` (e.g., `chunkText` from the payload).
        *   Call the LLM (e.g., `this.embeddingProvider.generateText(prompt)`).
        *   Parse the LLM's response to determine the new order of results. This parsing needs to be robust to variations in LLM output (e.g., using regular expressions to extract a list of IDs).
        *   Reconstruct the `results` array based on the LLM's re-ranked order.
        *   Implement fallback logic: if the LLM call fails or its response cannot be parsed, return the original `results` array.

4.  **Update `src/configuration/configurationSchema.ts`:**
    *   Add new boolean properties under a `"search"` section (or an existing relevant section) for `"queryExpansion.enabled"` and `"llmReRanking.enabled"`. Set their `"default"` values to `false` as per the PRD's mitigation strategy.

**Code Examples:**

**`src/queryExpansionService.ts` (New File Content - Illustrative):**

```typescript
import { EmbeddingProvider } from './embeddings/embeddingProvider'; // Assuming this can also do text generation
import { ConfigurationManager } from './configurationManager';

export class QueryExpansionService {
    private embeddingProvider: EmbeddingProvider;
    private configManager: ConfigurationManager;

    constructor(embeddingProvider: EmbeddingProvider, configManager: ConfigurationManager) {
        this.embeddingProvider = embeddingProvider;
        this.configManager = configManager;
    }

    public async expandQuery(query: string): Promise<string[]> {
        if (!this.configManager.getSetting('search.queryExpansion.enabled')) {
            return [query]; // Return original query if disabled
        }

        try {
            // This assumes your EmbeddingProvider has a method for text generation/completion
            // You might need to add a specific method for this in EmbeddingProvider interface
            const prompt = `Generate synonyms and related concepts for the following term: "${query}". Provide them as a comma-separated list, e.g., "term1, term2, term3".`;
            const response = await this.embeddingProvider.generateText(prompt); // Assuming generateText method
            const expandedTerms = response.split(',').map(term => term.trim()).filter(term => term.length > 0);
            return [...new Set([query, ...expandedTerms])]; // Return unique terms including original query
        } catch (error) {
            console.error('Error expanding query:', error);
            return [query]; // Fallback to original query on error
        }
    }
}
```

**`src/searchManager.ts` (Snippets - Illustrative):**

```typescript
import { QueryExpansionService } from './queryExpansionService';
import { ContextService } from './context/contextService';
import { EmbeddingProvider } from './embeddings/embeddingProvider';
import { QdrantService } from './db/qdrantService';
import { ConfigurationManager } from './configurationManager';

export class SearchManager {
    private queryExpansionService: QueryExpansionService;
    private contextService: ContextService;
    private embeddingProvider: EmbeddingProvider;
    private qdrantService: QdrantService;
    private configManager: ConfigurationManager;

    constructor(
        queryExpansionService: QueryExpansionService,
        contextService: ContextService,
        embeddingProvider: EmbeddingProvider,
        qdrantService: QdrantService,
        configManager: ConfigurationManager
    ) {
        this.queryExpansionService = queryExpansionService;
        this.contextService = contextService;
        this.embeddingProvider = embeddingProvider;
        this.qdrantService = qdrantService;
        this.configManager = configManager;
    }

    public async search(query: string): Promise<any[]> {
        // 1. Query Expansion
        const expandedQueries = await this.queryExpansionService.expandQuery(query);
        const combinedQueryText = expandedQueries.join(' '); // Combine for embedding

        // 2. Generate embedding for the (potentially expanded) query
        const queryEmbedding = await this.embeddingProvider.createEmbedding(combinedQueryText);

        // 3. Perform vector search
        const topCandidates = await this.qdrantService.search(queryEmbedding, 10); // Get top 10

        // 4. LLM Re-ranking
        if (this.configManager.getSetting('search.llmReRanking.enabled')) {
            const reRankedResults = await this.contextService.reRankResults(query, topCandidates);
            return reRankedResults;
        }

        return topCandidates; // Return original order if re-ranking is disabled
    }
}
```

**`src/context/contextService.ts` (Snippet - Illustrative):**

```typescript
import { EmbeddingProvider } from './embeddings/embeddingProvider'; // Assuming this can also do text generation
import { ConfigurationManager } from './configurationManager';

export class ContextService {
    private embeddingProvider: EmbeddingProvider;
    private configManager: ConfigurationManager;

    constructor(embeddingProvider: EmbeddingProvider, configManager: ConfigurationManager) {
        this.embeddingProvider = embeddingProvider;
        this.configManager = configManager;
    }

    public async reRankResults(originalQuery: string, results: any[]): Promise<any[]> {
        if (!this.configManager.getSetting('search.llmReRanking.enabled')) {
            return results; // Return original order if disabled
        }

        if (results.length === 0) {
            return [];
        }

        // Construct a prompt for the LLM
        // This prompt needs to be carefully engineered for best results
        let prompt = `Original Query: "${originalQuery}"

`;
        prompt += `Given the following code snippets, re-rank them from most relevant to least relevant based on the original query. Provide only the re-ranked list of snippet IDs (e.g., [1, 3, 2]).

`;

        const snippetMap = new Map<number, any>();
        results.forEach((result, index) => {
            const snippetId = index + 1;
            snippetMap.set(snippetId, result);
            prompt += `Snippet ID ${snippetId}:


${result.payload.chunkText}

`;
        });

        try {
            const llmResponse = await this.embeddingProvider.generateText(prompt); // Assuming generateText method
            // Parse the LLM's response to get the re-ranked order of IDs
            // This parsing needs to be robust, as LLM output can vary
            const reRankedIdsMatch = llmResponse.match(/[\[(\d+(?:,\s*\d+)*)\]]/);
            if (reRankedIdsMatch && reRankedIdsMatch[1]) {
                const reRankedIds = reRankedIdsMatch[1].split(',').map(id => parseInt(id.trim()));
                const reRankedResults = reRankedIds
                    .map(id => snippetMap.get(id))
                    .filter(result => result !== undefined); // Filter out any invalid IDs

                // Ensure all original results are present, even if LLM missed some
                // This is a fallback to prevent data loss
                const finalResults = [...new Set([...reRankedResults, ...results])];
                return finalResults;
            }
            console.warn('LLM re-ranking response could not be parsed:', llmResponse);
            return results; // Fallback to original order if parsing fails
        } catch (error) {
            console.error('Error re-ranking results with LLM:', error);
            return results; // Fallback to original order on error
        }
    }
}
```

**`src/configuration/configurationSchema.ts` (Snippet - Illustrative):**

```typescript
// ... existing schema definitions

export const configurationSchema = {
    // ... other properties
    "search": {
        "type": "object",
        "properties": {
            "queryExpansion": {
                "type": "object",
                "properties": {
                    "enabled": {
                        "type": "boolean",
                        "default": false,
                        "description": "Enable AI-powered query expansion to find more relevant results."
                    }
                }
            },
            "llmReRanking": {
                "type": "object",
                "properties": {
                    "enabled": {
                        "type": "boolean",
                        "default": false,
                        "description": "Enable AI-powered re-ranking of search results for improved accuracy."
                    }
                }
            }
        }
    }
};
```