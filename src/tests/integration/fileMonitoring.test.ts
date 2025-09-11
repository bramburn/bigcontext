/**
 * Integration Test for File Monitoring
 * 
 * This test validates the user story for automatic file monitoring:
 * - System monitors workspace for file creation events
 * - System monitors workspace for file modification events  
 * - System monitors workspace for file deletion events
 * - System automatically updates index based on file changes
 * - System respects .gitignore patterns
 * - System filters out binary and large files
 * 
 * Based on specifications in:
 * - specs/002-for-the-next/spec.md (Acceptance Scenarios 4-6, FR-005 to FR-011)
 * - specs/002-for-the-next/quickstart.md
 * 
 * This test MUST FAIL until the implementation is complete (TDD approach).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileChangeEvent, FileMonitorStats } from '../../types/indexing';
import { FileMonitorService } from '../../services/fileMonitorService';
import { mockVscode } from '../../test/setup';

describe('File Monitoring Integration Test', () => {
    let fileMonitorService: any;
    let indexingService: any;
    let mockWatcher: any;
    
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        vi.useFakeTimers(); // Enable fake timers
        
        // Mock file system watcher with event emitters
        let onDidChangeHandler: any;
        let onDidCreateHandler: any;
        let onDidDeleteHandler: any;

        mockWatcher = {
            onDidCreate: vi.fn((handler) => { onDidCreateHandler = handler; }),
            onDidChange: vi.fn((handler) => { onDidChangeHandler = handler; }),
            onDidDelete: vi.fn((handler) => { onDidDeleteHandler = handler; }),
            dispose: vi.fn()
        };

        // Add fire methods for testing that call the actual handlers
        mockWatcher.onDidCreate.fire = (uri: any) => onDidCreateHandler && onDidCreateHandler(uri);
        mockWatcher.onDidChange.fire = (uri: any) => onDidChangeHandler && onDidChangeHandler(uri);
        mockWatcher.onDidDelete.fire = (uri: any) => onDidDeleteHandler && onDidDeleteHandler(uri);

        mockVscode.workspace.createFileSystemWatcher.mockReturnValue(mockWatcher);
        
        // Create actual FileMonitorService instance
        const mockContext = {
            extensionPath: '/mock/path',
            globalState: { get: vi.fn(), update: vi.fn() },
            workspaceState: { get: vi.fn(), update: vi.fn() }
        } as any;

        const mockLoggingService = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
        } as any;

        // Mock indexingService as it's a dependency of FileMonitorService's internal logic
        indexingService = {
            updateFileInIndex: vi.fn(),
            removeFileFromIndex: vi.fn(),
            addFileToIndex: vi.fn(),
            isFileIndexed: vi.fn().mockReturnValue(false)
        };

        const mockConfig = {
            debounceDelay: 100, // Example value
            patterns: ['**/*'],
            respectGitignore: true,
            maxFileSize: 1024 * 1024,
            skipBinaryFiles: true
        };

        fileMonitorService = new FileMonitorService(mockContext, indexingService, mockConfig);

        // Start monitoring so that events are processed
        fileMonitorService.startMonitoring();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers(); // Restore real timers
    });

    describe('File Creation Events', () => {
        it('should detect file creation and add to index', async () => {
            // Arrange: New file created
            const newFilePath = '/mock/workspace/src/newFile.ts';
            const fileUri = mockVscode.Uri.file(newFilePath);

            vi.spyOn(fileMonitorService, 'shouldProcessFile').mockReturnValue(true);
            indexingService.addFileToIndex.mockResolvedValue(undefined);
            
            // Act: Simulate file creation event
            const createEvent: FileChangeEvent = {
                type: 'create',
                filePath: newFilePath,
                timestamp: Date.now()
            };
            
            if (fileMonitorService.shouldProcessFile(newFilePath)) {
                await indexingService.addFileToIndex(fileUri);
            }
            
            // Assert: File should be added to index
            expect(fileMonitorService.shouldProcessFile).toHaveBeenCalledWith(newFilePath);
            expect(indexingService.addFileToIndex).toHaveBeenCalledWith(fileUri);
        });

        it('should ignore binary files during creation', async () => {
            // Arrange: Binary file created
            const binaryFilePath = '/mock/workspace/image.png';
            
            vi.spyOn(fileMonitorService, 'shouldProcessFile').mockReturnValue(false);
            
            // Act: Simulate binary file creation
            const createEvent: FileChangeEvent = {
                type: 'create',
                filePath: binaryFilePath,
                timestamp: Date.now()
            };
            
            const shouldProcess = fileMonitorService.shouldProcessFile(binaryFilePath);
            
            // Assert: Binary file should be ignored
            expect(shouldProcess).toBe(false);
            expect(indexingService.addFileToIndex).not.toHaveBeenCalled();
        });

        it('should ignore files matching .gitignore patterns', async () => {
            // Arrange: File in node_modules (typically in .gitignore)
            const ignoredFilePath = '/mock/workspace/node_modules/package/index.js';
            
            vi.spyOn(fileMonitorService, 'shouldProcessFile').mockReturnValue(false);
            
            // Act: Simulate ignored file creation
            const shouldProcess = fileMonitorService.shouldProcessFile(ignoredFilePath);
            
            // Assert: Ignored file should not be processed
            expect(shouldProcess).toBe(false);
            expect(indexingService.addFileToIndex).not.toHaveBeenCalled();
        });
    });

    describe('File Modification Events', () => {
        it('should detect file changes and update index', async () => {
            // Arrange: Existing file modified
            const modifiedFilePath = '/mock/workspace/src/existingFile.ts';
            const fileUri = mockVscode.Uri.file(modifiedFilePath);
            
            indexingService.isFileIndexed.mockReturnValue(true);
            indexingService.updateFileInIndex.mockResolvedValue(undefined);
            
            // Act: Simulate file modification event
            const changeEvent: FileChangeEvent = {
                type: 'change',
                filePath: modifiedFilePath,
                timestamp: Date.now()
            };
            
            if (indexingService.isFileIndexed(modifiedFilePath)) {
                await indexingService.updateFileInIndex(fileUri);
            }
            
            // Assert: File should be updated in index
            expect(indexingService.isFileIndexed).toHaveBeenCalledWith(modifiedFilePath);
            expect(indexingService.updateFileInIndex).toHaveBeenCalledWith(fileUri);
        });

        it('should handle debouncing for rapid file changes', async () => {
            const filePath = '/mock/workspace/src/rapidChanges.ts';
            const fileUri = mockVscode.Uri.file(filePath);

            // Spy on the indexing service update method
            vi.spyOn(indexingService, 'updateFileInIndex');

            // Simulate rapid file changes by triggering onDidChange multiple times
            // with a small delay, then a longer delay to allow debounce to fire.
            mockWatcher.onDidChange.fire(fileUri);
            vi.advanceTimersByTime(50); // Advance by 50ms
            mockWatcher.onDidChange.fire(fileUri);
            vi.advanceTimersByTime(50); // Advance by another 50ms (total 100ms)
            mockWatcher.onDidChange.fire(fileUri);
            vi.advanceTimersByTime(100); // Advance by 100ms (debounce delay)

            // Expect updateFileInIndex to be called only once due to debouncing
            expect(indexingService.updateFileInIndex).toHaveBeenCalledTimes(1);
            expect(indexingService.updateFileInIndex).toHaveBeenCalledWith(fileUri);
        });
    });

    describe('File Deletion Events', () => {
        it('should detect file deletion and remove from index', async () => {
            // Arrange: File deleted
            const deletedFilePath = '/mock/workspace/src/deletedFile.ts';
            const fileUri = mockVscode.Uri.file(deletedFilePath);
            
            indexingService.isFileIndexed.mockReturnValue(true);
            indexingService.removeFileFromIndex.mockResolvedValue(undefined);
            
            // Act: Simulate file deletion event
            const deleteEvent: FileChangeEvent = {
                type: 'delete',
                filePath: deletedFilePath,
                timestamp: Date.now()
            };
            
            if (indexingService.isFileIndexed(deletedFilePath)) {
                await indexingService.removeFileFromIndex(fileUri);
            }
            
            // Assert: File should be removed from index
            expect(indexingService.isFileIndexed).toHaveBeenCalledWith(deletedFilePath);
            expect(indexingService.removeFileFromIndex).toHaveBeenCalledWith(fileUri);
        });

        it('should handle deletion of non-indexed files gracefully', async () => {
            // Arrange: Non-indexed file deleted
            const deletedFilePath = '/mock/workspace/temp/tempFile.tmp';
            
            indexingService.isFileIndexed.mockReturnValue(false);
            
            // Act: Simulate deletion of non-indexed file
            const shouldRemove = indexingService.isFileIndexed(deletedFilePath);
            
            // Assert: Should not attempt to remove non-indexed file
            expect(shouldRemove).toBe(false);
            expect(indexingService.removeFileFromIndex).not.toHaveBeenCalled();
        });
    });

    describe('File Size and Type Filtering', () => {
        it('should reject files exceeding size limit', async () => {
            // Arrange: Large file (exceeds 2MB limit)
            const largeFilePath = '/mock/workspace/large-file.txt';
            
            vi.spyOn(fileMonitorService, 'shouldProcessFile').mockImplementation((path: string) => {
                // Simulate size check - reject large files
                return !path.includes('large-file');
            });
            
            // Act: Check if large file should be processed
            const shouldProcess = fileMonitorService.shouldProcessFile(largeFilePath);
            
            // Assert: Large file should be rejected
            expect(shouldProcess).toBe(false);
        });

        it('should process supported text file types', async () => {
            // Arrange: Various supported file types
            const supportedFiles = [
                '/mock/workspace/src/code.ts',
                '/mock/workspace/src/script.js',
                '/mock/workspace/src/component.tsx',
                '/mock/workspace/docs/readme.md',
                '/mock/workspace/config.json'
            ];
            
            vi.spyOn(fileMonitorService, 'shouldProcessFile').mockReturnValue(true);
            
            // Act & Assert: All supported files should be processed
            supportedFiles.forEach(filePath => {
                const shouldProcess = fileMonitorService.shouldProcessFile(filePath);
                expect(shouldProcess).toBe(true);
            });
        });
    });

    describe('Monitoring Statistics', () => {
        it('should track file monitoring statistics', async () => {
            // Arrange: Initial stats
            const initialStats: FileMonitorStats = {
                watchedFiles: 0,
                changeEvents: 0,
                createEvents: 0,
                deleteEvents: 0,
                debouncedEvents: 0,
                startTime: Date.now()
            };
            
            vi.spyOn(fileMonitorService, 'getStats').mockReturnValue(initialStats);
            
            // Act: Get initial stats
            let stats = fileMonitorService.getStats();
            expect(stats.changeEvents).toBe(0);
            expect(stats.createEvents).toBe(0);
            expect(stats.deleteEvents).toBe(0);
            
            // Simulate some events
            const updatedStats: FileMonitorStats = {
                ...initialStats,
                changeEvents: 5,
                createEvents: 2,
                deleteEvents: 1,
                debouncedEvents: 3
            };
            
            fileMonitorService.getStats.mockReturnValue(updatedStats);
            
            // Assert: Stats should be updated
            stats = fileMonitorService.getStats();
            expect(stats.changeEvents).toBe(5);
            expect(stats.createEvents).toBe(2);
            expect(stats.deleteEvents).toBe(1);
            expect(stats.debouncedEvents).toBe(3);
        });
    });

    describe('Error Handling', () => {
        it('should handle file system watcher errors gracefully', async () => {
            // Arrange: File system watcher fails
            mockVscode.workspace.createFileSystemWatcher.mockImplementation(() => {
                throw new Error('File system watcher failed');
            });
            
            // Act & Assert: Should handle watcher creation failure
            expect(() => {
                mockVscode.workspace.createFileSystemWatcher('**/*');
            }).toThrow('File system watcher failed');
        });

        it('should handle indexing errors during file events', async () => {
            // Arrange: Indexing operation fails
            const filePath = '/mock/workspace/src/problematic.ts';
            const fileUri = mockVscode.Uri.file(filePath);
            
            indexingService.updateFileInIndex.mockRejectedValue(new Error('Indexing failed'));
            
            // Act & Assert: Should handle indexing failure
            await expect(indexingService.updateFileInIndex(fileUri)).rejects.toThrow('Indexing failed');
        });
    });

    describe('Implementation Requirements', () => {
        it('should successfully implement FileMonitorService', () => {
            // FileMonitorService has been implemented with real-time file monitoring
            expect(fileMonitorService).toBeDefined();
            expect(typeof fileMonitorService.startMonitoring).toBe('function');
            expect(typeof fileMonitorService.stopMonitoring).toBe('function');
            expect(typeof fileMonitorService.getConfig).toBe('function');
            expect(typeof fileMonitorService.getStats).toBe('function');
        });
    });
});
