### User Story 2: Query Expansion & Re-ranking
**As a** user, **I want to** the search to understand my intent even if I use simple terms, **so that** I get comprehensive results.
**As a** user, **I want to** the most contextually relevant search result to always be at the very top of the list, **so that** I can trust the extension to find the "best" answer.

**Actions to Undertake:**
1.  **Filepath**: `src/searchManager.ts`
    -   **Action**: Integrate `QueryExpansionService` before vectorizing user queries.
    -   **Implementation**: ```// Call queryExpansionService.expandQuery() before creating the embedding for the user's query.```
    -   **Imports**: ```import { QueryExpansionService } from './queryExpansionService';```
2.  **Filepath**: `src/queryExpansionService.ts`
    -   **Action**: Create a new service for query expansion using an LLM.
    -   **Implementation**: ```// This service will interact with an LLM (e.g., via EmbeddingProvider) to generate synonyms and related concepts for a given query.```
    -   **Imports**: ```import { EmbeddingProvider } from './embeddings/embeddingProvider';
import { ConfigurationManager } from './configurationManager';```
3.  **Filepath**: `src/searchManager.ts`
    -   **Action**: Integrate LLM re-ranking after retrieving top candidates from vector search.
    -   **Implementation**: ```// After getting top N results from Qdrant, pass them to contextService.reRankResults() before returning.```
    -   **Imports**: ```import { ContextService } from './context/contextService';```
4.  **Filepath**: `src/context/contextService.ts`
    -   **Action**: Modify `ContextService` to send top candidates and original query to an LLM for re-ranking.
    -   **Implementation**: ```// Add a new method (e.g., reRankResults) that constructs a prompt for the LLM with the query and snippets, calls the LLM, and parses the re-ranked order.```
    -   **Imports**: ```import { EmbeddingProvider } from './embeddings/embeddingProvider';
import { ConfigurationManager } from './configurationManager';```
5.  **Filepath**: `src/configuration/configurationSchema.ts`
    -   **Action**: Add settings to enable/disable query expansion and LLM re-ranking.
    -   **Implementation**: ```// Add new properties under a 'search' section for 'queryExpansion.enabled' and 'llmReRanking.enabled'.```
    -   **Imports**: ```// No new imports needed for schema definition.```

**List of Files to be Created:**
-   `src/queryExpansionService.ts`

**Acceptance Criteria:**
-   A new `QueryExpansionService` is created.
-   Before vectorizing a user's query, this service sends the query to an LLM to generate a list of synonyms and related concepts.
-   The original query and the expanded terms are combined to create the final embedding.
-   After retrieving the top 10 candidates from the vector search, the `ContextService` sends these results (and the original query) to an LLM.
-   The LLM re-ranks the 10 candidates based on a deeper semantic understanding.
-   The final results displayed to the user are in the new, re-ranked order.
-   Query expansion increases the number of relevant results (recall) for single-word queries by 30%.
-   LLM re-ranking improves the "top 1" search result accuracy by a measurable 20% in internal testing.

**Testing Plan:**
-   **Test Case 1 (Query Expansion):** Provide a simple query (e.g., "login") and verify that the `QueryExpansionService` generates relevant synonyms/concepts (e.g., "authentication", "sign-in").
-   **Test Case 2 (Query Expansion):** Perform searches with and without query expansion enabled and compare the recall of relevant results.
-   **Test Case 3 (Re-ranking):** Perform a search and manually verify that the top 1 result after re-ranking is more contextually relevant than the top 1 result before re-ranking.
-   **Test Case 4 (Re-ranking):** Develop a set of test queries with known "best" answers and measure the "top 1" accuracy before and after re-ranking.
-   **Test Case 5:** Verify that LLM re-ranking and query expansion features can be controlled by a user setting and are disabled by default.