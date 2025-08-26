/**
 * Test Setup Configuration
 * 
 * Global test setup for Vitest, including DOM environment setup,
 * mock configurations, and test utilities.
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock VS Code API
const mockVSCodeApi = {
	postMessage: vi.fn(),
	setState: vi.fn(),
	getState: vi.fn(() => null)
};

// Mock window.acquireVsCodeApi
Object.defineProperty(window, 'acquireVsCodeApi', {
	value: () => mockVSCodeApi,
	writable: true
});

// Mock performance API if not available
if (!global.performance) {
	global.performance = {
		now: vi.fn(() => Date.now()),
		mark: vi.fn(),
		measure: vi.fn(),
		clearMarks: vi.fn(),
		clearMeasures: vi.fn(),
		getEntriesByType: vi.fn(() => []),
		getEntriesByName: vi.fn(() => [])
	} as any;
}

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock CSS custom properties
Object.defineProperty(document.documentElement.style, 'setProperty', {
	value: vi.fn(),
	writable: true
});

// Mock Fluent UI web components
vi.mock('@fluentui/web-components', () => ({
	provideFluentDesignSystem: vi.fn(() => ({
		register: vi.fn()
	})),
	fluentButton: vi.fn(),
	fluentTextField: vi.fn(),
	fluentSelect: vi.fn(),
	fluentOption: vi.fn(),
	fluentProgressRing: vi.fn(),
	fluentCard: vi.fn(),
	fluentBadge: vi.fn(),
	fluentAccordion: vi.fn(),
	fluentAccordionItem: vi.fn()
}));

// Global test utilities
export const testUtils = {
	mockVSCodeApi,
	
	// Helper to wait for next tick
	nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
	
	// Helper to wait for component updates
	waitForUpdate: () => new Promise(resolve => setTimeout(resolve, 10)),
	
	// Helper to create mock events
	createMockEvent: (type: string, properties: Record<string, any> = {}) => {
		const event = new Event(type, { bubbles: true, cancelable: true });
		Object.assign(event, properties);
		return event;
	},
	
	// Helper to create mock input events
	createMockInputEvent: (value: string) => {
		const event = new Event('input', { bubbles: true });
		Object.defineProperty(event, 'target', {
			value: { value },
			enumerable: true
		});
		return event;
	},
	
	// Helper to create mock change events
	createMockChangeEvent: (value: string) => {
		const event = new Event('change', { bubbles: true });
		Object.defineProperty(event, 'target', {
			value: { value },
			enumerable: true
		});
		return event;
	}
};

// Make test utilities globally available
(global as any).testUtils = testUtils;
