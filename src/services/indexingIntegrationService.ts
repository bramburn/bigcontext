/**
 * Indexing Integration Service
 *
 * This service integrates the FileMonitorService with the IndexingService
 * and ConfigurationChangeDetector to provide a unified indexing experience.
 *
 * It handles:
 * - File change events from FileMonitorService
 * - Configuration change events that require re-indexing
 * - Coordination between different indexing components
 *
 * Based on specifications in:
 * - specs/002-for-the-next/spec.md
 * - specs/002-for-the-next/data-model.md
 */

import * as vscode from 'vscode';
import { IIndexingService } from './IndexingService';
import { FileMonitorService, IFileMonitorService } from './fileMonitorService';
import { ConfigurationChangeDetector } from './configurationChangeDetector';
import { FileChangeEvent, ConfigurationChangeEvent, IndexState } from '../types/indexing';
import { ConfigService } from '../configService';

/**
 * Integration Service that coordinates indexing components
 *
 * This service acts as the central coordinator between:
 * - FileMonitorService (file system events)
 * - IndexingService (indexing operations)
 * - ConfigurationChangeDetector (configuration changes)
 */
export class IndexingIntegrationService {
  private disposables: vscode.Disposable[] = [];
  private isInitialized = false;

  constructor(
    private context: vscode.ExtensionContext,
    private indexingService: IIndexingService,
    private fileMonitorService: IFileMonitorService,
    private configurationChangeDetector: ConfigurationChangeDetector,
    private configService: ConfigService
  ) {}

  /**
   * Initializes the integration service and sets up event handlers
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('IndexingIntegrationService: Already initialized');
      return;
    }

    try {
      console.log('IndexingIntegrationService: Initializing...');

      // Set up file change event handler
      this.setupFileChangeHandler();

      // Set up configuration change event handler
      this.setupConfigurationChangeHandler();

      // Set up indexing state change handler
      this.setupIndexingStateChangeHandler();

      this.isInitialized = true;
      console.log('IndexingIntegrationService: Initialized successfully');
    } catch (error) {
      console.error('IndexingIntegrationService: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Sets up the file change event handler
   */
  private setupFileChangeHandler(): void {
    const fileChangeDisposable = this.fileMonitorService.onFileChange(
      this.handleFileChange.bind(this)
    );
    this.disposables.push(fileChangeDisposable);
  }

  /**
   * Sets up the configuration change event handler
   */
  private setupConfigurationChangeHandler(): void {
    const configChangeDisposable = this.configurationChangeDetector.onConfigurationChange(
      this.handleConfigurationChange.bind(this)
    );
    this.disposables.push(configChangeDisposable);
  }

  /**
   * Sets up the indexing state change handler
   */
  private setupIndexingStateChangeHandler(): void {
    // Listen for indexing state changes to control file monitoring
    const stateChangeDisposable = this.indexingService.onStateChange(
      this.handleIndexingStateChange.bind(this)
    );
    this.disposables.push(stateChangeDisposable);
  }

  /**
   * Handles file change events from FileMonitorService
   */
  private async handleFileChange(event: FileChangeEvent): Promise<void> {
    try {
      console.log(
        `IndexingIntegrationService: Handling file ${event.type} event: ${event.filePath}`
      );

      // Check if indexing is currently active
      const indexState = await this.indexingService.getIndexState();

      // Only process file changes if indexing is not currently running
      // This prevents conflicts during active indexing sessions
      if (indexState === 'indexing') {
        console.log('IndexingIntegrationService: Skipping file change - indexing in progress');
        return;
      }

      const fileUri = vscode.Uri.file(event.filePath);

      switch (event.type) {
        case 'create':
          await this.indexingService.addFileToIndex(fileUri);
          break;

        case 'change':
          await this.indexingService.updateFileInIndex(fileUri);
          break;

        case 'delete':
          await this.indexingService.removeFileFromIndex(fileUri);
          break;

        default:
          console.warn(`IndexingIntegrationService: Unknown file change type: ${event.type}`);
      }

      console.log(
        `IndexingIntegrationService: Successfully processed ${event.type} event for ${event.filePath}`
      );
    } catch (error) {
      console.error(`IndexingIntegrationService: Error handling file change event:`, error);
    }
  }

  /**
   * Handles configuration change events
   */
  private async handleConfigurationChange(event: ConfigurationChangeEvent): Promise<void> {
    try {
      console.log(
        `IndexingIntegrationService: Configuration changed: ${event.section}, requires reindex: ${event.requiresReindex}`
      );

      if (event.requiresReindex) {
        // Show notification to user about re-indexing
        const action = await vscode.window.showInformationMessage(
          `Configuration change detected (${event.section}). Re-indexing is recommended to ensure accurate results.`,
          'Re-index Now',
          'Later'
        );

        if (action === 'Re-index Now') {
          await this.triggerFullReindex('Configuration change');
        }
      }
    } catch (error) {
      console.error('IndexingIntegrationService: Error handling configuration change:', error);
    }
  }

  /**
   * Handles indexing state changes
   */
  private async handleIndexingStateChange(state: IndexState): Promise<void> {
    try {
      console.log(`IndexingIntegrationService: Indexing state changed to: ${state}`);

      // Control file monitoring based on indexing state
      switch (state) {
        case 'indexing':
          // Optionally pause file monitoring during indexing to reduce overhead
          // For now, we keep it running but filter events in handleFileChange
          break;

        case 'idle':
        case 'paused':
          // Ensure file monitoring is active when indexing is not running
          if (!this.fileMonitorService.isMonitoring()) {
            this.fileMonitorService.startMonitoring();
          }
          break;

        case 'error':
          // Keep file monitoring active even if indexing has errors
          break;
      }
    } catch (error) {
      console.error('IndexingIntegrationService: Error handling indexing state change:', error);
    }
  }

  /**
   * Triggers a full re-index with a specific reason
   */
  private async triggerFullReindex(reason: string): Promise<void> {
    try {
      console.log(`IndexingIntegrationService: Triggering full re-index - ${reason}`);

      // Check current state
      const currentState = await this.indexingService.getIndexState();

      if (currentState === 'indexing') {
        vscode.window.showWarningMessage(
          'Indexing is already in progress. Please wait for it to complete.'
        );
        return;
      }

      // If currently paused, resume first
      if (currentState === 'paused') {
        await this.indexingService.resumeIndexing();
      }

      // Trigger full re-index
      await this.indexingService.triggerFullReindex();

      vscode.window.showInformationMessage('Full re-indexing started.');
    } catch (error) {
      console.error('IndexingIntegrationService: Error triggering full re-index:', error);
      vscode.window.showErrorMessage(
        `Failed to start re-indexing: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Starts the integrated indexing system
   */
  public async start(): Promise<void> {
    try {
      console.log('IndexingIntegrationService: Starting integrated indexing system...');

      // Initialize if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Start file monitoring
      this.fileMonitorService.startMonitoring();

      // Check if auto-indexing is enabled
      if (this.configService.getAutoIndexOnStartup()) {
        const indexState = await this.indexingService.getIndexState();

        if (indexState === 'idle') {
          console.log('IndexingIntegrationService: Auto-starting indexing...');
          await this.indexingService.startIndexing();
        }
      }

      console.log('IndexingIntegrationService: Integrated indexing system started');
    } catch (error) {
      console.error('IndexingIntegrationService: Error starting integrated system:', error);
      throw error;
    }
  }

  /**
   * Stops the integrated indexing system
   */
  public async stop(): Promise<void> {
    try {
      console.log('IndexingIntegrationService: Stopping integrated indexing system...');

      // Stop file monitoring
      this.fileMonitorService.stopMonitoring();

      // Pause indexing if it's running
      const indexState = await this.indexingService.getIndexState();
      if (indexState === 'indexing') {
        await this.indexingService.pauseIndexing();
      }

      console.log('IndexingIntegrationService: Integrated indexing system stopped');
    } catch (error) {
      console.error('IndexingIntegrationService: Error stopping integrated system:', error);
    }
  }

  /**
   * Gets the current status of the integrated system
   */
  public async getStatus(): Promise<{
    indexingState: IndexState;
    fileMonitoringActive: boolean;
    fileMonitorStats: any;
  }> {
    return {
      indexingState: await this.indexingService.getIndexState(),
      fileMonitoringActive: this.fileMonitorService.isMonitoring(),
      fileMonitorStats: this.fileMonitorService.getStats(),
    };
  }

  /**
   * Disposes of the service and cleans up resources
   */
  public dispose(): void {
    console.log('IndexingIntegrationService: Disposing...');

    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables.length = 0;

    this.isInitialized = false;

    console.log('IndexingIntegrationService: Disposed');
  }
}
