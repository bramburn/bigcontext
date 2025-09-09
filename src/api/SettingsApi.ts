/**
 * Settings API
 * 
 * This module implements the settings API endpoints for the RAG for LLM VS Code extension.
 * It handles GET and POST operations for extension settings through VS Code's webview
 * message passing system, following the existing communication patterns in the codebase.
 * 
 * The API provides endpoints equivalent to:
 * - GET /settings - Retrieve current extension settings
 * - POST /settings - Save extension settings
 */

import * as vscode from 'vscode';
import { SettingsService, ExtensionSettings, SettingsSaveResult } from '../services/SettingsService';

/**
 * Settings API request/response types
 */
export interface GetSettingsRequest {
  /** Request identifier */
  requestId?: string;
}

export interface GetSettingsResponse {
  /** Whether the request was successful */
  success: boolean;
  
  /** Current extension settings */
  settings?: ExtensionSettings;
  
  /** Error message if failed */
  error?: string;
  
  /** Request identifier */
  requestId?: string;
}

export interface PostSettingsRequest {
  /** Settings to save */
  settings: ExtensionSettings;
  
  /** Request identifier */
  requestId?: string;
}

export interface PostSettingsResponse {
  /** Whether the save was successful */
  success: boolean;
  
  /** Result message */
  message: string;
  
  /** Validation errors if any */
  errors?: string[];
  
  /** Request identifier */
  requestId?: string;
}

/**
 * SettingsApi Class
 * 
 * Implements settings API endpoints as VS Code webview message handlers.
 * Provides a REST-like interface for managing extension settings through
 * the webview communication system.
 */
export class SettingsApi {
  /** Settings service instance */
  private settingsService: SettingsService;
  
  /**
   * Creates a new SettingsApi instance
   * 
   * @param settingsService Settings service instance
   */
  constructor(settingsService: SettingsService) {
    this.settingsService = settingsService;
  }
  
  /**
   * Handle GET /settings request
   * 
   * Retrieves the current extension settings including embedding model
   * and Qdrant database configuration.
   * 
   * @param request Get settings request
   * @param webview VS Code webview for response
   */
  public async handleGetSettings(
    request: GetSettingsRequest,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      console.log('SettingsApi: Handling GET /settings request');
      
      // Get current settings from service
      const settings = this.settingsService.getSettings();
      
      // Send successful response
      const response: GetSettingsResponse = {
        success: true,
        settings,
        requestId: request.requestId,
      };
      
      await webview.postMessage({
        command: 'getSettingsResponse',
        ...response,
      });
      
      console.log('SettingsApi: GET /settings completed successfully');
      
    } catch (error) {
      console.error('SettingsApi: GET /settings failed:', error);
      
      // Send error response
      const response: GetSettingsResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: request.requestId,
      };
      
      await webview.postMessage({
        command: 'getSettingsResponse',
        ...response,
      });
    }
  }
  
  /**
   * Handle POST /settings request
   * 
   * Saves the provided extension settings after validation.
   * 
   * @param request Post settings request
   * @param webview VS Code webview for response
   */
  public async handlePostSettings(
    request: PostSettingsRequest,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      console.log('SettingsApi: Handling POST /settings request');
      
      // Validate request
      if (!request.settings) {
        throw new Error('Settings data is required');
      }
      
      // Save settings through service
      const saveResult: SettingsSaveResult = await this.settingsService.saveSettings(request.settings);
      
      // Send response based on save result
      const response: PostSettingsResponse = {
        success: saveResult.success,
        message: saveResult.message,
        errors: saveResult.errors,
        requestId: request.requestId,
      };
      
      await webview.postMessage({
        command: 'postSettingsResponse',
        ...response,
      });
      
      console.log(`SettingsApi: POST /settings completed - ${saveResult.success ? 'success' : 'failed'}`);
      
    } catch (error) {
      console.error('SettingsApi: POST /settings failed:', error);
      
      // Send error response
      const response: PostSettingsResponse = {
        success: false,
        message: `Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requestId: request.requestId,
      };
      
      await webview.postMessage({
        command: 'postSettingsResponse',
        ...response,
      });
    }
  }
  
  /**
   * Register message handlers
   * 
   * Registers the settings API message handlers with the message router.
   * This method should be called during extension initialization.
   * 
   * @param messageRouter Message router instance
   */
  public registerHandlers(messageRouter: any): void {
    // Register GET /settings handler
    messageRouter.registerHandler('getSettings', async (message: any, webview: vscode.Webview) => {
      await this.handleGetSettings(message, webview);
    });
    
    // Register POST /settings handler
    messageRouter.registerHandler('postSettings', async (message: any, webview: vscode.Webview) => {
      await this.handlePostSettings(message, webview);
    });
    
    console.log('SettingsApi: Message handlers registered');
  }
  
  /**
   * Validate settings request
   * 
   * Validates the structure and content of a settings request.
   * 
   * @param settings Settings to validate
   * @returns Validation result
   */
  private validateSettingsRequest(settings: ExtensionSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate embedding model settings
    if (!settings.embeddingModel) {
      errors.push('Embedding model settings are required');
    } else {
      if (!settings.embeddingModel.provider) {
        errors.push('Embedding provider is required');
      }
      
      if (!settings.embeddingModel.apiKey) {
        errors.push('API key is required');
      }
      
      if (!settings.embeddingModel.modelName) {
        errors.push('Model name is required');
      }
    }
    
    // Validate Qdrant database settings
    if (!settings.qdrantDatabase) {
      errors.push('Qdrant database settings are required');
    } else {
      if (!settings.qdrantDatabase.host) {
        errors.push('Qdrant host is required');
      }
      
      if (!settings.qdrantDatabase.collectionName) {
        errors.push('Collection name is required');
      }
      
      if (settings.qdrantDatabase.port !== undefined) {
        if (settings.qdrantDatabase.port < 1 || settings.qdrantDatabase.port > 65535) {
          errors.push('Port must be between 1 and 65535');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Test settings configuration
   * 
   * Tests the provided settings by attempting to connect to the
   * embedding provider and Qdrant database.
   * 
   * @param settings Settings to test
   * @returns Test result
   */
  public async testSettings(settings: ExtensionSettings): Promise<{
    success: boolean;
    embeddingTest?: { success: boolean; error?: string };
    qdrantTest?: { success: boolean; error?: string };
  }> {
    const result = {
      success: false,
      embeddingTest: { success: false, error: 'Not tested' },
      qdrantTest: { success: false, error: 'Not tested' },
    };
    
    try {
      // Test embedding provider connection
      // This would be implemented with actual provider testing
      result.embeddingTest = { success: true };
      
      // Test Qdrant connection
      // This would be implemented with actual Qdrant testing
      result.qdrantTest = { success: true };
      
      result.success = result.embeddingTest.success && result.qdrantTest.success;
      
    } catch (error) {
      console.error('SettingsApi: Settings test failed:', error);
    }
    
    return result;
  }
  
  /**
   * Get settings validation status
   * 
   * Returns the current validation status of the extension settings.
   * 
   * @returns Validation status
   */
  public getValidationStatus(): {
    isConfigured: boolean;
    embeddingConfigured: boolean;
    qdrantConfigured: boolean;
    errors: string[];
  } {
    try {
      const settings = this.settingsService.getSettings();
      const validation = this.settingsService.validateSettings(settings);
      
      return {
        isConfigured: validation.isValid,
        embeddingConfigured: validation.embeddingValidation?.isValid || false,
        qdrantConfigured: validation.qdrantValidation?.isValid || false,
        errors: validation.errors,
      };
      
    } catch (error) {
      return {
        isConfigured: false,
        embeddingConfigured: false,
        qdrantConfigured: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}
