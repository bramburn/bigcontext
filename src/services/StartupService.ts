/**
 * Startup Service
 * 
 * Manages the application startup flow with persistent configuration,
 * Qdrant index validation, and automatic reindexing when needed.
 */

import * as vscode from 'vscode';
import { ConfigurationService } from './ConfigurationService';
import { QdrantService } from '../db/qdrantService';
import { IndexingService } from '../indexing/indexingService';
import { Configuration } from '../types/configuration';

/**
 * Startup flow result
 */
export interface StartupResult {
  /** Whether startup was successful */
  success: boolean;
  /** The loaded configuration */
  configuration: Configuration;
  /** Whether reindexing was triggered */
  reindexingTriggered: boolean;
  /** Whether the user should be directed to search */
  shouldShowSearch: boolean;
  /** Any errors encountered during startup */
  errors: string[];
  /** Informational messages */
  messages: string[];
}

/**
 * Startup service that orchestrates the application initialization
 */
export class StartupService {
  private configurationService: ConfigurationService;
  private qdrantService?: QdrantService;
  private indexingService?: IndexingService;
  private workspaceRoot: string;

  /**
   * Creates a new startup service
   * 
   * @param workspaceRoot The workspace root directory
   * @param qdrantService Optional Qdrant service for index validation
   * @param indexingService Optional indexing service for reindexing
   */
  constructor(
    workspaceRoot: string,
    qdrantService?: QdrantService,
    indexingService?: IndexingService
  ) {
    this.workspaceRoot = workspaceRoot;
    this.qdrantService = qdrantService;
    this.indexingService = indexingService;
    this.configurationService = new ConfigurationService(workspaceRoot, qdrantService);
  }

  /**
   * Executes the startup flow
   * 
   * @returns Startup result with configuration and next steps
   */
  public async executeStartupFlow(): Promise<StartupResult> {
    const result: StartupResult = {
      success: false,
      configuration: {} as Configuration,
      reindexingTriggered: false,
      shouldShowSearch: false,
      errors: [],
      messages: [],
    };

    try {
      console.log('StartupService: Beginning startup flow...');
      
      // Step 1: Load configuration
      result.configuration = await this.configurationService.loadConfiguration();
      result.messages.push('Configuration loaded successfully');
      
      // Step 2: Validate configuration
      const validation = this.configurationService.validateConfiguration(result.configuration);
      if (!validation.isValid) {
        result.errors.push(...validation.errors);
        result.messages.push('Configuration validation failed - using defaults');
        
        // Show error to user but continue with defaults
        vscode.window.showWarningMessage(
          'Configuration validation failed. Using default settings. ' +
          'Please check your .context/config.json file.'
        );
      }
      
      if (validation.warnings.length > 0) {
        result.messages.push(...validation.warnings);
      }
      
      // Step 3: Check if Qdrant and Ollama settings are valid
      const hasValidSettings = await this.validateExternalServices(result.configuration);
      if (!hasValidSettings) {
        result.errors.push('Qdrant or Ollama settings are invalid');
        result.messages.push('External services not available - setup required');
        result.success = true; // Still successful, but user needs to configure
        return result;
      }
      
      // Step 4: Check if reindexing is needed
      const needsReindexing = await this.configurationService.isReindexingNeeded();
      
      if (needsReindexing) {
        result.messages.push('Reindexing needed due to missing or invalid index');
        
        // Trigger reindexing if indexing service is available
        if (this.indexingService) {
          result.reindexingTriggered = await this.triggerReindexing();
          if (result.reindexingTriggered) {
            result.messages.push('Reindexing started successfully');
          } else {
            result.errors.push('Failed to start reindexing');
          }
        } else {
          result.messages.push('Indexing service not available - manual indexing required');
        }
      } else {
        result.messages.push('Index is valid - no reindexing needed');
        result.shouldShowSearch = true;
      }
      
      result.success = true;
      console.log('StartupService: Startup flow completed successfully');
      
    } catch (error) {
      const errorMessage = `Startup flow failed: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMessage);
      console.error('StartupService:', errorMessage, error);
      
      // Even on error, try to provide a basic configuration
      try {
        result.configuration = this.configurationService.getConfiguration();
      } catch {
        // Use empty configuration as last resort
      }
    }
    
    return result;
  }

  /**
   * Gets the configuration service instance
   */
  public getConfigurationService(): ConfigurationService {
    return this.configurationService;
  }

  /**
   * Validates external services (Qdrant and Ollama)
   * 
   * @param config The configuration to validate
   * @returns True if services are accessible
   */
  private async validateExternalServices(config: Configuration): Promise<boolean> {
    try {
      // Check Qdrant connection
      if (this.qdrantService) {
        const qdrantHealthy = await this.qdrantService.healthCheck();
        if (!qdrantHealthy) {
          console.warn('StartupService: Qdrant service is not healthy');
          return false;
        }
      }
      
      // TODO: Add Ollama validation when available
      // For now, assume Ollama is available if endpoint is configured
      if (!config.ollama.endpoint || !config.ollama.model) {
        console.warn('StartupService: Ollama configuration is incomplete');
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('StartupService: Error validating external services:', error);
      return false;
    }
  }

  /**
   * Triggers the reindexing process
   * 
   * @returns True if reindexing was started successfully
   */
  private async triggerReindexing(): Promise<boolean> {
    try {
      if (!this.indexingService) {
        console.error('StartupService: No indexing service available for reindexing');
        return false;
      }
      
      console.log('StartupService: Starting reindexing process...');
      
      // Clear existing index info since we're reindexing
      await this.configurationService.clearQdrantIndexInfo();
      
      // Start indexing (this is typically an async operation)
      // The indexing service should update the configuration when complete
      await this.indexingService.startIndexing();
      
      return true;
      
    } catch (error) {
      console.error('StartupService: Failed to trigger reindexing:', error);
      return false;
    }
  }

  /**
   * Updates the Qdrant index information after successful indexing
   * This should be called by the indexing service when indexing completes
   * 
   * @param collectionName The name of the collection that was indexed
   */
  public async updateIndexInfo(collectionName: string): Promise<void> {
    try {
      const contentHash = await this.configurationService.generateContentHash();
      
      await this.configurationService.updateQdrantIndexInfo({
        collectionName,
        lastIndexedTimestamp: new Date().toISOString(),
        contentHash,
      });
      
      console.log('StartupService: Index information updated successfully');
      
    } catch (error) {
      console.error('StartupService: Failed to update index info:', error);
    }
  }
}
