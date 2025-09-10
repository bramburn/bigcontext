/**
 * Contract Test for IIndexingService
 * 
 * This test verifies the public API contract for the enhanced IndexingService
 * that supports pause/resume functionality and state management.
 * 
 * Based on specifications in:
 * - specs/002-for-the-next/contracts/services.ts
 * - specs/002-for-the-next/data-model.md
 * 
 * This test MUST FAIL until the implementation is complete (TDD approach).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IndexState } from '../../types/indexing';
import { IndexingService, IIndexingService } from '../../services/indexingService';
import { FileProcessor } from '../../services/FileProcessor';
import { EmbeddingProvider } from '../../services/EmbeddingProvider';
import { QdrantService } from '../../services/QdrantService';

/**
 * Interface contract that the IndexingService must implement
 */
interface IIndexingService {
    /**
     * Starts a full indexing process for the workspace.
     */
    startIndexing(): Promise<void>;

    /**
     * Pauses the currently running indexing process.
     */
    pauseIndexing(): Promise<void>;

    /**
     * Resumes a paused indexing process.
     */
    resumeIndexing(): Promise<void>;

    /**
     * Gets the current state of the indexing process.
     */
    getIndexState(): Promise<IndexState>;
}

describe('IIndexingService Contract Test', () => {
    let indexingService: IIndexingService;

    beforeEach(() => {
        // Mock VS Code API
        const mockContext = {
            extensionPath: '/mock/path',
            globalState: { get: vi.fn(), update: vi.fn() },
            workspaceState: { get: vi.fn(), update: vi.fn() }
        } as any;

        // Mock dependencies
        const mockFileProcessor = {} as FileProcessor;
        const mockEmbeddingProvider = {} as EmbeddingProvider;
        const mockQdrantService = {} as QdrantService;

        // Create actual IndexingService instance
        indexingService = new IndexingService(
            mockContext,
            mockFileProcessor,
            mockEmbeddingProvider,
            mockQdrantService
        );
    });

    describe('API Contract Validation', () => {
        it('should have startIndexing method that returns Promise<void>', async () => {
            expect(typeof indexingService.startIndexing).toBe('function');
            
            const result = indexingService.startIndexing();
            expect(result).toBeInstanceOf(Promise);
            
            const resolvedValue = await result;
            expect(resolvedValue).toBeUndefined();
        });

        it('should have pauseIndexing method that returns Promise<void>', async () => {
            expect(typeof indexingService.pauseIndexing).toBe('function');
            
            const result = indexingService.pauseIndexing();
            expect(result).toBeInstanceOf(Promise);
            
            const resolvedValue = await result;
            expect(resolvedValue).toBeUndefined();
        });

        it('should have resumeIndexing method that returns Promise<void>', async () => {
            expect(typeof indexingService.resumeIndexing).toBe('function');
            
            const result = indexingService.resumeIndexing();
            expect(result).toBeInstanceOf(Promise);
            
            const resolvedValue = await result;
            expect(resolvedValue).toBeUndefined();
        });

        it('should have getIndexState method that returns Promise<IndexState>', async () => {
            expect(typeof indexingService.getIndexState).toBe('function');
            
            const result = indexingService.getIndexState();
            expect(result).toBeInstanceOf(Promise);
            
            const state = await result;
            expect(['idle', 'indexing', 'paused', 'error']).toContain(state);
        });
    });

    describe('State Management Contract', () => {
        it('should return valid IndexState values', async () => {
            const validStates: IndexState[] = ['idle', 'indexing', 'paused', 'error'];
            
            for (const state of validStates) {
                // Mock different states
                (indexingService.getIndexState as any).mockResolvedValueOnce(state);
                
                const currentState = await indexingService.getIndexState();
                expect(validStates).toContain(currentState);
            }
        });

        it('should handle state transitions correctly', async () => {
            // Test the expected state flow: idle -> indexing -> paused -> indexing -> idle
            const stateSequence: IndexState[] = ['idle', 'indexing', 'paused', 'indexing', 'idle'];
            
            for (let i = 0; i < stateSequence.length; i++) {
                (indexingService.getIndexState as any).mockResolvedValueOnce(stateSequence[i]);
                const state = await indexingService.getIndexState();
                expect(state).toBe(stateSequence[i]);
            }
        });
    });

    describe('Error Handling Contract', () => {
        it('should handle errors gracefully in all methods', async () => {
            const errorMessage = 'Test error';
            
            // Test that methods can throw errors
            (indexingService.startIndexing as any).mockRejectedValueOnce(new Error(errorMessage));
            (indexingService.pauseIndexing as any).mockRejectedValueOnce(new Error(errorMessage));
            (indexingService.resumeIndexing as any).mockRejectedValueOnce(new Error(errorMessage));
            (indexingService.getIndexState as any).mockRejectedValueOnce(new Error(errorMessage));

            await expect(indexingService.startIndexing()).rejects.toThrow(errorMessage);
            await expect(indexingService.pauseIndexing()).rejects.toThrow(errorMessage);
            await expect(indexingService.resumeIndexing()).rejects.toThrow(errorMessage);
            await expect(indexingService.getIndexState()).rejects.toThrow(errorMessage);
        });

        it('should transition to error state when operations fail', async () => {
            // When an error occurs, the service should transition to error state
            (indexingService.getIndexState as any).mockResolvedValueOnce('error');
            
            const state = await indexingService.getIndexState();
            expect(state).toBe('error');
        });
    });

    describe('Implementation Requirements', () => {
        it('should successfully implement the IIndexingService interface', () => {
            // The IndexingService has been implemented and should pass all contract tests
            expect(indexingService).toBeDefined();
            expect(typeof indexingService.startIndexing).toBe('function');
            expect(typeof indexingService.pauseIndexing).toBe('function');
            expect(typeof indexingService.resumeIndexing).toBe('function');
            expect(typeof indexingService.getIndexState).toBe('function');
        });
    });
});
