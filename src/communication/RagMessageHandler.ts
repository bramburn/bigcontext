/**
 * RAG Message Handler
 * 
 * This module extends the existing message router to handle RAG for LLM
 * specific messages. It integrates the SettingsApi and IndexingApi with
 * the VS Code webview communication system.
 * 
 * The handler follows the existing message routing patterns and provides
 * seamless integration with the current extension architecture.
 */

import * as vscode from 'vscode';
import { SettingsApi } from '../api/SettingsApi';
import { IndexingApi } from '../api/IndexingApi';
import { SettingsService } from '../services/SettingsService';
import { IndexingService } from '../services/IndexingService';
import { FileProcessor } from '../services/FileProcessor';
import { EmbeddingProvider } from '../services/EmbeddingProvider';
import { QdrantService } from '../services/QdrantService';

/**
 * RAG Message Handler Class
 * 
 * Handles RAG for LLM specific webview messages and integrates with
 * the existing message router system. Provides a bridge between the
 * React frontend and the backend services.
 */
export class RagMessageHandler {
  /** VS Code extension context */
  private context: vscode.ExtensionContext;
  
  /** Settings API instance */
  private settingsApi: SettingsApi;
  
  /** Indexing API instance */
  private indexingApi: IndexingApi;
  
  /** Settings service instance */
  private settingsService!: SettingsService;

  /** Indexing service instance */
  private indexingService!: IndexingService;

  /** File processor service */
  private fileProcessor!: FileProcessor;

  /** Embedding provider service */
  private embeddingProvider!: EmbeddingProvider;

  /** Qdrant service */
  private qdrantService!: QdrantService;

  /**
   * Creates a new RagMessageHandler instance
   *
   * @param context VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this.context = context;

    // Initialize services
    this.initializeServices();

    // Initialize APIs
    this.settingsApi = new SettingsApi(this.settingsService);
    this.indexingApi = new IndexingApi(this.indexingService);
  }
  
  /**
   * Initialize all backend services
   */
  private initializeServices(): void {
    // Initialize settings service
    this.settingsService = new SettingsService(this.context);
    
    // Initialize embedding provider
    this.embeddingProvider = new EmbeddingProvider(this.context);
    
    // Initialize file processor
    this.fileProcessor = new FileProcessor(this.context);
    
    // Initialize Qdrant service with default settings
    const defaultQdrantSettings = {
      host: 'localhost',
      port: 6333,
      collectionName: 'code-embeddings',
    };
    this.qdrantService = new QdrantService(this.context, defaultQdrantSettings);
    
    // Initialize indexing service
    this.indexingService = new IndexingService(
      this.context,
      this.fileProcessor,
      this.embeddingProvider,
      this.qdrantService
    );
  }
  
  /**
   * Handle RAG-specific messages
   * 
   * This method should be called from the main message router to handle
   * RAG for LLM specific commands.
   * 
   * @param message Message from webview
   * @param webview VS Code webview instance
   * @returns True if message was handled, false otherwise
   */
  public async handleMessage(message: any, webview: vscode.Webview): Promise<boolean> {
    try {
      console.log('RagMessageHandler: Handling message:', message.command);
      
      switch (message.command) {
        // Settings API endpoints
        case 'getSettings':
          await this.settingsApi.handleGetSettings(message, webview);
          return true;
          
        case 'postSettings':
          await this.settingsApi.handlePostSettings(message, webview);
          return true;
          
        // Indexing API endpoints
        case 'getIndexingStatus':
          await this.indexingApi.handleGetIndexingStatus(message, webview);
          return true;
          
        case 'postIndexingStart':
          await this.indexingApi.handlePostIndexingStart(message, webview);
          return true;
          
        // Additional utility commands
        case 'testSettings':
          await this.handleTestSettings(message, webview);
          return true;
          
        case 'getIndexingCapabilities':
          await this.handleGetIndexingCapabilities(message, webview);
          return true;
          
        case 'getIndexingStatistics':
          await this.handleGetIndexingStatistics(message, webview);
          return true;
          
        case 'webviewReady':
          await this.handleWebviewReady(message, webview);
          return true;
          
        default:
          // Message not handled by RAG handler
          return false;
      }
      
    } catch (error) {
      console.error('RagMessageHandler: Error handling message:', error);
      
      // Send error response
      await webview.postMessage({
        command: `${message.command}Response`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: message.requestId,
      });
      
      return true; // Message was handled (even if it failed)
    }
  }
  
  /**
   * Handle test settings request
   * 
   * @param message Message from webview
   * @param webview VS Code webview instance
   */
  private async handleTestSettings(message: any, webview: vscode.Webview): Promise<void> {
    try {
      const { settings } = message;
      
      if (!settings) {
        throw new Error('Settings are required for testing');
      }
      
      // Test embedding provider
      await this.embeddingProvider.initialize(settings.embeddingModel);
      const embeddingTest = await this.embeddingProvider.testConnection();
      
      // Test Qdrant connection
      this.qdrantService.updateSettings(settings.qdrantDatabase);
      const qdrantTest = await this.qdrantService.testConnection();
      
      // Send test results
      await webview.postMessage({
        command: 'testSettingsResponse',
        success: embeddingTest.success && qdrantTest.success,
        embeddingTest: {
          success: embeddingTest.success,
          error: embeddingTest.error,
          responseTime: embeddingTest.responseTime,
        },
        qdrantTest: {
          success: qdrantTest.success,
          error: qdrantTest.error,
          responseTime: qdrantTest.responseTime,
        },
        requestId: message.requestId,
      });
      
    } catch (error) {
      await webview.postMessage({
        command: 'testSettingsResponse',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: message.requestId,
      });
    }
  }
  
  /**
   * Handle get indexing capabilities request
   * 
   * @param message Message from webview
   * @param webview VS Code webview instance
   */
  private async handleGetIndexingCapabilities(message: any, webview: vscode.Webview): Promise<void> {
    try {
      const capabilities = this.indexingApi.getIndexingCapabilities();
      
      await webview.postMessage({
        command: 'getIndexingCapabilitiesResponse',
        success: true,
        capabilities,
        requestId: message.requestId,
      });
      
    } catch (error) {
      await webview.postMessage({
        command: 'getIndexingCapabilitiesResponse',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: message.requestId,
      });
    }
  }
  
  /**
   * Handle get indexing statistics request
   * 
   * @param message Message from webview
   * @param webview VS Code webview instance
   */
  private async handleGetIndexingStatistics(message: any, webview: vscode.Webview): Promise<void> {
    try {
      const statistics = this.indexingApi.getIndexingStatistics();
      
      await webview.postMessage({
        command: 'getIndexingStatisticsResponse',
        success: true,
        statistics,
        requestId: message.requestId,
      });
      
    } catch (error) {
      await webview.postMessage({
        command: 'getIndexingStatisticsResponse',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: message.requestId,
      });
    }
  }
  
  /**
   * Handle webview ready notification
   * 
   * @param message Message from webview
   * @param webview VS Code webview instance
   */
  private async handleWebviewReady(message: any, webview: vscode.Webview): Promise<void> {
    try {
      console.log('RagMessageHandler: Webview is ready');
      
      // Send initial state to webview
      const settings = this.settingsService.getSettings();
      const indexingStatus = this.indexingService.getCurrentStatus();
      const validationStatus = this.settingsApi.getValidationStatus();
      
      await webview.postMessage({
        command: 'initialState',
        data: {
          isWorkspaceOpen: !!vscode.workspace.workspaceFolders?.length,
          settings,
          indexingStatus,
          validationStatus,
        },
      });
      
    } catch (error) {
      console.error('RagMessageHandler: Failed to send initial state:', error);
    }
  }
  
  /**
   * Initialize the message handler
   * 
   * This method should be called during extension activation to set up
   * the services and prepare for message handling.
   */
  public async initialize(): Promise<void> {
    try {
      console.log('RagMessageHandler: Initializing...');
      
      // Initialize embedding provider with current settings
      const settings = this.settingsService.getSettings();
      if (settings.embeddingModel.apiKey) {
        await this.embeddingProvider.initialize(settings.embeddingModel);
      }
      
      // Update Qdrant service with current settings
      this.qdrantService.updateSettings(settings.qdrantDatabase);
      
      console.log('RagMessageHandler: Initialization complete');
      
    } catch (error) {
      console.error('RagMessageHandler: Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Clean up any resources if needed
    console.log('RagMessageHandler: Disposing resources');
  }
}
