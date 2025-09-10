/**
 * Message Router Service
 *
 * This service handles the routing of messages between the extension and webview
 * by registering appropriate handlers for different message types and coordinating
 * with various extension services.
 *
 * Features:
 * - Automatic handler registration for all message types
 * - Integration with extension services
 * - Error handling and logging
 * - Type-safe message routing
 * - Service coordination
 */

import * as vscode from "vscode";
import { TypeSafeCommunicationService } from "./typeSafeCommunicationService";
import {
  WebviewToExtensionMessageType,
  ExtensionToWebviewMessageType,
  SearchRequestPayload,
  SearchResultsPayload,
  ConfigUpdatePayload,
  IndexingStatusPayload,
  FileOperationPayload,
  ExtensionStatePayload,
  NotificationPayload,
} from "../shared/communicationTypes";
import { ConfigService } from "../configService";
import { SearchManager } from "../searchManager";
import { IndexingService } from "../indexing/indexingService";
import { CentralizedLoggingService } from "../logging/centralizedLoggingService";
import { NotificationService } from "../notifications/notificationService";
import { ConfigurationValidationService } from "../validation/configurationValidationService";
import { FileScanService } from "../services/fileScanService";
import { WorkspaceManager } from "../workspaceManager";

/**
 * Message router service
 */
export class MessageRouter {
  private communicationService: TypeSafeCommunicationService;
  private configService: ConfigService;
  private searchManager?: SearchManager;
  private indexingService?: IndexingService;
  private loggingService?: CentralizedLoggingService;
  private notificationService?: NotificationService;
  private validationService?: ConfigurationValidationService;
  private fileScanService?: FileScanService;
  private workspaceManager?: WorkspaceManager;

  constructor(
    communicationService: TypeSafeCommunicationService,
    configService: ConfigService,
    workspaceManager: WorkspaceManager,
    loggingService?: CentralizedLoggingService,
  ) {
    this.communicationService = communicationService;
    this.configService = configService;
    this.workspaceManager = workspaceManager;
    this.loggingService = loggingService;

    // Initialize file scan service
    this.fileScanService = new FileScanService(
      communicationService,
      workspaceManager,
      loggingService
    );

    this.registerHandlers();
  }

  /**
   * Set service dependencies
   */
  public setServices(services: {
    searchManager?: SearchManager;
    indexingService?: IndexingService;
    notificationService?: NotificationService;
    validationService?: ConfigurationValidationService;
  }): void {
    this.searchManager = services.searchManager;
    this.indexingService = services.indexingService;
    this.notificationService = services.notificationService;
    this.validationService = services.validationService;

    this.loggingService?.info(
      "MessageRouter services updated",
      {
        hasSearchManager: !!this.searchManager,
        hasIndexingService: !!this.indexingService,
        hasNotificationService: !!this.notificationService,
        hasValidationService: !!this.validationService,
      },
      "MessageRouter",
    );
  }

  /**
   * Register all message handlers
   */
  private registerHandlers(): void {
    // Configuration handlers
    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.GET_CONFIG,
      this.handleGetConfig.bind(this),
    );

    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.UPDATE_CONFIG,
      this.handleUpdateConfig.bind(this),
    );

    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.VALIDATE_CONFIG,
      this.handleValidateConfig.bind(this),
    );

    // Search handlers
    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.SEARCH,
      this.handleSearch.bind(this),
    );

    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.GET_SEARCH_HISTORY,
      this.handleGetSearchHistory.bind(this),
    );

    // Indexing handlers
    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.START_INDEXING,
      this.handleStartIndexing.bind(this),
    );

    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.STOP_INDEXING,
      this.handleStopIndexing.bind(this),
    );

    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.GET_INDEXING_STATUS,
      this.handleGetIndexingStatus.bind(this),
    );

    // File scanning handlers
    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.START_FILE_SCAN,
      this.handleStartFileScan.bind(this),
    );

    // File operation handlers
    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.OPEN_FILE,
      this.handleOpenFile.bind(this),
    );

    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.SHOW_FILE_IN_EXPLORER,
      this.handleShowFileInExplorer.bind(this),
    );

    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.REQUEST_OPEN_FOLDER,
      this.handleRequestOpenFolder.bind(this),
    );

    // State handlers
    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.GET_STATE,
      this.handleGetState.bind(this),
    );

    // Ready handler
    this.communicationService.registerMessageHandler(
      WebviewToExtensionMessageType.WEBVIEW_READY,
      this.handleWebviewReady.bind(this),
    );

    this.loggingService?.info(
      "MessageRouter handlers registered",
      {},
      "MessageRouter",
    );
  }

  /**
   * Handle get configuration request
   */
  private async handleGetConfig(): Promise<Record<string, any>> {
    try {
      const config = this.configService.getFullConfig();
      this.loggingService?.debug(
        "Configuration retrieved",
        {},
        "MessageRouter",
      );
      return config;
    } catch (error) {
      this.loggingService?.error(
        "Failed to get configuration",
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "MessageRouter",
      );
      throw error;
    }
  }

  /**
   * Handle update configuration request
   */
  private async handleUpdateConfig(
    payload: ConfigUpdatePayload,
  ): Promise<ConfigUpdatePayload> {
    try {
      const config = vscode.workspace.getConfiguration("code-context-engine");

      // Update configuration values
      for (const [key, value] of Object.entries(payload.config)) {
        await config.update(key, value, vscode.ConfigurationTarget.Global);
      }

      // Refresh config service
      this.configService.refresh();

      // Validate the updated configuration
      let errors: string[] = [];
      if (this.validationService) {
        const validationResult =
          await this.validationService.validateConfiguration();
        errors = validationResult.errors.map((e) => e.message);
      }

      const result: ConfigUpdatePayload = {
        section: payload.section,
        config: payload.config,
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };

      this.loggingService?.info(
        "Configuration updated",
        {
          section: payload.section,
          success: result.success,
          errorCount: errors.length,
        },
        "MessageRouter",
      );

      return result;
    } catch (error) {
      this.loggingService?.error(
        "Failed to update configuration",
        {
          error: error instanceof Error ? error.message : String(error),
          section: payload.section,
        },
        "MessageRouter",
      );

      return {
        section: payload.section,
        config: payload.config,
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Handle validate configuration request
   */
  private async handleValidateConfig(): Promise<any> {
    try {
      if (!this.validationService) {
        throw new Error("Configuration validation service not available");
      }

      const result = await this.validationService.validateConfiguration();
      this.loggingService?.debug(
        "Configuration validated",
        {
          isValid: result.isValid,
          errorCount: result.errors.length,
        },
        "MessageRouter",
      );

      return result;
    } catch (error) {
      this.loggingService?.error(
        "Failed to validate configuration",
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "MessageRouter",
      );
      throw error;
    }
  }

  /**
   * Handle search request
   */
  private async handleSearch(
    payload: SearchRequestPayload,
  ): Promise<SearchResultsPayload> {
    try {
      if (!this.searchManager) {
        throw new Error("Search manager not available");
      }

      // Convert date strings to Date objects for SearchFilters
      const searchFilters = payload.filters
        ? {
            ...payload.filters,
            dateRange: payload.filters.dateRange
              ? {
                  from: new Date(payload.filters.dateRange.start),
                  to: new Date(payload.filters.dateRange.end),
                }
              : undefined,
          }
        : undefined;

      const startTime = Date.now();
      const results = await this.searchManager.search(
        payload.query,
        searchFilters,
      );
      const searchTime = Date.now() - startTime;

      const searchResults: SearchResultsPayload = {
        query: payload.query,
        results: results.map((result) => ({
          id: result.id,
          filePath: result.filePath,
          lineNumber: result.lineNumber,
          preview: result.preview,
          similarity: result.similarity,
          chunkType: result.chunkType,
          language: result.language || "unknown",
          metadata: {}, // EnhancedSearchResult doesn't have metadata property
          llmScore: result.llmScore,
          finalScore: result.finalScore,
          explanation: result.explanation,
          wasReRanked: result.wasReRanked,
        })),
        totalResults: results.length,
        searchTime,
        usedQueryExpansion: false, // Will be determined from search history
        expandedTerms: [], // Will be determined from search history
        usedLLMReRanking: results.some((r) => r.wasReRanked),
        reRankedCount: results.filter((r) => r.wasReRanked).length,
      };

      this.loggingService?.info(
        "Search completed",
        {
          query: payload.query,
          resultCount: results.length,
          searchTime,
        },
        "MessageRouter",
      );

      return searchResults;
    } catch (error) {
      this.loggingService?.error(
        "Search failed",
        {
          error: error instanceof Error ? error.message : String(error),
          query: payload.query,
        },
        "MessageRouter",
      );
      throw error;
    }
  }

  /**
   * Handle get search history request
   */
  private async handleGetSearchHistory(): Promise<any[]> {
    try {
      if (!this.searchManager) {
        return [];
      }

      const history = this.searchManager.getSearchHistory();
      this.loggingService?.debug(
        "Search history retrieved",
        {
          count: history.length,
        },
        "MessageRouter",
      );

      return history;
    } catch (error) {
      this.loggingService?.error(
        "Failed to get search history",
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "MessageRouter",
      );
      return [];
    }
  }

  /**
   * Handle start indexing request
   */
  private async handleStartIndexing(): Promise<IndexingStatusPayload> {
    try {
      if (!this.indexingService) {
        throw new Error("Indexing service not available");
      }

      // Start indexing with a progress callback
      const indexingPromise = this.indexingService.startIndexing((progress) => {
        // Send progress updates to webview
        this.communicationService.sendMessage(
          ExtensionToWebviewMessageType.INDEXING_PROGRESS,
          {
            isRunning: true,
            progress: Math.round(
              (progress.processedFiles / progress.totalFiles) * 100,
            ),
            status: `Processing ${progress.currentFile}`,
            filesProcessed: progress.processedFiles,
            totalFiles: progress.totalFiles,
            chunksCreated: progress.chunks.length,
            errors: progress.errors,
          },
        );
      });

      this.loggingService?.info("Indexing started", {}, "MessageRouter");

      // Return initial status
      return {
        isRunning: true,
        progress: 0,
        status: "Starting indexing...",
        filesProcessed: 0,
        totalFiles: 0,
        chunksCreated: 0,
        startTime: Date.now(),
        errors: [],
      };
    } catch (error) {
      this.loggingService?.error(
        "Failed to start indexing",
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "MessageRouter",
      );
      throw error;
    }
  }

  /**
   * Handle stop indexing request
   */
  private async handleStopIndexing(): Promise<void> {
    try {
      if (!this.indexingService) {
        throw new Error("Indexing service not available");
      }

      // Use pause method to stop indexing
      this.indexingService.pause();
      this.loggingService?.info("Indexing stopped", {}, "MessageRouter");
    } catch (error) {
      this.loggingService?.error(
        "Failed to stop indexing",
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "MessageRouter",
      );
      throw error;
    }
  }

  /**
   * Handle get indexing status request
   */
  private async handleGetIndexingStatus(): Promise<IndexingStatusPayload> {
    try {
      if (!this.indexingService) {
        throw new Error("Indexing service not available");
      }

      // Since IndexingService doesn't have getIndexingStatus, we'll return a basic status
      // In a real implementation, this would be enhanced with proper state management
      return {
        isRunning: false, // Would check actual state
        progress: 0,
        status: "Ready",
        filesProcessed: 0,
        totalFiles: 0,
        chunksCreated: 0,
        errors: [],
      };
    } catch (error) {
      this.loggingService?.error(
        "Failed to get indexing status",
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "MessageRouter",
      );
      throw error;
    }
  }

  /**
   * Handle start file scan request
   */
  private async handleStartFileScan(): Promise<void> {
    try {
      if (!this.fileScanService) {
        throw new Error("File scan service not available");
      }

      this.loggingService?.info(
        "Starting file scan",
        {},
        "MessageRouter"
      );

      // Start the file scan (this will send progress messages automatically)
      await this.fileScanService.startFileScan();

    } catch (error) {
      this.loggingService?.error(
        "Failed to start file scan",
        { error: error instanceof Error ? error.message : String(error) },
        "MessageRouter"
      );
      throw error;
    }
  }

  /**
   * Handle open file request
   */
  private async handleOpenFile(payload: FileOperationPayload): Promise<void> {
    try {
      const uri = vscode.Uri.file(payload.filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      if (payload.lineNumber) {
        const position = new vscode.Position(
          Math.max(0, payload.lineNumber - 1),
          payload.columnNumber || 0,
        );
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position));
      }

      this.loggingService?.info(
        "File opened",
        {
          filePath: payload.filePath,
          lineNumber: payload.lineNumber,
        },
        "MessageRouter",
      );
    } catch (error) {
      this.loggingService?.error(
        "Failed to open file",
        {
          error: error instanceof Error ? error.message : String(error),
          filePath: payload.filePath,
        },
        "MessageRouter",
      );
      throw error;
    }
  }

  /**
   * Handle show file in explorer request
   */
  private async handleShowFileInExplorer(
    payload: FileOperationPayload,
  ): Promise<void> {
    try {
      const uri = vscode.Uri.file(payload.filePath);
      await vscode.commands.executeCommand("revealFileInOS", uri);

      this.loggingService?.info(
        "File revealed in explorer",
        {
          filePath: payload.filePath,
        },
        "MessageRouter",
      );
    } catch (error) {
      this.loggingService?.error(
        "Failed to show file in explorer",
        {
          error: error instanceof Error ? error.message : String(error),
          filePath: payload.filePath,
        },
        "MessageRouter",
      );
      throw error;
    }
  }

  /**
   * Handle request open folder request
   */
  private async handleRequestOpenFolder(): Promise<void> {
    try {
      await vscode.commands.executeCommand("vscode.openFolder");

      this.loggingService?.info(
        "Open folder dialog triggered",
        {},
        "MessageRouter",
      );
    } catch (error) {
      this.loggingService?.error(
        "Failed to open folder dialog",
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "MessageRouter",
      );
      throw error;
    }
  }

  /**
   * Handle get state request
   */
  private async handleGetState(): Promise<ExtensionStatePayload> {
    try {
      const config = this.configService.getFullConfig();
      const indexingStatus = {
        isRunning: false,
        progress: 0,
        status: "Not started",
        filesProcessed: 0,
        totalFiles: 0,
        chunksCreated: 0,
      };
      const searchHistory = this.searchManager?.getSearchHistory() || [];

      const state: ExtensionStatePayload = {
        config,
        indexingStatus,
        searchHistory: searchHistory.map((h) => ({
          query: h.query,
          timestamp: h.timestamp.getTime(),
          resultCount: h.resultCount,
        })),
        version: "1.0.0", // TODO: Get from package.json
        theme: "dark", // TODO: Get actual theme
        availableProviders: {
          embedding: ["ollama", "openai"],
          llm: ["ollama", "openai"],
        },
      };

      this.loggingService?.debug(
        "Extension state retrieved",
        {},
        "MessageRouter",
      );
      return state;
    } catch (error) {
      this.loggingService?.error(
        "Failed to get extension state",
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "MessageRouter",
      );
      throw error;
    }
  }

  /**
   * Handle webview ready signal
   */
  private async handleWebviewReady(): Promise<void> {
    try {
      // Send initial state to webview
      const state = await this.handleGetState();
      this.communicationService.sendMessage(
        ExtensionToWebviewMessageType.STATE_UPDATE,
        state,
      );

      this.loggingService?.info(
        "Webview ready, initial state sent",
        {},
        "MessageRouter",
      );
    } catch (error) {
      this.loggingService?.error(
        "Failed to handle webview ready",
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "MessageRouter",
      );
    }
  }

  /**
   * Send notification to webview
   */
  public sendNotification(notification: NotificationPayload): void {
    this.communicationService.sendMessage(
      ExtensionToWebviewMessageType.NOTIFICATION,
      notification,
    );
  }

  /**
   * Send indexing progress update
   */
  public sendIndexingProgress(status: IndexingStatusPayload): void {
    this.communicationService.sendMessage(
      ExtensionToWebviewMessageType.INDEXING_PROGRESS,
      status,
    );
  }

  /**
   * Send configuration update notification
   */
  public sendConfigUpdate(config: Record<string, any>): void {
    this.communicationService.sendMessage(
      ExtensionToWebviewMessageType.CONFIG_UPDATE,
      config,
    );
  }
}
