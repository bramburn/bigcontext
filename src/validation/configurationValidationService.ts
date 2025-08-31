/**
 * Configuration Validation Service
 *
 * This service validates extension configuration settings and provides
 * helpful error messages and suggestions for fixing configuration issues.
 *
 * Features:
 * - Comprehensive validation of all configuration sections
 * - Helpful error messages with suggestions
 * - Automatic configuration repair where possible
 * - Integration with notification service for user feedback
 * - Validation on configuration changes
 */

import * as vscode from "vscode";
import { ConfigService, ExtensionConfig } from "../configService";
import {
  NotificationService,
  NotificationType,
} from "../notifications/notificationService";
import { CentralizedLoggingService } from "../logging/centralizedLoggingService";

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
  suggestion?: string;
  autoFixable?: boolean;
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

/**
 * Validation suggestion interface
 */
export interface ValidationSuggestion {
  field: string;
  message: string;
  action?: () => Promise<void>;
}

/**
 * Configuration validation service
 */
export class ConfigurationValidationService {
  private configService: ConfigService;
  private notificationService?: NotificationService;
  private loggingService?: CentralizedLoggingService;

  constructor(
    configService: ConfigService,
    notificationService?: NotificationService,
    loggingService?: CentralizedLoggingService,
  ) {
    this.configService = configService;
    this.notificationService = notificationService;
    this.loggingService = loggingService;
  }

  /**
   * Validate the complete configuration
   */
  public async validateConfiguration(): Promise<ValidationResult> {
    const config = this.configService.getFullConfig();
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    try {
      // Validate each configuration section
      await this.validateDatabaseConfig(config, result);
      await this.validateEmbeddingConfig(config, result);
      await this.validateIndexingConfig(config, result);
      await this.validateQueryExpansionConfig(config, result);
      await this.validateLLMReRankingConfig(config, result);

      // Check for configuration conflicts
      this.checkConfigurationConflicts(config, result);

      // Set overall validity
      result.isValid = result.errors.length === 0;

      this.loggingService?.info(
        "Configuration validation completed",
        {
          isValid: result.isValid,
          errorCount: result.errors.length,
          warningCount: result.warnings.length,
          suggestionCount: result.suggestions.length,
        },
        "ConfigurationValidationService",
      );

      // Show notifications for critical issues
      if (result.errors.length > 0) {
        await this.notifyValidationIssues(result);
      }
    } catch (error) {
      this.loggingService?.error(
        "Configuration validation failed",
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "ConfigurationValidationService",
      );

      result.isValid = false;
      result.errors.push({
        field: "general",
        message: "Configuration validation failed due to an internal error",
        severity: "error",
        suggestion: "Please check the logs for more details",
      });
    }

    return result;
  }

  /**
   * Validate database configuration
   */
  private async validateDatabaseConfig(
    config: ExtensionConfig,
    result: ValidationResult,
  ): Promise<void> {
    const dbConfig = config.database;

    // Validate database type
    if (!dbConfig.type) {
      result.errors.push({
        field: "database.type",
        message: "Database type is required",
        severity: "error",
        suggestion: "Please configure the database type in settings",
        autoFixable: false,
      });
    }

    // Validate connection string
    if (!dbConfig.connectionString) {
      result.errors.push({
        field: "database.connectionString",
        message: "Database connection string is required",
        severity: "error",
        suggestion:
          "Please configure the database connection string in settings",
        autoFixable: false,
      });
    } else {
      try {
        new URL(dbConfig.connectionString);
      } catch {
        result.errors.push({
          field: "database.connectionString",
          message: "Invalid connection string format",
          severity: "error",
          suggestion:
            "Please provide a valid URL (e.g., http://localhost:6333)",
          autoFixable: false,
        });
      }
    }

    // Test database connectivity
    if (dbConfig.connectionString) {
      try {
        const response = await fetch(`${dbConfig.connectionString}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          result.warnings.push({
            field: "database.connectionString",
            message: "Cannot connect to database",
            suggestion: "Please ensure the database is running and accessible",
          });
        }
      } catch (error) {
        result.warnings.push({
          field: "database.connectionString",
          message: "Database connectivity test failed",
          suggestion:
            "Please verify the database is running and the connection string is correct",
        });
      }
    }
  }

  /**
   * Validate embedding configuration
   */
  private async validateEmbeddingConfig(
    config: ExtensionConfig,
    result: ValidationResult,
  ): Promise<void> {
    const provider = config.embeddingProvider;

    if (provider === "openai") {
      const openaiConfig = config.openai;

      if (!openaiConfig.apiKey) {
        result.errors.push({
          field: "openai.apiKey",
          message: "OpenAI API key is required when using OpenAI provider",
          severity: "error",
          suggestion: "Please set your OpenAI API key in the settings",
          autoFixable: false,
        });
      }

      if (!openaiConfig.model) {
        result.warnings.push({
          field: "openai.model",
          message: "No OpenAI model specified, using default",
          suggestion: "Consider specifying a model for better control",
        });
      }

      // Test API key validity
      if (openaiConfig.apiKey) {
        try {
          const response = await fetch("https://api.openai.com/v1/models", {
            headers: {
              Authorization: `Bearer ${openaiConfig.apiKey}`,
            },
            signal: AbortSignal.timeout(10000),
          });

          if (!response.ok) {
            result.errors.push({
              field: "openai.apiKey",
              message: "Invalid OpenAI API key",
              severity: "error",
              suggestion:
                "Please verify your OpenAI API key is correct and has sufficient credits",
              autoFixable: false,
            });
          }
        } catch (error) {
          result.warnings.push({
            field: "openai.apiKey",
            message: "Could not validate OpenAI API key",
            suggestion: "Please ensure you have internet connectivity",
          });
        }
      }
    } else if (provider === "ollama") {
      const ollamaConfig = config.ollama;

      if (!ollamaConfig.apiUrl) {
        result.errors.push({
          field: "ollama.apiUrl",
          message: "Ollama API URL is required when using Ollama provider",
          severity: "error",
          suggestion:
            "Please set the Ollama API URL (e.g., http://localhost:11434)",
          autoFixable: false,
        });
      }

      if (!ollamaConfig.model) {
        result.warnings.push({
          field: "ollama.model",
          message: "No Ollama model specified, using default",
          suggestion: "Consider specifying a model for better control",
        });
      }

      // Test Ollama connectivity
      if (ollamaConfig.apiUrl) {
        try {
          const response = await fetch(`${ollamaConfig.apiUrl}/api/tags`, {
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            result.warnings.push({
              field: "ollama.apiUrl",
              message: "Cannot connect to Ollama service",
              suggestion: "Please ensure Ollama is running and accessible",
            });
          } else {
            const data = await response.json();
            const models = data.models || [];

            if (models.length === 0) {
              result.warnings.push({
                field: "ollama.model",
                message: "No models available in Ollama",
                suggestion:
                  'Please pull at least one model using "ollama pull <model-name>"',
              });
            } else if (
              ollamaConfig.model &&
              !models.some((m: any) => m.name === ollamaConfig.model)
            ) {
              result.warnings.push({
                field: "ollama.model",
                message: `Model "${ollamaConfig.model}" not found in Ollama`,
                suggestion: `Available models: ${models.map((m: any) => m.name).join(", ")}`,
              });
            }
          }
        } catch (error) {
          result.warnings.push({
            field: "ollama.apiUrl",
            message: "Ollama connectivity test failed",
            suggestion:
              "Please verify Ollama is running and the URL is correct",
          });
        }
      }
    }
  }

  /**
   * Validate indexing configuration
   */
  private validateIndexingConfig(
    config: ExtensionConfig,
    result: ValidationResult,
  ): void {
    const indexingConfig = config.indexing;

    if (
      indexingConfig.chunkSize !== undefined &&
      indexingConfig.chunkSize <= 0
    ) {
      result.errors.push({
        field: "indexing.chunkSize",
        message: "Chunk size must be greater than 0",
        severity: "error",
        suggestion: "Set chunk size to a reasonable value (e.g., 1000)",
        autoFixable: true,
      });
    }

    if (
      indexingConfig.chunkSize !== undefined &&
      indexingConfig.chunkSize > 10000
    ) {
      result.warnings.push({
        field: "indexing.chunkSize",
        message: "Large chunk size may impact performance",
        suggestion:
          "Consider using a smaller chunk size (1000-3000) for better performance",
      });
    }

    if (
      indexingConfig.chunkOverlap !== undefined &&
      indexingConfig.chunkOverlap < 0
    ) {
      result.errors.push({
        field: "indexing.chunkOverlap",
        message: "Chunk overlap cannot be negative",
        severity: "error",
        suggestion: "Set chunk overlap to 0 or a positive value",
        autoFixable: true,
      });
    }

    if (
      indexingConfig.chunkOverlap !== undefined &&
      indexingConfig.chunkSize !== undefined &&
      indexingConfig.chunkOverlap >= indexingConfig.chunkSize
    ) {
      result.errors.push({
        field: "indexing.chunkOverlap",
        message: "Chunk overlap must be less than chunk size",
        severity: "error",
        suggestion: "Set chunk overlap to less than chunk size",
        autoFixable: true,
      });
    }
  }

  /**
   * Validate query expansion configuration
   */
  private validateQueryExpansionConfig(
    config: ExtensionConfig,
    result: ValidationResult,
  ): void {
    const queryExpansion = config.queryExpansion;

    if (!queryExpansion) return;

    if (queryExpansion.maxExpandedTerms <= 0) {
      result.errors.push({
        field: "queryExpansion.maxExpandedTerms",
        message: "Max expanded terms must be greater than 0",
        severity: "error",
        suggestion: "Set to a reasonable value (e.g., 5)",
        autoFixable: true,
      });
    }

    if (
      queryExpansion.confidenceThreshold < 0 ||
      queryExpansion.confidenceThreshold > 1
    ) {
      result.errors.push({
        field: "queryExpansion.confidenceThreshold",
        message: "Confidence threshold must be between 0 and 1",
        severity: "error",
        suggestion: "Set to a value between 0.0 and 1.0 (e.g., 0.7)",
        autoFixable: true,
      });
    }
  }

  /**
   * Validate LLM re-ranking configuration
   */
  private validateLLMReRankingConfig(
    config: ExtensionConfig,
    result: ValidationResult,
  ): void {
    const llmReRanking = config.llmReRanking;

    if (!llmReRanking) return;

    if (llmReRanking.maxResultsToReRank <= 0) {
      result.errors.push({
        field: "llmReRanking.maxResultsToReRank",
        message: "Max results to re-rank must be greater than 0",
        severity: "error",
        suggestion: "Set to a reasonable value (e.g., 10)",
        autoFixable: true,
      });
    }

    const totalWeight =
      llmReRanking.vectorScoreWeight + llmReRanking.llmScoreWeight;
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      result.warnings.push({
        field: "llmReRanking.weights",
        message: "Vector and LLM score weights should sum to 1.0",
        suggestion: `Current sum is ${totalWeight.toFixed(2)}. Adjust weights to sum to 1.0`,
      });
    }
  }

  /**
   * Check for configuration conflicts
   */
  private checkConfigurationConflicts(
    config: ExtensionConfig,
    result: ValidationResult,
  ): void {
    // Check if query expansion and re-ranking use compatible providers
    if (config.queryExpansion?.enabled && config.llmReRanking?.enabled) {
      if (
        config.queryExpansion.llmProvider !== config.llmReRanking.llmProvider
      ) {
        result.warnings.push({
          field: "llm.providers",
          message: "Query expansion and re-ranking use different LLM providers",
          suggestion:
            "Consider using the same provider for consistency and better performance",
        });
      }
    }

    // Check if embedding provider matches LLM providers
    if (config.queryExpansion?.enabled || config.llmReRanking?.enabled) {
      const embeddingProvider = config.embeddingProvider;
      const expansionProvider = config.queryExpansion?.llmProvider;
      const reRankingProvider = config.llmReRanking?.llmProvider;

      if (expansionProvider && expansionProvider !== embeddingProvider) {
        result.suggestions.push({
          field: "providers.consistency",
          message:
            "Consider using the same provider for embeddings and query expansion for better integration",
        });
      }

      if (reRankingProvider && reRankingProvider !== embeddingProvider) {
        result.suggestions.push({
          field: "providers.consistency",
          message:
            "Consider using the same provider for embeddings and re-ranking for better integration",
        });
      }
    }
  }

  /**
   * Notify user about validation issues
   */
  private async notifyValidationIssues(
    result: ValidationResult,
  ): Promise<void> {
    if (!this.notificationService) return;

    const criticalErrors = result.errors.filter((e) => e.severity === "error");

    if (criticalErrors.length > 0) {
      await this.notificationService.error(
        `Configuration has ${criticalErrors.length} critical error(s) that need attention`,
        [
          {
            title: "View Details",
            callback: () => this.showValidationDetails(result),
          },
        ],
      );
    } else if (result.warnings.length > 0) {
      await this.notificationService.warning(
        `Configuration has ${result.warnings.length} warning(s)`,
        [
          {
            title: "View Details",
            callback: () => this.showValidationDetails(result),
          },
        ],
      );
    }
  }

  /**
   * Show detailed validation results
   */
  private async showValidationDetails(result: ValidationResult): Promise<void> {
    const details = [
      "# Configuration Validation Results\n",
      `**Status:** ${result.isValid ? "✅ Valid" : "❌ Invalid"}\n`,
      `**Errors:** ${result.errors.length}`,
      `**Warnings:** ${result.warnings.length}`,
      `**Suggestions:** ${result.suggestions.length}\n`,
    ];

    if (result.errors.length > 0) {
      details.push("## Errors\n");
      result.errors.forEach((error) => {
        details.push(`- **${error.field}:** ${error.message}`);
        if (error.suggestion) {
          details.push(`  *Suggestion: ${error.suggestion}*`);
        }
        details.push("");
      });
    }

    if (result.warnings.length > 0) {
      details.push("## Warnings\n");
      result.warnings.forEach((warning) => {
        details.push(`- **${warning.field}:** ${warning.message}`);
        details.push(`  *Suggestion: ${warning.suggestion}*`);
        details.push("");
      });
    }

    if (result.suggestions.length > 0) {
      details.push("## Suggestions\n");
      result.suggestions.forEach((suggestion) => {
        details.push(`- **${suggestion.field}:** ${suggestion.message}`);
        details.push("");
      });
    }

    // Show in a new document
    const doc = await vscode.workspace.openTextDocument({
      content: details.join("\n"),
      language: "markdown",
    });

    await vscode.window.showTextDocument(doc);
  }

  /**
   * Auto-fix configuration issues where possible
   */
  public async autoFixConfiguration(): Promise<ValidationResult> {
    const result = await this.validateConfiguration();
    const fixableErrors = result.errors.filter((e) => e.autoFixable);

    if (fixableErrors.length === 0) {
      return result;
    }

    this.loggingService?.info(
      "Auto-fixing configuration issues",
      {
        fixableCount: fixableErrors.length,
      },
      "ConfigurationValidationService",
    );

    // Apply auto-fixes
    for (const error of fixableErrors) {
      try {
        await this.applyAutoFix(error);
      } catch (fixError) {
        this.loggingService?.error(
          "Auto-fix failed",
          {
            field: error.field,
            error:
              fixError instanceof Error ? fixError.message : String(fixError),
          },
          "ConfigurationValidationService",
        );
      }
    }

    // Re-validate after fixes
    return this.validateConfiguration();
  }

  /**
   * Apply auto-fix for a specific error
   */
  private async applyAutoFix(error: ValidationError): Promise<void> {
    const config = vscode.workspace.getConfiguration("code-context-engine");

    switch (error.field) {
      case "indexing.chunkSize":
        await config.update(
          "indexing.chunkSize",
          1000,
          vscode.ConfigurationTarget.Global,
        );
        break;
      case "indexing.chunkOverlap":
        await config.update(
          "indexing.chunkOverlap",
          100,
          vscode.ConfigurationTarget.Global,
        );
        break;
      case "queryExpansion.maxExpandedTerms":
        await config.update(
          "queryExpansion.maxExpandedTerms",
          5,
          vscode.ConfigurationTarget.Global,
        );
        break;
      case "queryExpansion.confidenceThreshold":
        await config.update(
          "queryExpansion.confidenceThreshold",
          0.7,
          vscode.ConfigurationTarget.Global,
        );
        break;
      case "llmReRanking.maxResultsToReRank":
        await config.update(
          "llmReRanking.maxResultsToReRank",
          10,
          vscode.ConfigurationTarget.Global,
        );
        break;
    }
  }
}
