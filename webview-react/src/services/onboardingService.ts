/**
 * OnboardingService - Service for managing user onboarding tours
 * 
 * This service provides guided tours for first-time users using Shepherd.js,
 * helping them understand the core features of the code context engine.
 */

import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export interface TourStep {
  id: string;
  title: string;
  text: string;
  attachTo?: {
    element: string;
    on: string;
  };
  buttons?: Array<{
    text: string;
    action: () => void;
    classes?: string;
  }>;
}

/**
 * Initializes and starts the onboarding tour
 * 
 * @param onComplete - Callback function called when tour is completed or cancelled
 * @returns The Shepherd tour instance
 */
export const initTour = (onComplete: () => void): any => {
  const tour = new Shepherd.Tour({
    defaultStepOptions: {
      classes: 'shepherd-theme-arrows',
      cancelIcon: {
        enabled: true,
      },
      scrollTo: {
        behavior: 'smooth',
        block: 'center'
      }
    },
    useModalOverlay: true,
  });

  // Step 1: Welcome
  tour.addStep({
    id: 'welcome',
    title: 'Welcome to Code Context Engine!',
    text: `
      <p>This guided tour will help you get started with semantic code search.</p>
      <p>You can dismiss this tour at any time by clicking the × button.</p>
    `,
    buttons: [
      {
        text: 'Skip Tour',
        action: tour.cancel,
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Start Tour',
        action: tour.next
      }
    ]
  });

  // Step 2: Search Input
  tour.addStep({
    id: 'search-input',
    title: 'Search Your Code',
    text: `
      <p>Type your search query here using natural language.</p>
      <p>For example: "function that handles user authentication" or "error handling in API calls"</p>
    `,
    attachTo: {
      element: '[data-tour="search-input"]',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Next',
        action: tour.next
      }
    ]
  });

  // Step 3: Filter Panel
  tour.addStep({
    id: 'filters',
    title: 'Filter Your Results',
    text: `
      <p>Use filters to narrow down your search results by file type or modification date.</p>
      <p>This helps you find exactly what you're looking for in large codebases.</p>
    `,
    attachTo: {
      element: '[data-tour="filter-panel"]',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Next',
        action: tour.next
      }
    ]
  });

  // Step 4: Search Results
  tour.addStep({
    id: 'results',
    title: 'Review Search Results',
    text: `
      <p>Search results show relevant code snippets with similarity scores.</p>
      <p>Click on any result to open the file at the specific line.</p>
      <p>Use the feedback buttons to help improve search quality!</p>
    `,
    attachTo: {
      element: '[data-tour="results-section"]',
      on: 'top'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Next',
        action: tour.next
      }
    ]
  });

  // Step 5: Getting Started
  tour.addStep({
    id: 'getting-started',
    title: 'Ready to Get Started!',
    text: `
      <p>You're all set! Here are some tips:</p>
      <ul>
        <li>Use descriptive, natural language queries</li>
        <li>Try different phrasings if you don't find what you're looking for</li>
        <li>Use filters to narrow down results in large projects</li>
        <li>Provide feedback to help improve search quality</li>
      </ul>
      <p>Happy searching!</p>
    `,
    buttons: [
      {
        text: 'Back',
        action: tour.back,
        classes: 'shepherd-button-secondary'
      },
      {
        text: 'Finish',
        action: tour.complete
      }
    ]
  });

  // Set up event handlers
  tour.on('complete', onComplete);
  tour.on('cancel', onComplete);

  return tour;
};

/**
 * Starts the onboarding tour
 * 
 * @param onComplete - Callback function called when tour is completed or cancelled
 */
export const startOnboardingTour = (onComplete: () => void): void => {
  const tour = initTour(onComplete);
  
  // Small delay to ensure DOM elements are ready
  setTimeout(() => {
    tour.start();
  }, 100);
};

/**
 * Checks if required tour elements are present in the DOM
 * 
 * @returns true if all required elements are present
 */
export const checkTourElementsReady = (): boolean => {
  const requiredElements = [
    '[data-tour="search-input"]',
    '[data-tour="filter-panel"]'
  ];

  return requiredElements.every(selector => {
    const element = document.querySelector(selector);
    return element !== null;
  });
};

/**
 * Waits for tour elements to be ready, then starts the tour
 * 
 * @param onComplete - Callback function called when tour is completed or cancelled
 * @param maxWaitTime - Maximum time to wait for elements (in milliseconds)
 */
export const startTourWhenReady = (
  onComplete: () => void, 
  maxWaitTime: number = 5000
): void => {
  const startTime = Date.now();
  
  const checkAndStart = () => {
    if (checkTourElementsReady()) {
      startOnboardingTour(onComplete);
    } else if (Date.now() - startTime < maxWaitTime) {
      // Check again in 100ms
      setTimeout(checkAndStart, 100);
    } else {
      console.warn('OnboardingService: Tour elements not ready within timeout, starting anyway');
      startOnboardingTour(onComplete);
    }
  };
  
  checkAndStart();
};
