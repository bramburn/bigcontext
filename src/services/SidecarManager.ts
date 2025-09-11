/**
 * Sidecar Manager Service
 * 
 * Manages the lifecycle of the FastAPI sidecar process, including starting,
 * stopping, health monitoring, and communication with the sidecar service.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';
import { ConfigService } from '../configService';

export interface SidecarConfig {
  pythonPath?: string;
  sidecarPath: string;
  portRange: {
    start: number;
    end: number;
  };
  healthCheckInterval: number;
  maxStartupTime: number;
  autoRestart: boolean;
  logLevel: string;
}

export interface SidecarStatus {
  isRunning: boolean;
  port?: number;
  pid?: number;
  startTime?: Date;
  lastHealthCheck?: Date;
  isHealthy: boolean;
  errorCount: number;
  restartCount: number;
}

export interface SidecarHealthResponse {
  status: string;
  timestamp: string;
  uptime_seconds: number;
}

export interface DatabaseConnectionConfig {
  connection_string: string;
  connection_type: string;
  timeout_seconds?: number;
}

export class SidecarManager implements vscode.Disposable {
  private process?: ChildProcess;
  private status: SidecarStatus;
  private config: SidecarConfig;
  private healthCheckTimer?: NodeJS.Timeout;
  private disposables: vscode.Disposable[] = [];
  private loggingService: CentralizedLoggingService;
  private configService: ConfigService;

  constructor(
    configService: ConfigService,
    loggingService: CentralizedLoggingService
  ) {
    this.configService = configService;
    this.loggingService = loggingService;
    this.config = this.loadConfig();
    this.status = {
      isRunning: false,
      isHealthy: false,
      errorCount: 0,
      restartCount: 0,
    };
  }

  /**
   * Load sidecar configuration
   */
  private loadConfig(): SidecarConfig {
    const extensionPath = vscode.extensions.getExtension('your-extension-id')?.extensionPath || '';
    
    return {
      pythonPath: this.configService.get<string>('sidecar.pythonPath') || 'python',
      sidecarPath: path.join(extensionPath, 'sidecar'),
      portRange: {
        start: this.configService.get<number>('sidecar.portRange.start') || 8000,
        end: this.configService.get<number>('sidecar.portRange.end') || 9000,
      },
      healthCheckInterval: this.configService.get<number>('sidecar.healthCheckInterval') || 30000,
      maxStartupTime: this.configService.get<number>('sidecar.maxStartupTime') || 30000,
      autoRestart: this.configService.get<boolean>('sidecar.autoRestart') || true,
      logLevel: this.configService.get<string>('sidecar.logLevel') || 'INFO',
    };
  }

  /**
   * Start the sidecar process
   */
  public async start(): Promise<boolean> {
    if (this.status.isRunning) {
      this.loggingService.warn('Sidecar is already running', {}, 'SidecarManager');
      return true;
    }

    try {
      this.loggingService.info('Starting sidecar process', {
        pythonPath: this.config.pythonPath,
        sidecarPath: this.config.sidecarPath,
      }, 'SidecarManager');

      // Check if sidecar files exist
      const mainPyPath = path.join(this.config.sidecarPath, 'main.py');
      if (!fs.existsSync(mainPyPath)) {
        throw new Error(`Sidecar main.py not found at: ${mainPyPath}`);
      }

      // Start the process
      this.process = spawn(this.config.pythonPath || 'python', [
        mainPyPath,
        '--port-start', this.config.portRange.start.toString(),
        '--port-end', this.config.portRange.end.toString(),
        '--log-level', this.config.logLevel,
      ], {
        cwd: this.config.sidecarPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONPATH: this.config.sidecarPath,
        },
      });

      this.setupProcessHandlers();
      
      // Wait for startup
      const started = await this.waitForStartup();
      if (started) {
        this.status.isRunning = true;
        this.status.startTime = new Date();
        this.status.pid = this.process?.pid;
        this.startHealthChecks();
        
        this.loggingService.info('Sidecar started successfully', {
          pid: this.status.pid,
          port: this.status.port,
        }, 'SidecarManager');
        
        return true;
      } else {
        throw new Error('Sidecar failed to start within timeout');
      }
    } catch (error) {
      this.loggingService.error('Failed to start sidecar', {
        error: error instanceof Error ? error.message : String(error),
      }, 'SidecarManager');
      
      this.cleanup();
      return false;
    }
  }

  /**
   * Stop the sidecar process
   */
  public async stop(): Promise<void> {
    if (!this.status.isRunning || !this.process) {
      return;
    }

    try {
      this.loggingService.info('Stopping sidecar process', {
        pid: this.status.pid,
      }, 'SidecarManager');

      // Try graceful shutdown first
      if (this.status.port) {
        try {
          await this.sendShutdownRequest();
        } catch (error) {
          this.loggingService.warn('Graceful shutdown failed, forcing termination', {
            error: error instanceof Error ? error.message : String(error),
          }, 'SidecarManager');
        }
      }

      // Force kill if still running
      if (this.process && !this.process.killed) {
        this.process.kill('SIGTERM');
        
        // Wait a bit, then force kill
        setTimeout(() => {
          if (this.process && !this.process.killed) {
            this.process.kill('SIGKILL');
          }
        }, 5000);
      }

      this.cleanup();
      
      this.loggingService.info('Sidecar stopped successfully', {}, 'SidecarManager');
    } catch (error) {
      this.loggingService.error('Error stopping sidecar', {
        error: error instanceof Error ? error.message : String(error),
      }, 'SidecarManager');
    }
  }

  /**
   * Restart the sidecar process
   */
  public async restart(): Promise<boolean> {
    this.loggingService.info('Restarting sidecar process', {}, 'SidecarManager');
    
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const started = await this.start();
    if (started) {
      this.status.restartCount++;
    }
    
    return started;
  }

  /**
   * Get current sidecar status
   */
  public getStatus(): SidecarStatus {
    return { ...this.status };
  }

  /**
   * Check if sidecar is healthy
   */
  public async isHealthy(): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      this.loggingService.debug('Sidecar health check failed', {
        error: error instanceof Error ? error.message : String(error),
      }, 'SidecarManager');
      return false;
    }
  }

  /**
   * Get sidecar base URL
   */
  public getBaseUrl(): string | null {
    if (!this.status.isRunning || !this.status.port) {
      return null;
    }
    return `http://localhost:${this.status.port}`;
  }

  /**
   * Register a database connection with the sidecar
   */
  public async registerDatabaseConnection(config: DatabaseConnectionConfig): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      throw new Error('Sidecar is not running');
    }

    try {
      const response = await fetch(`${baseUrl}/database/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.loggingService.info('Database connection registered', {
        connectionName: result.connection_name,
      }, 'SidecarManager');

      return true;
    } catch (error) {
      this.loggingService.error('Failed to register database connection', {
        error: error instanceof Error ? error.message : String(error),
      }, 'SidecarManager');
      return false;
    }
  }

  /**
   * Check database health via sidecar
   */
  public async checkDatabaseHealth(): Promise<any> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      throw new Error('Sidecar is not running');
    }

    try {
      const response = await fetch(`${baseUrl}/health/database`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.loggingService.error('Failed to check database health', {
        error: error instanceof Error ? error.message : String(error),
      }, 'SidecarManager');
      throw error;
    }
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(): void {
    if (!this.process) return;

    this.process.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        this.loggingService.debug('Sidecar stdout', { output }, 'SidecarManager');
        
        // Parse port from output
        const portMatch = output.match(/port[:\s]+(\d+)/i);
        if (portMatch) {
          this.status.port = parseInt(portMatch[1], 10);
        }
      }
    });

    this.process.stderr?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        this.loggingService.warn('Sidecar stderr', { output }, 'SidecarManager');
        this.status.errorCount++;
      }
    });

    this.process.on('exit', (code, signal) => {
      this.loggingService.info('Sidecar process exited', {
        code,
        signal,
        pid: this.status.pid,
      }, 'SidecarManager');

      this.status.isRunning = false;
      this.status.isHealthy = false;
      this.status.port = undefined;
      this.status.pid = undefined;

      if (this.config.autoRestart && code !== 0) {
        this.loggingService.info('Auto-restarting sidecar', {}, 'SidecarManager');
        setTimeout(() => {
          this.restart();
        }, 5000);
      }
    });

    this.process.on('error', (error) => {
      this.loggingService.error('Sidecar process error', {
        error: error.message,
      }, 'SidecarManager');
      this.status.errorCount++;
    });
  }

  /**
   * Wait for sidecar to start up
   */
  private async waitForStartup(): Promise<boolean> {
    const startTime = Date.now();
    const timeout = this.config.maxStartupTime;

    while (Date.now() - startTime < timeout) {
      if (this.status.port) {
        try {
          const response = await fetch(`http://localhost:${this.status.port}/health`, {
            signal: AbortSignal.timeout(5000),
          });
          
          if (response.ok) {
            return true;
          }
        } catch (error) {
          // Continue waiting
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return false;
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    if (!this.status.isRunning || !this.status.port) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:${this.status.port}/health`, {
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        this.status.isHealthy = true;
        this.status.lastHealthCheck = new Date();
      } else {
        this.status.isHealthy = false;
        this.status.errorCount++;
      }
    } catch (error) {
      this.status.isHealthy = false;
      this.status.errorCount++;
      
      this.loggingService.warn('Sidecar health check failed', {
        error: error instanceof Error ? error.message : String(error),
      }, 'SidecarManager');
    }
  }

  /**
   * Send shutdown request to sidecar
   */
  private async sendShutdownRequest(): Promise<void> {
    if (!this.status.port) return;

    const response = await fetch(`http://localhost:${this.status.port}/shutdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'Extension shutdown',
        delay_seconds: 0,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Shutdown request failed: ${response.status}`);
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    this.status.isRunning = false;
    this.status.isHealthy = false;
    this.status.port = undefined;
    this.status.pid = undefined;
    this.process = undefined;
  }

  /**
   * Dispose of the service
   */
  public dispose(): void {
    this.stop();
    this.disposables.forEach(d => d.dispose());
  }
}
