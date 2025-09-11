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
import { GitIgnoreManager } from './GitIgnoreManager';
import { Configuration } from '../types/configuration';

/**
 * Startup flow result
 */
export interface StartupResult {
  /** The action to take next */
  action: 'showSetup' | 'proceedToSearch' | 'triggerReindexing';
  /** The reason for the action */
  reason: string;
  /** Whether configuration was loaded successfully */
  configurationLoaded: boolean;
  /** Whether Qdrant connection was successful */
  qdrantConnected: boolean;
  /** Whether the index is valid */
  indexValid: boolean;
  /** Whether reindexing is needed */
  reindexingNeeded: boolean;
}

/**
 * Startup service that orchestrates the application initialization
 */
export class StartupService {
  private configurationService: ConfigurationService;
  private qdrantService?: QdrantService;
  private gitIgnoreManager: GitIgnoreManager;

  /**
   * Creates a new startup service
   *
   * @param configurationService The configuration service
   * @param qdrantService Optional Qdrant service for index validation
   * @param gitIgnoreManager Git ignore manager for .gitignore operations
   */
  constructor(
    configurationService: ConfigurationService,
    qdrantService?: QdrantService,
    gitIgnoreManager?: GitIgnoreManager
  ) {
    this.configurationService = configurationService;
    this.qdrantService = qdrantService;
    this.gitIgnoreManager = gitIgnoreManager || new GitIgnoreManager();
  }

  /**
   * Executes the startup flow
   *
   * @param workspacePath The workspace path to analyze
   * @returns Startup result with configuration and next steps
   */
  public async executeStartupFlow(workspacePath: string): Promise<StartupResult> {
    const result: StartupResult = {
      action: 'showSetup',
      reason: 'No configuration found',
      configurationLoaded: false,
      qdrantConnected: false,
      indexValid: false,
      reindexingNeeded: false,
    };

    try {
      console.log('StartupService: Beginning startup flow...');

      // Step 1: Load configuration
      try {
        await this.configurationService.loadConfiguration();
        result.configurationLoaded = true;
      } catch (error) {
        result.reason = `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`;
        return result;
      }

      // Step 2: Check if configuration file exists
      const configExists = await this.configurationService.configurationFileExists();
      if (!configExists) {
        result.reason = 'No configuration found';
        result.action = 'showSetup';

        // Ensure .gitignore is set up
        try {
          await this.gitIgnoreManager.ensureConfigPatternPresent(workspacePath);
        } catch (error) {
          console.warn('Failed to update .gitignore:', error);
        }

        return result;
      }

      // Step 3: Test Qdrant connection
      if (this.qdrantService) {
        try {
          result.qdrantConnected = await this.qdrantService.healthCheck();
        } catch (error) {
          result.qdrantConnected = false;
        }
      }

      if (!result.qdrantConnected) {
        result.reason = 'Qdrant connection failed';
        result.action = 'showSetup';
        return result;
      }

      // Step 4: Check if index is valid
      const config = this.configurationService.getConfiguration();
      if (config.qdrant.indexInfo?.collectionName && this.qdrantService) {
        try {
          result.indexValid = await this.qdrantService.collectionExists(
            config.qdrant.indexInfo.collectionName
          );
        } catch (error) {
          result.indexValid = false;
        }
      }

      // Step 5: Check if reindexing is needed
      if (result.indexValid) {
        try {
          result.reindexingNeeded =
            await this.configurationService.isReindexingNeeded(workspacePath);
        } catch (error) {
          result.reindexingNeeded = false;
        }
      } else {
        result.reindexingNeeded = true;
      }

      // Step 6: Determine action
      if (!result.indexValid) {
        result.action = 'triggerReindexing';
        result.reason = 'Index collection does not exist';
        result.reindexingNeeded = true;
      } else if (result.reindexingNeeded) {
        result.action = 'triggerReindexing';
        result.reason = 'Content has changed since last indexing';
      } else {
        result.action = 'proceedToSearch';
        result.reason = 'Configuration valid, index exists';
      }

      console.log('StartupService: Startup flow completed successfully');
    } catch (error) {
      const errorMessage = `Startup flow failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error('StartupService:', errorMessage, error);

      result.action = 'showSetup';
      result.reason = errorMessage;
    }

    return result;
  }

  /**
   * Gets the configuration service instance
   */
  public getConfigurationService(): ConfigurationService {
    return this.configurationService;
  }
}
