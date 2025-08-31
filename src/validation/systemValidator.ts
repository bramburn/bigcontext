/**
 * SystemValidator - Pre-flight Checks and System Validation
 *
 * This service performs comprehensive system validation before setup,
 * checking Docker availability, network connectivity, system requirements,
 * and port availability for local services.
 */

import * as vscode from "vscode";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ValidationResult {
  isValid: boolean;
  category: "docker" | "network" | "system" | "ports";
  check: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: string;
  fixSuggestion?: string;
  autoFixAvailable?: boolean;
}

export interface SystemValidationReport {
  overallStatus: "pass" | "warning" | "fail";
  results: ValidationResult[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

export class SystemValidator {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Run comprehensive system validation
   */
  async validateSystem(): Promise<SystemValidationReport> {
    const results: ValidationResult[] = [];

    // Run all validation checks
    results.push(...(await this.validateDocker()));
    results.push(...(await this.validateNetwork()));
    results.push(...(await this.validateSystemRequirements()));
    results.push(...(await this.validatePorts()));

    // Calculate summary
    const summary = {
      passed: results.filter((r) => r.status === "pass").length,
      warnings: results.filter((r) => r.status === "warning").length,
      failed: results.filter((r) => r.status === "fail").length,
    };

    // Determine overall status
    let overallStatus: "pass" | "warning" | "fail" = "pass";
    if (summary.failed > 0) {
      overallStatus = "fail";
    } else if (summary.warnings > 0) {
      overallStatus = "warning";
    }

    return {
      overallStatus,
      results,
      summary,
    };
  }

  /**
   * Validate Docker installation and availability
   */
  private async validateDocker(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    try {
      // Check if Docker is installed
      const { stdout: versionOutput } = await execAsync("docker --version");
      const dockerVersion = versionOutput.trim();

      results.push({
        isValid: true,
        category: "docker",
        check: "Docker Installation",
        status: "pass",
        message: `Docker is installed: ${dockerVersion}`,
        details: dockerVersion,
      });

      // Check if Docker daemon is running
      try {
        await execAsync("docker info");
        results.push({
          isValid: true,
          category: "docker",
          check: "Docker Daemon",
          status: "pass",
          message: "Docker daemon is running and accessible",
        });

        // Check Docker version compatibility
        const versionMatch = dockerVersion.match(/Docker version (\d+)\.(\d+)/);
        if (versionMatch) {
          const major = parseInt(versionMatch[1]);
          const minor = parseInt(versionMatch[2]);

          if (major < 20) {
            results.push({
              isValid: false,
              category: "docker",
              check: "Docker Version",
              status: "warning",
              message: "Docker version is older than recommended (20.x)",
              details: `Current version: ${dockerVersion}`,
              fixSuggestion:
                "Consider updating Docker to version 20.x or later for better compatibility",
            });
          } else {
            results.push({
              isValid: true,
              category: "docker",
              check: "Docker Version",
              status: "pass",
              message: "Docker version is compatible",
            });
          }
        }
      } catch (daemonError) {
        results.push({
          isValid: false,
          category: "docker",
          check: "Docker Daemon",
          status: "fail",
          message: "Docker daemon is not running or not accessible",
          details: String(daemonError),
          fixSuggestion: "Start Docker Desktop or Docker daemon service",
          autoFixAvailable: true,
        });
      }
    } catch (installError) {
      results.push({
        isValid: false,
        category: "docker",
        check: "Docker Installation",
        status: "fail",
        message: "Docker is not installed or not in PATH",
        details: String(installError),
        fixSuggestion:
          "Install Docker Desktop from https://docker.com/products/docker-desktop",
        autoFixAvailable: false,
      });
    }

    return results;
  }

  /**
   * Validate network connectivity for cloud providers
   */
  private async validateNetwork(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Test connectivity to key services
    const endpoints = [
      { name: "OpenAI API", url: "https://api.openai.com", required: false },
      {
        name: "Pinecone API",
        url: "https://controller.us-east-1-aws.pinecone.io",
        required: false,
      },
      {
        name: "Docker Hub",
        url: "https://registry-1.docker.io",
        required: true,
      },
      {
        name: "GitHub (for updates)",
        url: "https://api.github.com",
        required: false,
      },
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(endpoint.url, {
          method: "HEAD",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok || response.status === 404) {
          // 404 is OK for connectivity test
          results.push({
            isValid: true,
            category: "network",
            check: `${endpoint.name} Connectivity`,
            status: "pass",
            message: `Can reach ${endpoint.name}`,
          });
        } else {
          const status = endpoint.required ? "fail" : "warning";
          results.push({
            isValid: !endpoint.required,
            category: "network",
            check: `${endpoint.name} Connectivity`,
            status,
            message: `Cannot reach ${endpoint.name} (HTTP ${response.status})`,
            fixSuggestion: "Check internet connection and firewall settings",
          });
        }
      } catch (error) {
        const status = endpoint.required ? "fail" : "warning";
        results.push({
          isValid: !endpoint.required,
          category: "network",
          check: `${endpoint.name} Connectivity`,
          status,
          message: `Cannot reach ${endpoint.name}`,
          details: error instanceof Error ? error.message : String(error),
          fixSuggestion:
            "Check internet connection, proxy settings, and firewall configuration",
        });
      }
    }

    return results;
  }

  /**
   * Validate system requirements (memory, disk space, etc.)
   */
  private async validateSystemRequirements(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Check available memory
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const totalMemoryGB = Math.round(totalMemory / (1024 * 1024 * 1024));
    const freeMemoryGB = Math.round(freeMemory / (1024 * 1024 * 1024));

    if (totalMemoryGB < 4) {
      results.push({
        isValid: false,
        category: "system",
        check: "System Memory",
        status: "warning",
        message: `Low system memory: ${totalMemoryGB}GB total`,
        details: `Free: ${freeMemoryGB}GB, Total: ${totalMemoryGB}GB`,
        fixSuggestion:
          "Consider upgrading to at least 8GB RAM for optimal performance",
      });
    } else {
      results.push({
        isValid: true,
        category: "system",
        check: "System Memory",
        status: "pass",
        message: `Sufficient memory: ${totalMemoryGB}GB total, ${freeMemoryGB}GB free`,
      });
    }

    // Check disk space in workspace (simplified approach)
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      try {
        const workspacePath = workspaceFolders[0].uri.fsPath;

        // Use platform-specific commands to check disk space
        let command: string;
        if (process.platform === "win32") {
          command = `dir "${workspacePath}" /-c | find "bytes free"`;
        } else {
          command = `df -h "${workspacePath}" | tail -1 | awk '{print $4}'`;
        }

        const { stdout } = await execAsync(command);

        if (process.platform === "win32") {
          // Parse Windows output
          const match = stdout.match(/(\d+) bytes free/);
          if (match) {
            const freeBytes = parseInt(match[1]);
            const freeSpaceGB = Math.round(freeBytes / (1024 * 1024 * 1024));

            if (freeSpaceGB < 2) {
              results.push({
                isValid: false,
                category: "system",
                check: "Disk Space",
                status: "warning",
                message: `Low disk space: ${freeSpaceGB}GB free`,
                fixSuggestion:
                  "Free up disk space or use a different workspace location",
              });
            } else {
              results.push({
                isValid: true,
                category: "system",
                check: "Disk Space",
                status: "pass",
                message: `Sufficient disk space: ${freeSpaceGB}GB free`,
              });
            }
          } else {
            throw new Error("Could not parse disk space output");
          }
        } else {
          // Parse Unix/Linux/macOS output
          const freeSpace = stdout.trim();
          const match = freeSpace.match(/(\d+(?:\.\d+)?)[GT]/);

          if (match) {
            const value = parseFloat(match[1]);
            const unit = freeSpace.includes("G") ? "GB" : "TB";
            const freeSpaceGB = unit === "TB" ? value * 1024 : value;

            if (freeSpaceGB < 2) {
              results.push({
                isValid: false,
                category: "system",
                check: "Disk Space",
                status: "warning",
                message: `Low disk space: ${freeSpaceGB.toFixed(1)}GB free`,
                fixSuggestion:
                  "Free up disk space or use a different workspace location",
              });
            } else {
              results.push({
                isValid: true,
                category: "system",
                check: "Disk Space",
                status: "pass",
                message: `Sufficient disk space: ${freeSpaceGB.toFixed(1)}GB free`,
              });
            }
          } else {
            throw new Error("Could not parse disk space output");
          }
        }
      } catch (error) {
        results.push({
          isValid: true,
          category: "system",
          check: "Disk Space",
          status: "warning",
          message: "Could not check disk space",
          details: String(error),
        });
      }
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);

    if (majorVersion < 16) {
      results.push({
        isValid: false,
        category: "system",
        check: "Node.js Version",
        status: "warning",
        message: `Node.js version ${nodeVersion} is older than recommended`,
        fixSuggestion: "Update to Node.js 16 or later for better performance",
      });
    } else {
      results.push({
        isValid: true,
        category: "system",
        check: "Node.js Version",
        status: "pass",
        message: `Node.js version ${nodeVersion} is compatible`,
      });
    }

    return results;
  }

  /**
   * Validate port availability for local services
   */
  private async validatePorts(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    const portsToCheck = [
      { port: 6333, service: "Qdrant" },
      { port: 8000, service: "ChromaDB" },
      { port: 11434, service: "Ollama" },
    ];

    for (const { port, service } of portsToCheck) {
      try {
        const isAvailable = await this.isPortAvailable(port);

        if (isAvailable) {
          results.push({
            isValid: true,
            category: "ports",
            check: `Port ${port} (${service})`,
            status: "pass",
            message: `Port ${port} is available for ${service}`,
          });
        } else {
          results.push({
            isValid: false,
            category: "ports",
            check: `Port ${port} (${service})`,
            status: "warning",
            message: `Port ${port} is already in use`,
            details: `Another service may be using port ${port}`,
            fixSuggestion: `Stop the service using port ${port} or configure ${service} to use a different port`,
          });
        }
      } catch (error) {
        results.push({
          isValid: true,
          category: "ports",
          check: `Port ${port} (${service})`,
          status: "warning",
          message: `Could not check port ${port} availability`,
          details: String(error),
        });
      }
    }

    return results;
  }

  /**
   * Check if a port is available
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require("net");
      const server = net.createServer();

      server.listen(port, () => {
        server.once("close", () => {
          resolve(true);
        });
        server.close();
      });

      server.on("error", () => {
        resolve(false);
      });
    });
  }

  /**
   * Attempt to auto-fix common issues
   */
  async autoFix(check: string): Promise<{ success: boolean; message: string }> {
    switch (check) {
      case "Docker Daemon":
        try {
          if (process.platform === "darwin") {
            await execAsync("open -a Docker");
            return {
              success: true,
              message: "Attempting to start Docker Desktop...",
            };
          } else if (process.platform === "win32") {
            await execAsync('start "" "Docker Desktop"');
            return {
              success: true,
              message: "Attempting to start Docker Desktop...",
            };
          } else {
            await execAsync("sudo systemctl start docker");
            return {
              success: true,
              message: "Attempting to start Docker service...",
            };
          }
        } catch (error) {
          return {
            success: false,
            message: `Failed to start Docker: ${error}`,
          };
        }

      default:
        return {
          success: false,
          message: "No auto-fix available for this issue",
        };
    }
  }
}
