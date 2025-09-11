/**
 * Sidecar Configuration Management
 * 
 * Manages configuration for the FastAPI sidecar service, including
 * validation, defaults, and integration with VS Code settings.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';

export interface SidecarConfiguration {
  // Process configuration
  pythonPath: string;
  sidecarPath: string;
  autoStart: boolean;
  autoRestart: boolean;
  
  // Network configuration
  portRange: {
    start: number;
    end: number;
  };
  preferredPort?: number;
  
  // Health monitoring
  healthCheckInterval: number;
  maxStartupTime: number;
  maxRestartAttempts: number;
  
  // Logging
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  enableFileLogging: boolean;
  logDirectory?: string;
  
  // Database integration
  databaseConnections: DatabaseConnectionConfig[];
  autoRegisterDatabases: boolean;
  
  // Performance
  requestTimeout: number;
  maxConcurrentRequests: number;
}

export interface DatabaseConnectionConfig {
  name: string;
  connectionString: string;
  connectionType: 'qdrant' | 'other';
  enabled: boolean;
  timeout: number;
  autoRegister: boolean;
}

export interface SidecarConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SidecarConfigManager {
  private static readonly CONFIG_SECTION = 'code-context-engine.sidecar';
  private loggingService: CentralizedLoggingService;
  private configChangeListener?: vscode.Disposable;

  constructor(loggingService: CentralizedLoggingService) {
    this.loggingService = loggingService;
    this.setupConfigurationWatcher();
  }

  /**
   * Get the current sidecar configuration
   */
  public getConfiguration(): SidecarConfiguration {
    const config = vscode.workspace.getConfiguration(SidecarConfigManager.CONFIG_SECTION);
    const extensionPath = this.getExtensionPath();

    return {
      // Process configuration
      pythonPath: config.get<string>('pythonPath') || this.detectPythonPath(),
      sidecarPath: config.get<string>('sidecarPath') || path.join(extensionPath, 'sidecar'),
      autoStart: config.get<boolean>('autoStart') ?? true,
      autoRestart: config.get<boolean>('autoRestart') ?? true,
      
      // Network configuration
      portRange: {
        start: config.get<number>('portRange.start') || 8000,
        end: config.get<number>('portRange.end') || 9000,
      },
      preferredPort: config.get<number>('preferredPort'),
      
      // Health monitoring
      healthCheckInterval: config.get<number>('healthCheckInterval') || 30000,
      maxStartupTime: config.get<number>('maxStartupTime') || 30000,
      maxRestartAttempts: config.get<number>('maxRestartAttempts') || 3,
      
      // Logging
      logLevel: config.get<'DEBUG' | 'INFO' | 'WARN' | 'ERROR'>('logLevel') || 'INFO',
      enableFileLogging: config.get<boolean>('enableFileLogging') ?? true,
      logDirectory: config.get<string>('logDirectory'),
      
      // Database integration
      databaseConnections: this.getDatabaseConnections(),
      autoRegisterDatabases: config.get<boolean>('autoRegisterDatabases') ?? true,
      
      // Performance
      requestTimeout: config.get<number>('requestTimeout') || 30000,
      maxConcurrentRequests: config.get<number>('maxConcurrentRequests') || 10,
    };
  }

  /**
   * Validate the sidecar configuration
   */
  public validateConfiguration(config?: SidecarConfiguration): SidecarConfigValidationResult {
    const cfg = config || this.getConfiguration();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate Python path
    if (!cfg.pythonPath) {
      errors.push('Python path is required');
    } else if (!this.isPythonPathValid(cfg.pythonPath)) {
      errors.push(`Invalid Python path: ${cfg.pythonPath}`);
    }

    // Validate sidecar path
    if (!cfg.sidecarPath) {
      errors.push('Sidecar path is required');
    } else if (!fs.existsSync(cfg.sidecarPath)) {
      errors.push(`Sidecar path does not exist: ${cfg.sidecarPath}`);
    } else {
      const mainPyPath = path.join(cfg.sidecarPath, 'main.py');
      if (!fs.existsSync(mainPyPath)) {
        errors.push(`Sidecar main.py not found at: ${mainPyPath}`);
      }
    }

    // Validate port range
    if (cfg.portRange.start < 1024) {
      warnings.push('Port range starts below 1024 - may require elevated privileges');
    }
    if (cfg.portRange.end > 65535) {
      errors.push('Port range end cannot exceed 65535');
    }
    if (cfg.portRange.start >= cfg.portRange.end) {
      errors.push('Port range start must be less than end');
    }
    if (cfg.portRange.end - cfg.portRange.start < 10) {
      warnings.push('Small port range may cause conflicts');
    }

    // Validate preferred port
    if (cfg.preferredPort) {
      if (cfg.preferredPort < cfg.portRange.start || cfg.preferredPort > cfg.portRange.end) {
        warnings.push('Preferred port is outside the configured port range');
      }
    }

    // Validate timeouts
    if (cfg.healthCheckInterval < 5000) {
      warnings.push('Health check interval is very short - may impact performance');
    }
    if (cfg.maxStartupTime < 10000) {
      warnings.push('Max startup time is very short - may cause startup failures');
    }
    if (cfg.requestTimeout < 1000) {
      warnings.push('Request timeout is very short - may cause request failures');
    }

    // Validate database connections
    for (const dbConfig of cfg.databaseConnections) {
      if (!dbConfig.name) {
        errors.push('Database connection name is required');
      }
      if (!dbConfig.connectionString) {
        errors.push(`Database connection string is required for: ${dbConfig.name}`);
      }
      if (dbConfig.timeout < 1000) {
        warnings.push(`Database timeout is very short for: ${dbConfig.name}`);
      }
    }

    // Validate log directory
    if (cfg.enableFileLogging && cfg.logDirectory) {
      if (!fs.existsSync(cfg.logDirectory)) {
        try {
          fs.mkdirSync(cfg.logDirectory, { recursive: true });
        } catch (error) {
          errors.push(`Cannot create log directory: ${cfg.logDirectory}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Update configuration with validation
   */
  public async updateConfiguration(updates: Partial<SidecarConfiguration>): Promise<boolean> {
    try {
      const config = vscode.workspace.getConfiguration(SidecarConfigManager.CONFIG_SECTION);
      
      // Apply updates
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          await config.update(key, value, vscode.ConfigurationTarget.Workspace);
        }
      }

      // Validate the updated configuration
      const validation = this.validateConfiguration();
      if (!validation.isValid) {
        this.loggingService.error('Configuration validation failed', {
          errors: validation.errors,
        }, 'SidecarConfigManager');
        return false;
      }

      if (validation.warnings.length > 0) {
        this.loggingService.warn('Configuration warnings', {
          warnings: validation.warnings,
        }, 'SidecarConfigManager');
      }

      this.loggingService.info('Sidecar configuration updated', {
        updates: Object.keys(updates),
      }, 'SidecarConfigManager');

      return true;
    } catch (error) {
      this.loggingService.error('Failed to update configuration', {
        error: error instanceof Error ? error.message : String(error),
      }, 'SidecarConfigManager');
      return false;
    }
  }

  /**
   * Reset configuration to defaults
   */
  public async resetToDefaults(): Promise<void> {
    const config = vscode.workspace.getConfiguration(SidecarConfigManager.CONFIG_SECTION);
    
    // Get all configuration keys and reset them
    const keys = [
      'pythonPath', 'sidecarPath', 'autoStart', 'autoRestart',
      'portRange', 'preferredPort', 'healthCheckInterval', 'maxStartupTime',
      'maxRestartAttempts', 'logLevel', 'enableFileLogging', 'logDirectory',
      'databaseConnections', 'autoRegisterDatabases', 'requestTimeout',
      'maxConcurrentRequests'
    ];

    for (const key of keys) {
      await config.update(key, undefined, vscode.ConfigurationTarget.Workspace);
    }

    this.loggingService.info('Sidecar configuration reset to defaults', {}, 'SidecarConfigManager');
  }

  /**
   * Export configuration to file
   */
  public async exportConfiguration(filePath: string): Promise<boolean> {
    try {
      const config = this.getConfiguration();
      const configJson = JSON.stringify(config, null, 2);
      
      fs.writeFileSync(filePath, configJson, 'utf8');
      
      this.loggingService.info('Configuration exported', { filePath }, 'SidecarConfigManager');
      return true;
    } catch (error) {
      this.loggingService.error('Failed to export configuration', {
        error: error instanceof Error ? error.message : String(error),
        filePath,
      }, 'SidecarConfigManager');
      return false;
    }
  }

  /**
   * Import configuration from file
   */
  public async importConfiguration(filePath: string): Promise<boolean> {
    try {
      const configJson = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(configJson) as Partial<SidecarConfiguration>;
      
      const success = await this.updateConfiguration(config);
      if (success) {
        this.loggingService.info('Configuration imported', { filePath }, 'SidecarConfigManager');
      }
      
      return success;
    } catch (error) {
      this.loggingService.error('Failed to import configuration', {
        error: error instanceof Error ? error.message : String(error),
        filePath,
      }, 'SidecarConfigManager');
      return false;
    }
  }

  /**
   * Get database connections from configuration
   */
  private getDatabaseConnections(): DatabaseConnectionConfig[] {
    const config = vscode.workspace.getConfiguration(SidecarConfigManager.CONFIG_SECTION);
    const connections = config.get<DatabaseConnectionConfig[]>('databaseConnections') || [];
    
    // Add default Qdrant connection if none exist
    if (connections.length === 0) {
      const qdrantUrl = vscode.workspace.getConfiguration('code-context-engine.qdrant').get<string>('url');
      if (qdrantUrl) {
        connections.push({
          name: 'default-qdrant',
          connectionString: qdrantUrl,
          connectionType: 'qdrant',
          enabled: true,
          timeout: 30000,
          autoRegister: true,
        });
      }
    }
    
    return connections;
  }

  /**
   * Detect Python path
   */
  private detectPythonPath(): string {
    // Try common Python paths
    const commonPaths = ['python3', 'python', 'py'];
    
    for (const pythonCmd of commonPaths) {
      if (this.isPythonPathValid(pythonCmd)) {
        return pythonCmd;
      }
    }
    
    return 'python'; // Fallback
  }

  /**
   * Validate Python path
   */
  private isPythonPathValid(pythonPath: string): boolean {
    try {
      const { execSync } = require('child_process');
      execSync(`${pythonPath} --version`, { timeout: 5000, stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get extension path
   */
  private getExtensionPath(): string {
    const extension = vscode.extensions.getExtension('your-extension-id');
    return extension?.extensionPath || '';
  }

  /**
   * Setup configuration change watcher
   */
  private setupConfigurationWatcher(): void {
    this.configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(SidecarConfigManager.CONFIG_SECTION)) {
        this.loggingService.info('Sidecar configuration changed', {}, 'SidecarConfigManager');
        
        // Validate new configuration
        const validation = this.validateConfiguration();
        if (!validation.isValid) {
          vscode.window.showErrorMessage(
            `Sidecar configuration errors: ${validation.errors.join(', ')}`
          );
        } else if (validation.warnings.length > 0) {
          vscode.window.showWarningMessage(
            `Sidecar configuration warnings: ${validation.warnings.join(', ')}`
          );
        }
      }
    });
  }

  /**
   * Dispose of the configuration manager
   */
  public dispose(): void {
    if (this.configChangeListener) {
      this.configChangeListener.dispose();
    }
  }
}
