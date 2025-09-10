/**
 * Indexing API
 * 
 * This module implements the indexing API endpoints for the RAG for LLM VS Code extension.
 * It handles GET and POST operations for indexing status and control through VS Code's
 * webview message passing system, following the existing communication patterns.
 * 
 * The API provides endpoints equivalent to:
 * - GET /indexing-status - Retrieve current indexing progress and status
 * - POST /indexing-start - Start, pause, resume, or stop indexing process
 */

import * as vscode from 'vscode';
import { IndexingService, IndexingSession } from '../services/IndexingService';
import { IndexingProgress, IndexingOperationResult } from '../models/indexingProgress';

/**
 * Indexing API request/response types
 */
export interface GetIndexingStatusRequest {
  /** Request identifier */
  requestId?: string;
}

export interface GetIndexingStatusResponse {
  /** Whether the request was successful */
  success: boolean;
  
  /** Current indexing progress */
  progress?: IndexingProgress;
  
  /** Error message if failed */
  error?: string;
  
  /** Request identifier */
  requestId?: string;
}

export interface PostIndexingStartRequest {
  /** Action to perform: 'start', 'pause', 'resume', 'stop' */
  action: 'start' | 'pause' | 'resume' | 'stop';
  
  /** Request identifier */
  requestId?: string;
}

export interface PostIndexingStartResponse {
  /** Whether the operation was successful */
  success: boolean;
  
  /** Operation result message */
  message: string;
  
  /** Operation details */
  details?: {
    sessionId?: string;
    estimatedDuration?: number;
    filesQueued?: number;
  };
  
  /** Error information if failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  /** Request identifier */
  requestId?: string;
}

/**
 * IndexingApi Class
 * 
 * Implements indexing API endpoints as VS Code webview message handlers.
 * Provides a REST-like interface for managing indexing operations through
 * the webview communication system.
 */
export class IndexingApi {
  /** Indexing service instance */
  private indexingService: IndexingService;
  
  /** Progress update callback for webview notifications */
  private progressCallback?: (progress: IndexingProgress) => void;
  
  /**
   * Creates a new IndexingApi instance
   * 
   * @param indexingService Indexing service instance
   */
  constructor(indexingService: IndexingService) {
    this.indexingService = indexingService;
  }
  
  /**
   * Handle GET /indexing-status request
   * 
   * Retrieves the current indexing progress and status information.
   * 
   * @param request Get indexing status request
   * @param webview VS Code webview for response
   */
  public async handleGetIndexingStatus(
    request: GetIndexingStatusRequest,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      console.log('IndexingApi: Handling GET /indexing-status request');
      
      // Get current indexing status from service
      const progress = this.indexingService.getCurrentStatus();
      
      // Send successful response
      const response: GetIndexingStatusResponse = {
        success: true,
        progress,
        requestId: request.requestId,
      };
      
      await webview.postMessage({
        command: 'getIndexingStatusResponse',
        ...response,
      });
      
      console.log('IndexingApi: GET /indexing-status completed successfully');
      
    } catch (error) {
      console.error('IndexingApi: GET /indexing-status failed:', error);
      
      // Send error response
      const response: GetIndexingStatusResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: request.requestId,
      };
      
      await webview.postMessage({
        command: 'getIndexingStatusResponse',
        ...response,
      });
    }
  }
  
  /**
   * Handle POST /indexing-start request
   * 
   * Starts, pauses, resumes, or stops the indexing process based on the action.
   * 
   * @param request Post indexing start request
   * @param webview VS Code webview for response
   */
  public async handlePostIndexingStart(
    request: PostIndexingStartRequest,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      console.log(`IndexingApi: Handling POST /indexing-start request with action: ${request.action}`);
      
      // Validate request
      if (!request.action) {
        throw new Error('Action is required');
      }
      
      if (!['start', 'pause', 'resume', 'stop'].includes(request.action)) {
        throw new Error('Invalid action. Must be one of: start, pause, resume, stop');
      }
      
      let operationResult: IndexingOperationResult;
      
      // Execute the requested action
      switch (request.action) {
        case 'start':
          // Set up progress callback to send updates to webview
          this.progressCallback = (progress: IndexingProgress) => {
            webview.postMessage({
              command: 'indexingProgressUpdate',
              progress,
            });
          };

          await this.indexingService.startIndexing();
          operationResult = { success: true, message: 'Indexing started successfully' };
          break;

        case 'pause':
          await this.indexingService.pauseIndexing();
          operationResult = { success: true, message: 'Indexing paused successfully' };
          break;

        case 'resume':
          await this.indexingService.resumeIndexing();
          operationResult = { success: true, message: 'Indexing resumed successfully' };
          break;
          
        case 'stop':
          operationResult = await this.indexingService.stopIndexing();
          this.progressCallback = undefined; // Clear callback
          break;
          
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }
      
      // Send response based on operation result
      const response: PostIndexingStartResponse = {
        success: operationResult.success,
        message: operationResult.message,
        details: operationResult.details,
        error: operationResult.error,
        requestId: request.requestId,
      };
      
      await webview.postMessage({
        command: 'postIndexingStartResponse',
        ...response,
      });
      
      console.log(`IndexingApi: POST /indexing-start (${request.action}) completed - ${operationResult.success ? 'success' : 'failed'}`);
      
    } catch (error) {
      console.error('IndexingApi: POST /indexing-start failed:', error);
      
      // Send error response
      const response: PostIndexingStartResponse = {
        success: false,
        message: `Failed to ${request.action} indexing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: {
          code: 'OPERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        requestId: request.requestId,
      };
      
      await webview.postMessage({
        command: 'postIndexingStartResponse',
        ...response,
      });
    }
  }
  
  /**
   * Register message handlers
   * 
   * Registers the indexing API message handlers with the message router.
   * This method should be called during extension initialization.
   * 
   * @param messageRouter Message router instance
   */
  public registerHandlers(messageRouter: any): void {
    // Register GET /indexing-status handler
    messageRouter.registerHandler('getIndexingStatus', async (message: any, webview: vscode.Webview) => {
      await this.handleGetIndexingStatus(message, webview);
    });
    
    // Register POST /indexing-start handler
    messageRouter.registerHandler('postIndexingStart', async (message: any, webview: vscode.Webview) => {
      await this.handlePostIndexingStart(message, webview);
    });
    
    console.log('IndexingApi: Message handlers registered');
  }
  
  /**
   * Send progress update to webview
   * 
   * Sends real-time progress updates to the webview during indexing.
   * 
   * @param webview VS Code webview
   * @param progress Indexing progress
   */
  public async sendProgressUpdate(webview: vscode.Webview, progress: IndexingProgress): Promise<void> {
    try {
      await webview.postMessage({
        command: 'indexingProgressUpdate',
        progress,
      });
    } catch (error) {
      console.error('IndexingApi: Failed to send progress update:', error);
    }
  }
  
  /**
   * Validate indexing action request
   * 
   * Validates the structure and content of an indexing action request.
   * 
   * @param request Request to validate
   * @returns Validation result
   */
  private validateIndexingRequest(request: PostIndexingStartRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!request.action) {
      errors.push('Action is required');
    } else if (!['start', 'pause', 'resume', 'stop'].includes(request.action)) {
      errors.push('Invalid action. Must be one of: start, pause, resume, stop');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Get indexing capabilities
   * 
   * Returns information about the indexing service capabilities and current state.
   * 
   * @returns Indexing capabilities
   */
  public getIndexingCapabilities(): {
    canStart: boolean;
    canPause: boolean;
    canResume: boolean;
    canStop: boolean;
    supportedFileTypes: string[];
    maxFileSize: number;
  } {
    const currentStatus = this.indexingService.getCurrentStatus();
    
    return {
      canStart: currentStatus.status === 'Not Started' || currentStatus.status === 'Completed' || currentStatus.status === 'Error',
      canPause: currentStatus.status === 'In Progress',
      canResume: currentStatus.status === 'Paused',
      canStop: currentStatus.status === 'In Progress' || currentStatus.status === 'Paused',
      supportedFileTypes: ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.go', '.rs'],
      maxFileSize: 1024 * 1024, // 1 MB
    };
  }
  
  /**
   * Get indexing statistics
   * 
   * Returns comprehensive statistics about indexing operations.
   * 
   * @returns Indexing statistics
   */
  public getIndexingStatistics(): {
    totalSessions: number;
    totalFilesProcessed: number;
    totalChunksCreated: number;
    averageProcessingTime: number;
    successRate: number;
    lastSessionInfo?: {
      startTime: string;
      endTime?: string;
      filesProcessed: number;
      status: string;
    };
  } {
    const stats = this.indexingService.getStatistics();
    
    return {
      totalSessions: 0, // Would be tracked in real implementation
      totalFilesProcessed: stats.totalFiles,
      totalChunksCreated: stats.totalChunks,
      averageProcessingTime: stats.averageProcessingTimePerFile,
      successRate: stats.totalFiles > 0 ? (stats.successfulFiles / stats.totalFiles) * 100 : 0,
      lastSessionInfo: undefined, // Would be populated from session history
    };
  }
}
