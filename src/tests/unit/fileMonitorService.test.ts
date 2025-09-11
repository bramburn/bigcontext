/**
 * Unit Tests for FileMonitorService Debouncing Logic
 *
 * This test suite focuses specifically on testing the debouncing mechanism
 * in the FileMonitorService to ensure it properly handles rapid file changes
 * and prevents event storms.
 *
 * Based on specifications in:
 * - specs/002-for-the-next/spec.md
 * - specs/002-for-the-next/data-model.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileMonitorService } from '../../services/fileMonitorService';
import { FileMonitorConfig } from '../../types/indexing';
import { mockVscode } from '../../test/setup';

// Mock fs module
vi.mock('fs', () => ({
  statSync: vi.fn(() => ({
    isFile: () => true,
    size: 1024,
  })),
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '*.log\n*.tmp\n'),
}));

describe('FileMonitorService Debouncing Logic', () => {
  let fileMonitorService: FileMonitorService;
  let mockContext: any;
  let mockIndexingService: any;
  let testConfig: FileMonitorConfig;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock VS Code extension context
    mockContext = {
      extensionPath: '/mock/path',
      globalState: { get: vi.fn(), update: vi.fn() },
      workspaceState: { get: vi.fn(), update: vi.fn() },
    };

    // Mock indexing service
    mockIndexingService = {
      addFileToIndex: vi.fn().mockResolvedValue(undefined),
      updateFileInIndex: vi.fn().mockResolvedValue(undefined),
      removeFileFromIndex: vi.fn().mockResolvedValue(undefined),
    };

    // Test configuration with short debounce delay for faster tests
    testConfig = {
      debounceDelay: 100, // 100ms for testing
      patterns: ['**/*.{ts,js}'],
      respectGitignore: false,
      maxFileSize: 1024 * 1024, // 1MB
      skipBinaryFiles: true,
    };

    fileMonitorService = new FileMonitorService(mockContext, mockIndexingService, testConfig);
  });

  afterEach(() => {
    vi.useRealTimers();
    fileMonitorService.dispose();
  });

  describe('Debouncing Mechanism', () => {
    it('should debounce rapid file changes to the same file', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      const uri = { fsPath: filePath } as any;
      const changeListener = vi.fn();
      fileMonitorService.onFileChange(changeListener);

      // Get the private method for testing
      const handleFileChange = (fileMonitorService as any).handleFileChange.bind(
        fileMonitorService
      );

      // Act - trigger multiple rapid changes
      await handleFileChange(uri);
      await handleFileChange(uri);
      await handleFileChange(uri);

      // Assert - before debounce timeout
      expect(mockIndexingService.updateFileInIndex).not.toHaveBeenCalled();

      // Fast-forward time to trigger debounce
      vi.advanceTimersByTime(testConfig.debounceDelay + 10);
      await vi.runAllTimersAsync();

      // Assert - after debounce timeout, only one call should be made
      expect(mockIndexingService.updateFileInIndex).toHaveBeenCalledTimes(1);
    });

    it('should not debounce changes to different files', async () => {
      // Arrange
      const filePath1 = '/test/file1.ts';
      const filePath2 = '/test/file2.ts';
      const uri1 = { fsPath: filePath1 } as any;
      const uri2 = { fsPath: filePath2 } as any;
      const handleFileChange = (fileMonitorService as any).handleFileChange.bind(
        fileMonitorService
      );

      // Act - trigger changes to different files
      await handleFileChange(uri1);
      await handleFileChange(uri2);

      // Fast-forward time to trigger debounce
      vi.advanceTimersByTime(testConfig.debounceDelay + 10);
      await vi.runAllTimersAsync();

      // Assert - both files should be processed
      expect(mockIndexingService.updateFileInIndex).toHaveBeenCalledTimes(2);
    });

    it('should reset debounce timer on subsequent changes to the same file', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      const uri = { fsPath: filePath } as any;
      const handleFileChange = (fileMonitorService as any).handleFileChange.bind(
        fileMonitorService
      );

      // Act - trigger first change
      await handleFileChange(uri);

      // Advance time partially
      vi.advanceTimersByTime(testConfig.debounceDelay / 2);

      // Trigger second change (should reset timer)
      await handleFileChange(uri);

      // Advance time by half debounce delay again
      vi.advanceTimersByTime(testConfig.debounceDelay / 2);

      // Assert - should not have been called yet (timer was reset)
      expect(mockIndexingService.updateFileInIndex).not.toHaveBeenCalled();

      // Advance remaining time
      vi.advanceTimersByTime(testConfig.debounceDelay / 2 + 10);
      await vi.runAllTimersAsync();

      // Assert - should be called once after full debounce period
      expect(mockIndexingService.updateFileInIndex).toHaveBeenCalledTimes(1);
    });

    it('should track debounced events in statistics', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      const uri = { fsPath: filePath } as any;
      const handleFileChange = (fileMonitorService as any).handleFileChange.bind(
        fileMonitorService
      );

      // Act - trigger multiple rapid changes
      await handleFileChange(uri);
      await handleFileChange(uri);
      await handleFileChange(uri);

      // Fast-forward time to trigger debounce
      vi.advanceTimersByTime(testConfig.debounceDelay + 10);
      await vi.runAllTimersAsync();

      // Assert - statistics should reflect debounced events
      const stats = fileMonitorService.getStats();
      expect(stats.debouncedEvents).toBe(2); // 2 events were debounced (3 total - 1 processed)
    });

    it('should not debounce file deletion events', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      const uri = { fsPath: filePath } as any;
      const handleFileDelete = (fileMonitorService as any).handleFileDelete.bind(
        fileMonitorService
      );

      // Act - trigger file deletion
      await handleFileDelete(uri);

      // Assert - deletion should be processed immediately without debouncing
      expect(mockIndexingService.removeFileFromIndex).toHaveBeenCalledTimes(1);

      // Fast-forward time to ensure no additional calls
      vi.advanceTimersByTime(testConfig.debounceDelay + 10);
      await vi.runAllTimersAsync();
      expect(mockIndexingService.removeFileFromIndex).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed event types with proper debouncing', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      const uri = { fsPath: filePath } as any;
      const handleFileCreate = (fileMonitorService as any).handleFileCreate.bind(
        fileMonitorService
      );
      const handleFileChange = (fileMonitorService as any).handleFileChange.bind(
        fileMonitorService
      );
      const handleFileDelete = (fileMonitorService as any).handleFileDelete.bind(
        fileMonitorService
      );

      // Act - trigger mixed events
      await handleFileCreate(uri);
      await handleFileChange(uri);
      await handleFileChange(uri);
      await handleFileDelete(uri);

      // Assert - deletion should be immediate
      expect(mockIndexingService.removeFileFromIndex).toHaveBeenCalledTimes(1);

      // Fast-forward time to trigger debounce for create/change events
      vi.advanceTimersByTime(testConfig.debounceDelay + 10);
      await vi.runAllTimersAsync();

      // Assert - only the last change operation should be processed due to debouncing
      // The create operation gets overridden by the change operations
      expect(mockIndexingService.updateFileInIndex).toHaveBeenCalledTimes(1);
      // addFileToIndex should not be called because the change operations override it
      expect(mockIndexingService.addFileToIndex).toHaveBeenCalledTimes(0);
    });

    it('should clear debounce timeouts when service is disposed', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      const uri = { fsPath: filePath } as any;

      // Start monitoring to ensure the service is active
      fileMonitorService.startMonitoring();

      const handleFileChange = (fileMonitorService as any).handleFileChange.bind(
        fileMonitorService
      );

      // Act - trigger change and immediately dispose before debounce completes
      await handleFileChange(uri);

      // Verify timeout was set
      const debounceTimeouts = (fileMonitorService as any).debounceTimeouts;
      expect(debounceTimeouts.size).toBe(1);

      // Dispose the service
      fileMonitorService.dispose();

      // Verify timeouts were cleared
      expect(debounceTimeouts.size).toBe(0);

      // Fast-forward time to ensure no operations occur
      vi.advanceTimersByTime(testConfig.debounceDelay + 10);
      await vi.runAllTimersAsync();

      // Assert - no indexing operations should occur after disposal
      expect(mockIndexingService.updateFileInIndex).not.toHaveBeenCalled();
    });

    it('should handle errors in debounced operations gracefully', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      const uri = { fsPath: filePath } as any;
      const handleFileChange = (fileMonitorService as any).handleFileChange.bind(
        fileMonitorService
      );

      // Mock indexing service to throw error
      mockIndexingService.updateFileInIndex.mockRejectedValue(new Error('Indexing failed'));

      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act - trigger change
      await handleFileChange(uri);

      // Fast-forward time to trigger debounce
      vi.advanceTimersByTime(testConfig.debounceDelay + 10);

      // Wait for async operations
      await vi.runAllTimersAsync();

      // Assert - error should be logged but not thrown
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error updating file'),
        expect.any(Error)
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Configuration-based Debouncing', () => {
    it('should respect custom debounce delay configuration', async () => {
      // Arrange
      const customConfig = { ...testConfig, debounceDelay: 500 };
      const customService = new FileMonitorService(mockContext, mockIndexingService, customConfig);

      const filePath = '/test/file.ts';
      const uri = { fsPath: filePath } as any;
      const handleFileChange = (customService as any).handleFileChange.bind(customService);

      // Act
      await handleFileChange(uri);

      // Advance time by original debounce delay
      vi.advanceTimersByTime(testConfig.debounceDelay + 10);

      // Assert - should not be called yet with longer delay
      expect(mockIndexingService.updateFileInIndex).not.toHaveBeenCalled();

      // Advance time by custom debounce delay
      vi.advanceTimersByTime(customConfig.debounceDelay - testConfig.debounceDelay);
      await vi.runAllTimersAsync();

      // Assert - should be called now
      expect(mockIndexingService.updateFileInIndex).toHaveBeenCalledTimes(1);

      // Cleanup
      customService.dispose();
    });

    it('should handle zero debounce delay (immediate processing)', async () => {
      // Arrange
      const immediateConfig = { ...testConfig, debounceDelay: 0 };
      const immediateService = new FileMonitorService(
        mockContext,
        mockIndexingService,
        immediateConfig
      );

      const filePath = '/test/file.ts';
      const uri = { fsPath: filePath } as any;
      const handleFileChange = (immediateService as any).handleFileChange.bind(immediateService);

      // Act
      await handleFileChange(uri);
      await vi.runAllTimersAsync();

      // Assert - should be called immediately without waiting
      expect(mockIndexingService.updateFileInIndex).toHaveBeenCalledTimes(1);

      // Cleanup
      immediateService.dispose();
    });
  });
});
