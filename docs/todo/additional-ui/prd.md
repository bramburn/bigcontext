# PRD 8: Interactive Filtering & Search Quality Feedback

**1\. Title & Overview**

- **Project:** Code Context Engine - Interactive Filtering & Search Quality Feedback
    
- **Summary:** This phase introduces two key user-centric features. First, **Interactive Filtering** will allow developers to dynamically refine search results based on metadata like file type or date. Second, a **Search Quality Feedback** mechanism will be implemented, enabling users to rate the relevance of results, providing valuable data for future ranking improvements.
    
- **Dependencies:** This phase builds on the fully functional search UI and backend from PRD 1-5.
    

**2\. Goals & Success Metrics**

- **Business Objectives:**
    
    - Increase user efficiency by reducing the time it takes to find the correct search result.
        
    - Begin collecting structured data on search result quality to inform future AI model tuning.
        
- **Developer & System Success Metrics:**
    
    - Users can successfully filter a result set by at least two different criteria (e.g., file type AND last modified date).
        
    - The feedback system successfully records at least 1,000 individual feedback events (upvotes/downvotes) within the first month of deployment.
        
    - Search latency remains under 500ms even with filters applied.
        

**3\. User Personas**

- **Devin (Developer - End User):** Devin remembers seeing a function in a `.ts` file sometime last week, but can't recall the exact name. He wants to narrow his search to only TypeScript files modified recently to find it faster.
    
- **Priya (Product Manager / Data Analyst):** Priya wants to understand which types of queries produce low-quality results so she can guide the development of the search algorithm.
    

**4\. Requirements Breakdown**

| 
Phase

 | 

Sprint

 | 

User Story

 | 

Acceptance Criteria

 | 

Duration

 |
| --- | --- | --- | --- | --- |
| 

**Phase 4: UX & Workflow**

 | 

**Sprint 8: Interactive Filtering**

 | 

As Devin, I want to filter my search results by file type and modification date, so I can narrow down results from a broad query.

 | 

1\. The search payload sent to Qdrant is updated to include metadata (file extension, last modified timestamp).<br>2. The search results view includes a new filter panel with options for file type and date ranges.<br>3. Applying a filter re-queries the backend with the appropriate filter conditions and updates the results view without a full page reload.

 | 

**2 Weeks**

 |
| 

**Phase 4: UX & Workflow**

 | 

**Sprint 9: Search Quality Feedback**

 | 

As Devin, I want to upvote or downvote a search result so I can provide feedback on its relevance.

 | 

1\. Each result card in the UI has a thumbs-up and thumbs-down icon.<br>2. Clicking an icon sends the query, the result's ID, and the feedback (positive/negative) to a new backend endpoint.<br>3. The backend service logs this feedback to a persistent store (e.g., a new table or log file) for later analysis.

 | 

**2 Weeks**

 |

**5\. Timeline & Sprints**

- **Total Estimated Time:** 4 Weeks
    
- **Sprint 8:** Interactive Filtering (2 Weeks)
    
- **Sprint 9:** Search Quality Feedback (2 Weeks)
    

**6\. Risks & Assumptions**

- **Assumption:** The underlying Qdrant database can efficiently handle filtering on metadata payloads without a significant performance penalty.
    
- **Risk:** The UI for filtering could become cluttered if too many options are added at once.
    
    - **Mitigation:** Start with the two most critical filters (file type, date) and gather user feedback before adding more.
        
- **Risk:** The feedback data might be sparse, making it difficult to draw statistically significant conclusions.
    
    - **Mitigation:** Encourage feedback through subtle UI cues. In the long term, this data is still valuable for identifying major outliers.



# Task List: Sprint 8 - Interactive Filtering

**Goal:** To implement the UI and backend logic for filtering search results by file type and modification date.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**8.1**

 | 

☐ To Do

 | 

**Update Indexing Payload:** In `src/indexing/indexingService.ts`, when creating the Qdrant points, add `fileType` (e.g., from `path.extname`) and `lastModified` (from `fs.statSync`) to the payload.

 | 

`src/indexing/indexingService.ts`

 |
| 

**8.2**

 | 

☐ To Do

 | 

**Re-index a Test Repo:** Clear the existing Qdrant collection and re-index a repository to ensure all points have the new metadata payload.

 | 

(Manual Step)

 |
| 

**8.3**

 | 

☐ To Do

 | 

**Modify `SearchManager`:** Update the `performSemanticSearch` method in `src/searchManager.ts` to accept an optional `filters` object.

 | 

`src/searchManager.ts`

 |
| 

**8.4**

 | 

☐ To Do

 | 

**Pass Filters to Qdrant:** Inside `performSemanticSearch`, if filters are provided, construct the appropriate Qdrant filter condition and include it in the `qdrantService.search` call.

 | 

`src/searchManager.ts`

 |
| 

**8.5**

 | 

☐ To Do

 | 

**Create `FilterPanel.tsx` Component:** In `webview-react/src/components/`, create a new component `FilterPanel.tsx`. It should contain dropdowns or checkboxes for file types and date ranges.

 | 

`webview-react/src/components/FilterPanel.tsx` (New)

 |
| 

**8.6**

 | 

☐ To Do

 | 

**Manage Filter State:** In `webview-react/src/components/QueryView.tsx`, add a state variable to hold the current filter selections.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**8.7**

 | 

☐ To Do

 | 

**Integrate Filter Panel:** Add the `FilterPanel` component to the `QueryView`, passing down the current filter state and a callback function to update it.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**8.8**

 | 

☐ To Do

 | 

**Trigger Filtered Search:** When the filter state changes, trigger a new search request via `postMessage`, including the selected filters in the payload.

 | 

`webview-react/src/components/QueryView.tsx`

 |

 # Task List: Sprint 9 - Search Quality Feedback

**Goal:** To implement a mechanism for users to provide feedback on the quality of search results.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**9.1**

 | 

☐ To Do

 | 

**Create `FeedbackService.ts`:** Create a new file `src/feedback/feedbackService.ts`. This service will have a single method, `logFeedback`, that takes the query, result ID, and feedback type.

 | 

`src/feedback/feedbackService.ts` (New)

 |
| 

**9.2**

 | 

☐ To Do

 | 

**Implement Feedback Logging:** The `logFeedback` method should format the feedback into a structured JSON object and append it to a log file. Use the `CentralizedLoggingService`.

 | 

`src/feedback/feedbackService.ts`

 |
| 

**9.3**

 | 

☐ To Do

 | 

**Expose Feedback Endpoint:** In `src/communication/messageRouter.ts`, add a new case `submitFeedback` that calls the `feedbackService.logFeedback` method.

 | 

`src/communication/messageRouter.ts`

 |
| 

**9.4**

 | 

☐ To Do

 | 

**Add Feedback Icons to UI:** In the `ResultCard` component in `webview-react/src/components/QueryView.tsx`, add two clickable icons (e.g., `ThumbLike` and `ThumbDislike` from Fluent UI) to the card's action area.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**9.5**

 | 

☐ To Do

 | 

**Implement Feedback Handler:** Create a function `handleFeedback(feedbackType)` in the `ResultCard` component. This function will call `postMessage('submitFeedback', { ... })` with the necessary data.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**9.6**

 | 

☐ To Do

 | 

**Add Visual Feedback:** After a user clicks a feedback icon, visually disable both icons for that card (e.g., lower opacity) to indicate that feedback has been submitted. Use a state variable to track submission.

 | 

`webview-react/src/components/QueryView.tsx`

 |

 # PRD 9: User Onboarding & Collaboration Features

**1\. Title & Overview**

- **Project:** Code Context Engine - User Onboarding & Collaboration Features
    
- **Summary:** This phase is designed to improve the new user experience and enable team-based workflows. We will introduce a simple **User Onboarding** tour to guide first-time users through the core features. Additionally, we will implement **Collaboration Features**, allowing developers to share links to specific search results or queries.
    
- **Dependencies:** Requires a stable search UI.
    

**2\. Goals & Success Metrics**

- **Business Objectives:**
    
    - Increase the activation rate of new users by making the initial experience more intuitive.
        
    - Promote team adoption by enabling seamless sharing of insights.
        
- **Developer & System Success Metrics:**
    
    - Over 75% of new users complete the onboarding tour.
        
    - The "Share" feature is used at least 500 times in the first month.
        
    - Generated permalinks correctly open the extension and display the intended search result or query.
        

**3\. User Personas**

- **Nina (New Developer):** Nina has just installed the extension. She's not sure where to start and wants a quick overview of how to index her project and perform a search.
    
- **Devin (Developer - End User):** Devin found the exact function he was looking for to solve a bug. He wants to send a direct link to this result to a colleague in Slack to get their opinion.
    

**4\. Requirements Breakdown**

| 
Phase

 | 

Sprint

 | 

User Story

 | 

Acceptance Criteria

 | 

Duration

 |
| --- | --- | --- | --- | --- |
| 

**Phase 4: UX & Workflow**

 | 

**Sprint 10: User Onboarding**

 | 

As Nina, I want a simple, guided tour when I first open the extension, so I can understand the basic workflow.

 | 

1\. On first activation, the extension displays a sequence of pop-up tooltips pointing to key UI elements (e.g., "1. Click here to start indexing", "2. Type your search here").<br>2. The tour can be dismissed at any time.<br>3. A setting is stored to ensure the tour does not appear again after being completed or dismissed.

 | 

**2 Weeks**

 |
| 

**Phase 4: UX & Workflow**

 | 

**Sprint 11: Collaboration Features**

 | 

As Devin, I want to share a permalink to a specific search result so my teammates can see exactly what I found.

 | 

1\. Each result card has a "Share" icon.<br>2. Clicking the icon generates a unique URI (e.g., `vscode://<extension-id>/search?resultId=<id>`) and copies it to the clipboard.<br>3. Opening this URI in a browser or chat client focuses VS Code and triggers a command in the extension to fetch and highlight that specific result.

 | 

**2 Weeks**

 |

**5\. Timeline & Sprints**

- **Total Estimated Time:** 4 Weeks
    
- **Sprint 10:** User Onboarding (2 Weeks)
    
- **Sprint 11:** Collaboration Features (2 Weeks)
    

**6\. Risks & Assumptions**

- **Assumption:** The VS Code API provides a robust mechanism for creating custom URI handlers to deep-link into the extension.
    
- **Risk:** An overly intrusive onboarding tour could annoy experienced users.
    
    - **Mitigation:** Ensure the tour is easily dismissible and is clearly marked as a one-time guide for new users.

# Task List: Sprint 10 - User Onboarding

**Goal:** To implement a simple, guided tour for first-time users of the extension.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**10.1**

 | 

☐ To Do

 | 

**Add Onboarding Library:** In `webview-react`, run `npm install shepherd.js` or a similar tour/tooltip library.

 | 

`webview-react/package.json`

 |
| 

**10.2**

 | 

☐ To Do

 | 

**Check First-Time Status:** In `src/extension.ts`'s `activate` function, check a new global state flag (e.g., `context.globalState.get('hasCompletedOnboarding')`).

 | 

`src/extension.ts`

 |
| 

**10.3**

 | 

☐ To Do

 | 

**Signal Tour Start:** If the flag is not set, send a new message `startOnboardingTour` to the webview when it first becomes visible.

 | 

`src/extension.ts`, `src/managers/WebviewManager.ts`

 |
| 

**10.4**

 | 

☐ To Do

 | 

**Define Tour Steps:** In `webview-react/src/App.tsx`, create a `useEffect` hook that listens for the `startOnboardingTour` message.

 | 

`webview-react/src/App.tsx`

 |
| 

**10.5**

 | 

☐ To Do

 | 

**Configure and Start Tour:** Inside the `useEffect`, configure the tour library with steps that attach to the DOM elements of your key UI components (e.g., the index button, the search bar).

 | 

`webview-react/src/App.tsx`

 |
| 

**10.6**

 | 

☐ To Do

 | 

**Handle Tour Completion:** When the tour is completed or dismissed, the tour library's `onComplete` or `onCancel` callback should fire.

 | 

`webview-react/src/App.tsx`

 |
| 

**10.7**

 | 

☐ To Do

 | 

**Set Completion Flag:** In the tour completion callback, `postMessage('onboardingFinished')` back to the extension backend.

 | 

`webview-react/src/App.tsx`

 |
| 

**10.8**

 | 

☐ To Do

 | 

**Persist Completion:** In `src/communication/messageRouter.ts`, add a handler for `onboardingFinished` that sets the `hasCompletedOnboarding` flag to `true` in the extension's global state.

 | 

`src/communication/messageRouter.ts`

 |


# Task List: Sprint 11 - Collaboration Features

**Goal:** To allow users to generate and use deep links to share specific search results.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**11.1**

 | 

☐ To Do

 | 

**Register URI Handler:** In `src/extension.ts`, use `vscode.window.registerUriHandler` to register a handler for your extension's custom URI scheme.

 | 

`src/extension.ts`

 |
| 

**11.2**

 | 

☐ To Do

 | 

**Parse Incoming URIs:** Inside the URI handler, parse the incoming URI to extract parameters, such as the `resultId`.

 | 

`src/extension.ts`

 |
| 

**11.3**

 | 

☐ To Do

 | 

**Implement Deep Link Logic:** The handler should then call a method on the `SearchManager` (e.g., `getResultById(resultId)`) and post a message to the webview to display/highlight that specific result.

 | 

`src/extension.ts`, `src/searchManager.ts`

 |
| 

**11.4**

 | 

☐ To Do

 | 

**Add Share Icon to UI:** In the `ResultCard` component in `webview-react/src/components/QueryView.tsx`, add a "Share" icon button.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**11.5**

 | 

☐ To Do

 | 

**Generate Permalink URI:** Create a `handleShare` function in the `ResultCard`. This function will construct the custom URI string (e.g., `vscode://your-publisher.your-extension/view?resultId=${result.id}`).

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**11.6**

 | 

☐ To Do

 | 

**Copy to Clipboard:** Use `navigator.clipboard.writeText()` within `handleShare` to copy the generated URI to the user's clipboard.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**11.7**

 | 

☐ To Do

 | 

**Provide User Feedback:** Show a brief notification or tooltip (e.g., "Link copied!") after the URI is copied successfully.

 | 

`webview-react/src/components/QueryView.tsx`

 |

Of course. Having reviewed the new PRDs and analyzed the existing codebase, I will now provide a detailed, sprint-by-sprint implementation plan for sprints 8 through 11. This guide includes web research findings, recommended packages, API information, and atomic, sequential code examples to complete the tasks.

-----

### **Sprint 8: Interactive Filtering**

**Objective:** To empower users to refine search results dynamically by filtering on metadata like file type and modification date, leveraging Qdrant's powerful filtering capabilities.

#### **High-Level Plan**

1.  **Augment Indexing Data:** Enhance the indexing process to include file metadata (extension, modification date) in the payload for each vector stored in Qdrant.
2.  **Update Backend Search Logic:** Modify the `SearchManager` to accept filter conditions and translate them into a Qdrant-compatible query structure.
3.  **Develop Frontend Filter UI:** Create a new React component, `FilterPanel.tsx`, to present filtering options to the user.
4.  **Connect UI to Backend:** Wire the `FilterPanel` to the main `QueryView` to trigger new, filtered searches when a user changes a filter setting.

#### **External APIs & Packages**

  * **Qdrant Client (`@qdrant/js-client-rest`)**: We will use the existing client. The key is to add the `filter` property to the search request body. Qdrant's filtering is powerful, supporting conditions like `must`, `should`, and `must_not` on payload fields.
      * [Qdrant Filtering Documentation](https://qdrant.tech/documentation/concepts/filtering/)

#### **Code Examples & Guidance**

##### **1. Update Payload in `src/indexing/indexingService.ts`**

When preparing points for Qdrant, use Node.js's built-in `fs` and `path` modules to add the required metadata.

```typescript
// src/indexing/indexingService.ts
import * as fs from 'fs/promises';
import * as path from 'path';
// ... inside the method that creates Qdrant points ...

const stats = await fs.stat(filePath);
const fileExtension = path.extname(filePath);

const point = {
    id: chunk.id,
    vector: vector,
    payload: {
        content: chunk.content,
        filePath: relativePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        // --- NEW METADATA ---
        fileType: fileExtension,
        lastModified: stats.mtime.getTime(), // Store as Unix timestamp (milliseconds)
    },
};
// Add this point to the batch to be upserted
```

##### **2. Update `src/searchManager.ts` to Handle Filters**

Modify `performSemanticSearch` to accept a `filters` object and build a Qdrant `Filter` query.

```typescript
// src/searchManager.ts
import { QdrantService, SearchResult } from './db/qdrantService';
import { Filter } from '@qdrant/js-client-rest/dist/types/types';

// Define a type for our filters for clarity
export interface SearchFilters {
    fileType?: string;
    dateRange?: { gte?: number; lte?: number }; // gte: greater than or equal
}

export class SearchManager {
    // ... constructor ...

    public async performSemanticSearch(
        query: string,
        filters: SearchFilters = {},
        limit: number = 20
    ): Promise<SearchResult[]> {
        // ... (vector generation logic remains the same) ...

        const qdrantFilter: Filter = this.buildQdrantFilter(filters);

        const searchResults = await this.qdrantService.search(
            collectionName,
            queryVector[0],
            limit,
            qdrantFilter // Pass the constructed filter object
        );

        return searchResults;
    }

    private buildQdrantFilter(filters: SearchFilters): Filter {
        const mustClauses = [];

        if (filters.fileType) {
            mustClauses.push({
                key: 'fileType',
                match: { value: filters.fileType },
            });
        }

        if (filters.dateRange) {
            mustClauses.push({
                key: 'lastModified',
                range: {
                    gte: filters.dateRange.gte,
                    lte: filters.dateRange.lte,
                },
            });
        }

        return { must: mustClauses.length > 0 ? mustClauses : undefined };
    }
}
```

##### **3. Create `webview-react/src/components/FilterPanel.tsx`**

This new component will manage the UI for selecting filters.

```tsx
// webview-react/src/components/FilterPanel.tsx
import React from 'react';
import { Dropdown, Option, DatePicker } from '@fluentui/react-components';

// Assuming you get available file types and the onFilterChange callback via props
export const FilterPanel = ({ availableFileTypes, onFilterChange }) => {

    const handleFileTypeChange = (event, data) => {
        onFilterChange({ fileType: data.optionValue });
    };

    // Date handling would be more complex, this is a simplified example
    const handleDateChange = (date) => {
        // Convert date to timestamp and call onFilterChange
    };

    return (
        <div style={{ display: 'flex', gap: '10px', padding: '10px' }}>
            <Dropdown placeholder="Filter by file type" onOptionSelect={handleFileTypeChange}>
                {availableFileTypes.map((type) => (
                    <Option key={type} value={type}>
                        {type}
                    </Option>
                ))}
            </Dropdown>
            {/* Add DatePicker or other controls for date range */}
        </div>
    );
};
```

-----

### **Sprint 9: Search Quality Feedback**

**Objective:** To create a simple, non-intrusive way for users to provide feedback on search result quality, which can be logged for future analysis.

#### **High-Level Plan**

1.  **Create Backend Service:** Develop a `FeedbackService` responsible for receiving and logging feedback events.
2.  **Expose Endpoint:** Add a new command to the `MessageRouter` to handle incoming feedback from the UI.
3.  **Add UI Elements:** Integrate "thumbs up" and "thumbs down" icons into the `ResultCard` component.
4.  **Implement Frontend Logic:** When an icon is clicked, send the relevant data to the backend and provide visual confirmation to the user.

#### **External APIs & Packages**

No new external packages are strictly necessary. We will use the existing `CentralizedLoggingService` to write feedback to a dedicated log file.

#### **Code Examples & Guidance**

##### **1. Create `src/feedback/feedbackService.ts`**

This service will format and log the feedback data.

```typescript
// src/feedback/feedbackService.ts
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';

export interface FeedbackData {
    timestamp: string;
    query: string;
    resultId: string;
    filePath: string;
    feedback: 'positive' | 'negative';
}

export class FeedbackService {
    constructor(private logger: CentralizedLoggingService) {}

    public logFeedback(data: Omit<FeedbackData, 'timestamp'>): void {
        const feedbackEntry: FeedbackData = {
            ...data,
            timestamp: new Date().toISOString(),
        };
        // Use a specific channel or prefix for feedback logs
        this.logger.log('FEEDBACK', JSON.stringify(feedbackEntry));
    }
}
```

##### **2. Add Feedback Icons to `webview-react/src/components/QueryView.tsx`**

Update the `ResultCard` to include the feedback mechanism.

```tsx
// webview-react/src/components/QueryView.tsx
import React, { useState } from 'react';
import { Button } from '@fluentui/react-components';
import { ThumbLike20Regular, ThumbDislike20Regular } from '@fluentui/react-icons';
import { postMessage } from '../utils/vscodeApi';

const ResultCard = ({ result, query }) => {
    const [feedbackSent, setFeedbackSent] = useState(false);

    const handleFeedback = (feedbackType: 'positive' | 'negative') => {
        if (feedbackSent) return;

        postMessage('submitFeedback', {
            query: query,
            resultId: result.id,
            filePath: result.payload.filePath,
            feedback: feedbackType,
        });
        setFeedbackSent(true);
    };

    return (
        <Card>
            {/* ... CardHeader ... */}
            <div style={{ opacity: feedbackSent ? 0.5 : 1 }}>
                <Button icon={<ThumbLike20Regular />} onClick={() => handleFeedback('positive')} disabled={feedbackSent} />
                <Button icon={<ThumbDislike20Regular />} onClick={() => handleFeedback('negative')} disabled={feedbackSent} />
            </div>
        </Card>
    );
};
```

-----

### **Sprint 10: User Onboarding**

**Objective:** To implement a guided tour for first-time users to improve activation and understanding of the extension's core features.

#### **External APIs & Packages**

  * **`shepherd.js`**: A lightweight and highly customizable library for creating product tours. It's well-suited for our needs.
      * **Installation**: `npm install shepherd.js`
      * [Shepherd.js Documentation](https://shepherdjs.dev/)

#### **Code Examples & Guidance**

##### **1. Create `webview-react/src/services/onboardingService.ts`**

Encapsulate the tour logic in a dedicated service.

```typescript
// webview-react/src/services/onboardingService.ts
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export const initTour = (onComplete: () => void) => {
    const tour = new Shepherd.Tour({
        defaultStepOptions: {
            classes: 'shepherd-theme-arrows',
            cancelIcon: { enabled: true },
        },
        useModalOverlay: true,
    });

    tour.addStep({
        id: 'step-1-index',
        text: 'Welcome! First, click here to index your workspace so we can start searching.',
        attachTo: { element: '#index-button', on: 'bottom' }, // Use a real ID from your component
        buttons: [{ text: 'Next', action: tour.next }],
    });

    tour.addStep({
        id: 'step-2-search',
        text: 'Great! Now you can type a search query here. Try searching for concepts, not just keywords.',
        attachTo: { element: '#search-input', on: 'bottom' },
        buttons: [{ text: 'Finish', action: tour.complete }],
    });

    tour.on('complete', onComplete);
    tour.on('cancel', onComplete);

    tour.start();
};
```

##### **2. Trigger Tour in `webview-react/src/App.tsx`**

Listen for a message from the backend to start the tour.

```tsx
// webview-react/src/App.tsx
import React, { useEffect } from 'react';
import { onMessageCommand, postMessage } from './utils/vscodeApi';
import { initTour } from './services/onboardingService';

function App() {
    useEffect(() => {
        const unsubscribe = onMessageCommand('startOnboardingTour', () => {
            initTour(() => {
                // This callback is fired when the tour is finished or cancelled
                postMessage('onboardingFinished');
            });
        });

        // Tell the backend the webview is ready to potentially receive the tour command
        postMessage('webviewReady');

        return () => unsubscribe();
    }, []);

    // ... rest of App component
}
```

-----

### **Sprint 11: Collaboration Features**

**Objective:** To allow users to share deep links to specific search results, enhancing team collaboration.

#### **External APIs & Packages**

  * **VS Code API (`vscode`)**: We will use two key parts of the API:
      * `vscode.window.registerUriHandler`: To register a handler that VS Code will invoke when a custom URI like `vscode://...` is opened.
      * `vscode.env.clipboard`: To programmatically write the generated link to the user's clipboard.

#### **Code Examples & Guidance**

##### **1. Register URI Handler in `src/extension.ts`**

In the `activate` function, set up the handler to process incoming deep links.

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { WebviewManager } from './managers/WebviewManager'; // Assume you have this

export function activate(context: vscode.ExtensionContext) {
    const webviewManager = new WebviewManager(...);

    const uriHandler = {
        handleUri(uri: vscode.Uri) {
            console.log(`Received URI: ${uri.toString()}`);
            const params = new URLSearchParams(uri.query);
            const resultId = params.get('resultId');

            if (resultId) {
                // Focus the webview and tell it to highlight the result
                webviewManager.focusAndShowResult(resultId);
            }
        }
    };

    context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));
}
```

##### **2. Implement `handleShare` in `webview-react/src/components/QueryView.tsx`**

Generate the link and copy it to the clipboard.

```tsx
// webview-react/src/components/QueryView.tsx
import { Button, Tooltip } from '@fluentui/react-components';
import { Share20Regular } from '@fluentui/react-icons';
import { postMessage } from '../utils/vscodeApi';

const ResultCard = ({ result }) => {
    const handleShare = () => {
        // IMPORTANT: The extension ID must match what's in your package.json
        const extensionId = 'your-publisher.your-extension-name';
        const link = `vscode://${extensionId}/view?resultId=${result.id}`;

        // This command will be handled by the backend to use the VS Code API
        postMessage('copyToClipboard', { text: link });
    };

    return (
        <Card>
            {/* ... CardHeader ... */}
            <Tooltip content="Copy link to result" relationship="label">
                <Button icon={<Share20Regular />} onClick={handleShare} />
            </Tooltip>
        </Card>
    );
};
```

##### **3. Add `copyToClipboard` handler in `src/communication/messageRouter.ts`**

The webview cannot access `vscode.env.clipboard` directly, so it must ask the extension backend to do it.

```typescript
// src/communication/messageRouter.ts
import * as vscode from 'vscode';

// In the switch statement for message handling:

case 'copyToClipboard':
    try {
        await vscode.env.clipboard.writeText(payload.text);
        // Optionally send a success message back to the UI to show a notification
        vscode.window.showInformationMessage('Link copied to clipboard!');
    } catch (error) {
        vscode.window.showErrorMessage('Failed to copy link.');
    }
    break;
```