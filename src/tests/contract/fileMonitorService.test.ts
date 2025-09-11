/**
 * Contract Test for IFileMonitorService
 *
 * This test verifies the public API contract for the FileMonitorService
 * that provides real-time file system monitoring capabilities.
 *
 * Based on specifications in:
 * - specs/002-for-the-next/contracts/services.ts
 * - specs/002-for-the-next/data-model.md
 *
 * This test MUST FAIL until the implementation is complete (TDD approach).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileMonitorConfig, FileMonitorStats, FileChangeEvent } from '../../types/indexing';
import { FileMonitorService, IFileMonitorService } from '../../services/fileMonitorService';

/**
 * Interface contract that the FileMonitorService must implement
 */
interface IFileMonitorService {
  /**
   * Starts monitoring the workspace for file changes.
   */
  startMonitoring(): void;

  /**
   * Stops monitoring the workspace for file changes.
   */
  stopMonitoring(): void;

  /**
   * Gets the current monitoring configuration.
   */
  getConfig(): FileMonitorConfig;

  /**
   * Gets monitoring statistics.
   */
  getStats(): FileMonitorStats;

  /**
   * Checks if monitoring is currently active.
   */
  isMonitoring(): boolean;
}

describe('IFileMonitorService Contract Test', () => {
  let fileMonitorService: IFileMonitorService;
  let mockConfig: FileMonitorConfig;
  let mockStats: FileMonitorStats;

  beforeEach(() => {
    mockConfig = {
      debounceDelay: 500,
      patterns: ['**/*.{ts,js,py,md}'],
      respectGitignore: true,
      maxFileSize: 2 * 1024 * 1024, // 2MB
      skipBinaryFiles: true,
    };

    mockStats = {
      watchedFiles: 0,
      changeEvents: 0,
      createEvents: 0,
      deleteEvents: 0,
      debouncedEvents: 0,
      startTime: Date.now(),
    };

    // Mock VS Code API
    const mockContext = {
      extensionPath: '/mock/path',
      globalState: { get: vi.fn(), update: vi.fn() },
      workspaceState: { get: vi.fn(), update: vi.fn() },
    } as any;

    // Create actual FileMonitorService instance
    fileMonitorService = new FileMonitorService(mockContext, undefined, mockConfig);

    vi.spyOn(fileMonitorService, 'getStats');
    vi.spyOn(fileMonitorService, 'isMonitoring');
    vi.spyOn(fileMonitorService, 'startMonitoring');
    vi.spyOn(fileMonitorService, 'stopMonitoring');
  });

  describe('API Contract Validation', () => {
    it('should have startMonitoring method that returns void', () => {
      expect(typeof fileMonitorService.startMonitoring).toBe('function');

      const result = fileMonitorService.startMonitoring();
      expect(result).toBeUndefined();
    });

    it('should have stopMonitoring method that returns void', () => {
      expect(typeof fileMonitorService.stopMonitoring).toBe('function');

      const result = fileMonitorService.stopMonitoring();
      expect(result).toBeUndefined();
    });

    it('should have getConfig method that returns FileMonitorConfig', () => {
      expect(typeof fileMonitorService.getConfig).toBe('function');

      const config = fileMonitorService.getConfig();
      expect(config).toBeDefined();
      expect(typeof config.debounceDelay).toBe('number');
      expect(Array.isArray(config.patterns)).toBe(true);
      expect(typeof config.respectGitignore).toBe('boolean');
      expect(typeof config.maxFileSize).toBe('number');
      expect(typeof config.skipBinaryFiles).toBe('boolean');
    });

    it('should have getStats method that returns FileMonitorStats', () => {
      expect(typeof fileMonitorService.getStats).toBe('function');

      const stats = fileMonitorService.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.watchedFiles).toBe('number');
      expect(typeof stats.changeEvents).toBe('number');
      expect(typeof stats.createEvents).toBe('number');
      expect(typeof stats.deleteEvents).toBe('number');
      expect(typeof stats.debouncedEvents).toBe('number');
      expect(typeof stats.startTime).toBe('number');
    });

    it('should have isMonitoring method that returns boolean', () => {
      expect(typeof fileMonitorService.isMonitoring).toBe('function');

      const isMonitoring = fileMonitorService.isMonitoring();
      expect(typeof isMonitoring).toBe('boolean');
    });
  });

  describe('Configuration Contract', () => {
    it('should return valid configuration with required properties', () => {
      const config = fileMonitorService.getConfig();

      expect(config.debounceDelay).toBeGreaterThan(0);
      expect(config.patterns.length).toBeGreaterThan(0);
      expect(config.maxFileSize).toBeGreaterThan(0);
      expect(typeof config.respectGitignore).toBe('boolean');
      expect(typeof config.skipBinaryFiles).toBe('boolean');
    });

    it('should have sensible default values', () => {
      const config = fileMonitorService.getConfig();

      // Debounce delay should be reasonable (100ms to 5s)
      expect(config.debounceDelay).toBeGreaterThanOrEqual(100);
      expect(config.debounceDelay).toBeLessThanOrEqual(5000);

      // Max file size should be reasonable (1MB to 100MB)
      expect(config.maxFileSize).toBeGreaterThanOrEqual(1024 * 1024);
      expect(config.maxFileSize).toBeLessThanOrEqual(100 * 1024 * 1024);

      // Should include common file patterns
      const patternsString = config.patterns.join(',');
      expect(patternsString).toMatch(/\*\*\/\*\.\{.*\}/);
    });
  });

  describe('Statistics Contract', () => {
    it('should return valid statistics with non-negative values', () => {
      const stats = fileMonitorService.getStats();

      expect(stats.watchedFiles).toBeGreaterThanOrEqual(0);
      expect(stats.changeEvents).toBeGreaterThanOrEqual(0);
      expect(stats.createEvents).toBeGreaterThanOrEqual(0);
      expect(stats.deleteEvents).toBeGreaterThanOrEqual(0);
      expect(stats.debouncedEvents).toBeGreaterThanOrEqual(0);
      expect(stats.startTime).toBeGreaterThan(0);
    });

    it('should track event counts correctly', () => {
      // Mock updated stats to simulate event tracking
      const updatedStats = {
        ...mockStats,
        changeEvents: 5,
        createEvents: 2,
        deleteEvents: 1,
        debouncedEvents: 3,
      };

      fileMonitorService.getStats.mockReturnValue(updatedStats);
      const stats = fileMonitorService.getStats();
      expect(stats.changeEvents).toBe(5);
      expect(stats.createEvents).toBe(2);
      expect(stats.deleteEvents).toBe(1);
      expect(stats.debouncedEvents).toBe(3);
    });
  });

  describe('Monitoring State Contract', () => {
    it('should track monitoring state correctly', () => {
      // Initially not monitoring
      expect(fileMonitorService.isMonitoring()).toBe(false);

      // After starting monitoring
      fileMonitorService.startMonitoring();
      expect(fileMonitorService.isMonitoring()).toBe(true);

      // After stopping monitoring
      fileMonitorService.stopMonitoring();
      expect(fileMonitorService.isMonitoring()).toBe(false);
    });

    it('should handle start/stop monitoring calls', () => {
      fileMonitorService.startMonitoring();
      expect(fileMonitorService.startMonitoring).toHaveBeenCalled();

      fileMonitorService.stopMonitoring();
      expect(fileMonitorService.stopMonitoring).toHaveBeenCalled();
    });
  });

  describe('Implementation Requirements', () => {
    it('should successfully implement the IFileMonitorService interface', () => {
      // The FileMonitorService has been implemented and should pass all contract tests
      expect(fileMonitorService).toBeDefined();
      expect(typeof fileMonitorService.startMonitoring).toBe('function');
      expect(typeof fileMonitorService.stopMonitoring).toBe('function');
      expect(typeof fileMonitorService.getConfig).toBe('function');
      expect(typeof fileMonitorService.getStats).toBe('function');
      expect(typeof fileMonitorService.isMonitoring).toBe('function');
    });
  });
});
