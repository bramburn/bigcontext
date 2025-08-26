/**
 * App Store Unit Tests
 * 
 * Tests for the centralized application state management stores.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
	appState,
	setupState,
	indexingState,
	searchState,
	appActions,
	setupActions,
	indexingActions,
	searchActions,
	isSetupComplete,
	canStartIndexing,
	hasSearchResults,
	currentError,
	resetAllState
} from './appStore';

describe('App Store', () => {
	beforeEach(() => {
		// Reset all state before each test
		resetAllState();
	});

	describe('appState', () => {
		it('should have correct initial state', () => {
			const state = get(appState);
			expect(state).toEqual({
				isInitialized: false,
				isLoading: false,
				error: null,
				lastActivity: null
			});
		});

		it('should initialize correctly', () => {
			appActions.initialize();
			const state = get(appState);
			
			expect(state.isInitialized).toBe(true);
			expect(state.lastActivity).toBeInstanceOf(Date);
		});

		it('should set loading state', () => {
			appActions.setLoading(true);
			expect(get(appState).isLoading).toBe(true);
			
			appActions.setLoading(false);
			expect(get(appState).isLoading).toBe(false);
		});

		it('should set and clear errors', () => {
			const errorMessage = 'Test error';
			appActions.setError(errorMessage);
			expect(get(appState).error).toBe(errorMessage);
			
			appActions.clearError();
			expect(get(appState).error).toBe(null);
		});

		it('should update activity timestamp', () => {
			const beforeTime = Date.now();
			appActions.updateActivity();
			const afterTime = Date.now();
			
			const lastActivity = get(appState).lastActivity;
			expect(lastActivity).toBeInstanceOf(Date);
			expect(lastActivity!.getTime()).toBeGreaterThanOrEqual(beforeTime);
			expect(lastActivity!.getTime()).toBeLessThanOrEqual(afterTime);
		});
	});

	describe('setupState', () => {
		it('should have correct initial state', () => {
			const state = get(setupState);
			expect(state).toEqual({
				databaseStatus: 'idle',
				providerStatus: 'idle',
				selectedDatabase: '',
				selectedProvider: '',
				isSetupComplete: false,
				setupErrors: []
			});
		});

		it('should update database status', () => {
			setupActions.setDatabaseStatus('starting');
			expect(get(setupState).databaseStatus).toBe('starting');
			
			setupActions.setDatabaseStatus('ready');
			expect(get(setupState).databaseStatus).toBe('ready');
		});

		it('should update provider status', () => {
			setupActions.setProviderStatus('starting');
			expect(get(setupState).providerStatus).toBe('starting');
			
			setupActions.setProviderStatus('ready');
			expect(get(setupState).providerStatus).toBe('ready');
		});

		it('should update selected database and reset status', () => {
			setupActions.setDatabaseStatus('ready');
			setupActions.setSelectedDatabase('qdrant');
			
			const state = get(setupState);
			expect(state.selectedDatabase).toBe('qdrant');
			expect(state.databaseStatus).toBe('idle');
		});

		it('should manage setup errors', () => {
			const error1 = 'Database connection failed';
			const error2 = 'Provider authentication failed';
			
			setupActions.addSetupError(error1);
			expect(get(setupState).setupErrors).toEqual([error1]);
			
			setupActions.addSetupError(error2);
			expect(get(setupState).setupErrors).toEqual([error1, error2]);
			
			setupActions.clearSetupErrors();
			expect(get(setupState).setupErrors).toEqual([]);
		});
	});

	describe('indexingState', () => {
		it('should have correct initial state', () => {
			const state = get(indexingState);
			expect(state.isIndexing).toBe(false);
			expect(state.progress).toBe(0);
			expect(state.message).toBe('Ready to start indexing...');
			expect(state.filesProcessed).toBe(0);
			expect(state.totalFiles).toBe(0);
			expect(state.currentFile).toBe('');
		});

		it('should start indexing', () => {
			const beforeTime = Date.now();
			indexingActions.startIndexing();
			const afterTime = Date.now();
			
			const state = get(indexingState);
			expect(state.isIndexing).toBe(true);
			expect(state.progress).toBe(0);
			expect(state.message).toBe('Starting indexing process...');
			expect(state.stats.startTime).toBeInstanceOf(Date);
			expect(state.stats.startTime!.getTime()).toBeGreaterThanOrEqual(beforeTime);
			expect(state.stats.startTime!.getTime()).toBeLessThanOrEqual(afterTime);
		});

		it('should update progress', () => {
			indexingActions.updateProgress(50, 'Processing files...', 25, 50, 'test.js');
			
			const state = get(indexingState);
			expect(state.progress).toBe(50);
			expect(state.message).toBe('Processing files...');
			expect(state.filesProcessed).toBe(25);
			expect(state.totalFiles).toBe(50);
			expect(state.currentFile).toBe('test.js');
		});

		it('should complete indexing successfully', () => {
			indexingActions.startIndexing();
			indexingActions.completeIndexing(true, 100);
			
			const state = get(indexingState);
			expect(state.isIndexing).toBe(false);
			expect(state.progress).toBe(100);
			expect(state.message).toBe('Indexing completed successfully!');
			expect(state.totalFiles).toBe(100);
		});

		it('should handle indexing failure', () => {
			indexingActions.startIndexing();
			indexingActions.completeIndexing(false);
			
			const state = get(indexingState);
			expect(state.isIndexing).toBe(false);
			expect(state.message).toBe('Indexing failed.');
		});

		it('should stop indexing', () => {
			indexingActions.startIndexing();
			indexingActions.stopIndexing();
			
			const state = get(indexingState);
			expect(state.isIndexing).toBe(false);
			expect(state.message).toBe('Indexing stopped by user.');
		});
	});

	describe('searchState', () => {
		it('should have correct initial state', () => {
			const state = get(searchState);
			expect(state.query).toBe('');
			expect(state.isSearching).toBe(false);
			expect(state.results).toEqual([]);
			expect(state.history).toEqual([]);
		});

		it('should set query', () => {
			searchActions.setQuery('test query');
			expect(get(searchState).query).toBe('test query');
		});

		it('should start search', () => {
			searchActions.setResults([{ id: '1', file: 'test.js', content: 'test', score: 0.9 }], {
				totalResults: 1,
				searchTime: 100,
				query: 'test'
			});
			
			searchActions.startSearch();
			const state = get(searchState);
			expect(state.isSearching).toBe(true);
			expect(state.results).toEqual([]);
		});

		it('should set search results and update history', () => {
			const results = [
				{ id: '1', file: 'test.js', content: 'test content', score: 0.9 },
				{ id: '2', file: 'app.js', content: 'app content', score: 0.8 }
			];
			const stats = {
				totalResults: 2,
				searchTime: 150,
				query: 'test query'
			};

			searchActions.setQuery('test query');
			searchActions.setResults(results, stats);
			
			const state = get(searchState);
			expect(state.isSearching).toBe(false);
			expect(state.results).toEqual(results);
			expect(state.stats).toEqual(stats);
			expect(state.history).toContain('test query');
		});

		it('should not duplicate queries in history', () => {
			searchActions.setQuery('test query');
			searchActions.setResults([], { totalResults: 0, searchTime: 100, query: 'test query' });
			searchActions.setResults([], { totalResults: 0, searchTime: 100, query: 'test query' });
			
			const state = get(searchState);
			expect(state.history.filter(q => q === 'test query')).toHaveLength(1);
		});

		it('should limit history to 10 items', () => {
			for (let i = 0; i < 15; i++) {
				searchActions.setQuery(`query ${i}`);
				searchActions.setResults([], { totalResults: 0, searchTime: 100, query: `query ${i}` });
			}
			
			const state = get(searchState);
			expect(state.history).toHaveLength(10);
			expect(state.history[0]).toBe('query 14'); // Most recent first
		});
	});

	describe('Derived Stores', () => {
		it('isSetupComplete should be true when both database and provider are ready', () => {
			expect(get(isSetupComplete)).toBe(false);
			
			setupActions.setDatabaseStatus('ready');
			expect(get(isSetupComplete)).toBe(false);
			
			setupActions.setProviderStatus('ready');
			expect(get(isSetupComplete)).toBe(true);
		});

		it('canStartIndexing should be true when setup is complete and not indexing', () => {
			expect(get(canStartIndexing)).toBe(false);
			
			setupActions.setDatabaseStatus('ready');
			setupActions.setProviderStatus('ready');
			expect(get(canStartIndexing)).toBe(true);
			
			indexingActions.startIndexing();
			expect(get(canStartIndexing)).toBe(false);
		});

		it('hasSearchResults should reflect search results state', () => {
			expect(get(hasSearchResults)).toBe(false);
			
			searchActions.setResults([{ id: '1', file: 'test.js', content: 'test', score: 0.9 }], {
				totalResults: 1,
				searchTime: 100,
				query: 'test'
			});
			expect(get(hasSearchResults)).toBe(true);
		});

		it('currentError should return the first available error', () => {
			expect(get(currentError)).toBe(null);
			
			appActions.setError('App error');
			expect(get(currentError)).toBe('App error');
			
			appActions.clearError();
			setupActions.addSetupError('Setup error');
			expect(get(currentError)).toBe('Setup error');
		});
	});

	describe('resetAllState', () => {
		it('should reset all stores to initial state', () => {
			// Modify all stores
			appActions.initialize();
			appActions.setError('Test error');
			setupActions.setDatabaseStatus('ready');
			setupActions.setSelectedDatabase('qdrant');
			indexingActions.startIndexing();
			searchActions.setQuery('test');
			
			// Reset all state
			resetAllState();
			
			// Verify all stores are back to initial state
			expect(get(appState).isInitialized).toBe(false);
			expect(get(appState).error).toBe(null);
			expect(get(setupState).databaseStatus).toBe('idle');
			expect(get(setupState).selectedDatabase).toBe('');
			expect(get(indexingState).isIndexing).toBe(false);
			expect(get(searchState).query).toBe('');
		});
	});
});
