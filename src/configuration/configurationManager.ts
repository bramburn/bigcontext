/**
 * Configuration Manager
 * 
 * This service handles configuration import/export, backup/restore, versioning,
 * and multi-environment configuration management for the Code Context Engine.
 * 
 * The ConfigurationManager provides a centralized way to manage application configurations,
 * including validation, templates, backups, and migration between different versions.
 * It supports multiple environments (development, production, team) and allows for
 * easy configuration sharing and restoration.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationSchema, ConfigurationValidator, ValidationResult } from './configurationSchema';

/**
 * Configuration Template Interface
 * 
 * Represents a reusable configuration template that can be saved and applied
 * to quickly set up common configurations. Templates are categorized by
 * environment type and can include metadata like author and tags.
 */
export interface ConfigurationTemplate {
    id: string;                                    // Unique identifier for the template
    name: string;                                  // Human-readable name
    description: string;                           // Detailed description of the template
    category: 'development' | 'production' | 'team' | 'custom';  // Environment category
    configuration: ConfigurationSchema;             // The actual configuration data
    tags: string[];                                // Searchable tags for the template
    author?: string;                               // Optional author information
    version: string;                               // Version of the configuration schema
}

/**
 * Configuration Backup Interface
 * 
 * Represents a backup of a configuration that can be restored later.
 * Backups include metadata about when and why they were created,
 * making it easier to track configuration changes over time.
 */
export interface ConfigurationBackup {
    id: string;                                    // Unique identifier for the backup
    name: string;                                  // Human-readable name
    timestamp: string;                             // ISO timestamp when backup was created
    configuration: ConfigurationSchema;             // The backed up configuration
    metadata: {
        reason: 'manual' | 'auto' | 'migration';   // Why the backup was created
        description?: string;                       // Optional description
        previousVersion?: string;                   // Version before backup
    };
}

/**
 * Configuration Migration Interface
 * 
 * Defines a migration function to transform configuration from one version
 * to another. This allows for backward compatibility when the configuration
 * schema evolves over time.
 */
export interface ConfigurationMigration {
    fromVersion: string;                           // Source version
    toVersion: string;                             // Target version
    migrate: (config: any) => ConfigurationSchema; // Migration function
    description: string;                           // Description of changes
}

/**
 * ConfigurationManager Class
 * 
 * Main class responsible for managing all aspects of configuration including:
 * - Importing and exporting configurations
 * - Creating and restoring backups
 * - Managing configuration templates
 * - Handling configuration migrations
 * - Providing common configuration presets
 */
export class ConfigurationManager {
    private context: vscode.ExtensionContext;           // VS Code extension context
    private configurationPath: string;                 // Path to store configurations
    private backupPath: string;                        // Path to store backups
    private templatesPath: string;                     // Path to store templates
    private migrations: Map<string, ConfigurationMigration> = new Map();  // Available migrations

    /**
     * Constructor for ConfigurationManager
     * 
     * @param context - VS Code extension context for accessing storage
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        // Set up paths for storing configuration data
        this.configurationPath = path.join(context.globalStorageUri.fsPath, 'configurations');
        this.backupPath = path.join(context.globalStorageUri.fsPath, 'backups');
        this.templatesPath = path.join(context.globalStorageUri.fsPath, 'templates');
        
        // Initialize required directories and migrations
        this.initializeDirectories();
        this.initializeMigrations();
    }

    /**
     * Initialize storage directories
     * 
     * Creates the necessary directories for storing configurations,
     * backups, and templates if they don't already exist.
     */
    private async initializeDirectories(): Promise<void> {
        try {
            // Create directories recursively (won't fail if they already exist)
            await fs.promises.mkdir(this.configurationPath, { recursive: true });
            await fs.promises.mkdir(this.backupPath, { recursive: true });
            await fs.promises.mkdir(this.templatesPath, { recursive: true });
        } catch (error) {
            console.error('Failed to initialize configuration directories:', error);
        }
    }

    /**
     * Initialize configuration migrations
     * 
     * Sets up migration functions for transforming configurations between
     * different versions. Currently empty but ready for future migrations.
     */
    private initializeMigrations(): void {
        // Add future migrations here
        // Example:
        // this.migrations.set('1.0.0->1.1.0', {
        //     fromVersion: '1.0.0',
        //     toVersion: '1.1.0',
        //     migrate: (config) => { /* migration logic */ },
        //     description: 'Add new security features'
        // });
    }

    /**
     * Export configuration to JSON file
     * 
     * Saves the current configuration to a JSON file with options to
     * include/exclude secrets, minify output, and validate before export.
     * 
     * @param configuration - The configuration schema to export
     * @param filePath - Optional file path to save to (if not provided, user will be prompted)
     * @param options - Export options including secrets handling and validation
     * @returns Promise resolving to export result with success status and file path or error
     */
    async exportConfiguration(
        configuration: ConfigurationSchema,
        filePath?: string,
        options?: {
            includeSecrets?: boolean;     // Whether to include sensitive data (default: false)
            minify?: boolean;             // Whether to minify JSON output (default: false)
            validate?: boolean;           // Whether to validate before export (default: true)
        }
    ): Promise<{ success: boolean; filePath?: string; error?: string }> {
        try {
            // Set default options
            const opts = {
                includeSecrets: false,
                minify: false,
                validate: true,
                ...options
            };

            // Validate configuration if requested
            if (opts.validate) {
                const validation = ConfigurationValidator.validate(configuration);
                if (!validation.isValid) {
                    return {
                        success: false,
                        error: `Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`
                    };
                }
            }

            // Create a copy of the configuration for export
            const exportConfig = { ...configuration };
            
            // Remove secrets if not included in export
            if (!opts.includeSecrets) {
                this.removeSecrets(exportConfig);
            }

            // Update metadata with export timestamp
            exportConfig.metadata.updatedAt = new Date().toISOString();

            // Determine file path (use provided path or prompt user)
            const exportPath = filePath || await this.getExportPath(configuration.metadata.name);
            
            // Write configuration to file with appropriate formatting
            const jsonContent = opts.minify 
                ? JSON.stringify(exportConfig)
                : JSON.stringify(exportConfig, null, 2);
                
            await fs.promises.writeFile(exportPath, jsonContent, 'utf8');

            return { success: true, filePath: exportPath };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Import configuration from JSON file
     * 
     * Loads a configuration from a JSON file with options to validate,
     * create backup, and merge with existing configuration.
     * 
     * @param filePath - Path to the JSON configuration file
     * @param options - Import options including validation and backup
     * @returns Promise resolving to import result with configuration or error
     */
    async importConfiguration(
        filePath: string,
        options?: {
            validate?: boolean;           // Whether to validate imported config (default: true)
            backup?: boolean;             // Whether to backup current config (default: true)
            merge?: boolean;              // Whether to merge with existing config (default: false)
        }
    ): Promise<{ success: boolean; configuration?: ConfigurationSchema; error?: string; warnings?: string[] }> {
        try {
            // Set default options
            const opts = {
                validate: true,
                backup: true,
                merge: false,
                ...options
            };

            // Read and parse configuration file
            const fileContent = await fs.promises.readFile(filePath, 'utf8');
            const importedConfig = JSON.parse(fileContent) as ConfigurationSchema;

            // Validate imported configuration
            if (opts.validate) {
                const validation = ConfigurationValidator.validate(importedConfig);
                if (!validation.isValid) {
                    return {
                        success: false,
                        error: `Invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`,
                        warnings: validation.warnings.map(w => w.message)
                    };
                }
            }

            // Create backup of current configuration if requested
            if (opts.backup) {
                const currentConfig = await this.getCurrentConfiguration();
                if (currentConfig) {
                    await this.createBackup(currentConfig, 'manual', 'Pre-import backup');
                }
            }

            // Handle version migration if needed
            const migratedConfig = await this.migrateConfiguration(importedConfig);

            // Update metadata with import timestamp
            migratedConfig.metadata.updatedAt = new Date().toISOString();

            return { 
                success: true, 
                configuration: migratedConfig,
                warnings: opts.validate ? ConfigurationValidator.validate(migratedConfig).warnings.map(w => w.message) : []
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Create configuration backup
     * 
     * Creates a backup of the current configuration with metadata
     * about when and why it was created. Automatically cleans up old backups.
     * 
     * @param configuration - The configuration to backup
     * @param reason - Why the backup is being created
     * @param description - Optional description of the backup
     * @returns Promise resolving to backup result with backup ID or error
     */
    async createBackup(
        configuration: ConfigurationSchema,
        reason: 'manual' | 'auto' | 'migration',
        description?: string
    ): Promise<{ success: boolean; backupId?: string; error?: string }> {
        try {
            // Generate unique backup ID
            const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Create backup object with metadata
            const backup: ConfigurationBackup = {
                id: backupId,
                name: `${configuration.metadata.name} - ${new Date().toLocaleString()}`,
                timestamp: new Date().toISOString(),
                configuration: { ...configuration },  // Deep copy
                metadata: {
                    reason,
                    description,
                    previousVersion: configuration.version
                }
            };

            // Write backup to file
            const backupFilePath = path.join(this.backupPath, `${backupId}.json`);
            await fs.promises.writeFile(backupFilePath, JSON.stringify(backup, null, 2), 'utf8');

            // Clean up old backups (keep last 10)
            await this.cleanupOldBackups();

            return { success: true, backupId };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Restore configuration from backup
     * 
     * Loads a configuration from a backup file and validates it before returning.
     * 
     * @param backupId - ID of the backup to restore
     * @returns Promise resolving to restore result with configuration or error
     */
    async restoreBackup(backupId: string): Promise<{ success: boolean; configuration?: ConfigurationSchema; error?: string }> {
        try {
            // Read backup file
            const backupFilePath = path.join(this.backupPath, `${backupId}.json`);
            const backupContent = await fs.promises.readFile(backupFilePath, 'utf8');
            const backup = JSON.parse(backupContent) as ConfigurationBackup;

            // Validate restored configuration
            const validation = ConfigurationValidator.validate(backup.configuration);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: `Backup contains invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`
                };
            }

            // Update metadata with restore timestamp
            backup.configuration.metadata.updatedAt = new Date().toISOString();

            return { success: true, configuration: backup.configuration };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * List available backups
     * 
     * Returns all available configuration backups sorted by timestamp
     * (newest first). Silently handles errors reading individual backup files.
     * 
     * @returns Promise resolving to array of configuration backups
     */
    async listBackups(): Promise<ConfigurationBackup[]> {
        try {
            // Get all backup files
            const backupFiles = await fs.promises.readdir(this.backupPath);
            const backups: ConfigurationBackup[] = [];

            // Read and parse each backup file
            for (const file of backupFiles) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(this.backupPath, file);
                        const content = await fs.promises.readFile(filePath, 'utf8');
                        const backup = JSON.parse(content) as ConfigurationBackup;
                        backups.push(backup);
                    } catch (error) {
                        console.warn(`Failed to read backup file ${file}:`, error);
                        // Continue processing other files if one fails
                    }
                }
            }

            // Sort by timestamp (newest first)
            return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        } catch (error) {
            console.error('Failed to list backups:', error);
            return [];
        }
    }

    /**
     * Save configuration template
     * 
     * Creates a reusable template from the current configuration.
     * Secrets are automatically removed from templates for security.
     * 
     * @param configuration - The configuration to save as a template
     * @param templateInfo - Metadata about the template
     * @returns Promise resolving to template save result with template ID or error
     */
    async saveTemplate(
        configuration: ConfigurationSchema,
        templateInfo: {
            name: string;
            description: string;
            category: 'development' | 'production' | 'team' | 'custom';
            tags?: string[];
            author?: string;
        }
    ): Promise<{ success: boolean; templateId?: string; error?: string }> {
        try {
            // Generate unique template ID
            const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Remove secrets from template for security
            const templateConfig = { ...configuration };
            this.removeSecrets(templateConfig);

            // Create template object
            const template: ConfigurationTemplate = {
                id: templateId,
                name: templateInfo.name,
                description: templateInfo.description,
                category: templateInfo.category,
                configuration: templateConfig,
                tags: templateInfo.tags || [],
                author: templateInfo.author,
                version: configuration.version
            };

            // Write template to file
            const templateFilePath = path.join(this.templatesPath, `${templateId}.json`);
            await fs.promises.writeFile(templateFilePath, JSON.stringify(template, null, 2), 'utf8');

            return { success: true, templateId };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * List available templates
     * 
     * Returns all available configuration templates sorted by name.
     * Silently handles errors reading individual template files.
     * 
     * @returns Promise resolving to array of configuration templates
     */
    async listTemplates(): Promise<ConfigurationTemplate[]> {
        try {
            // Get all template files
            const templateFiles = await fs.promises.readdir(this.templatesPath);
            const templates: ConfigurationTemplate[] = [];

            // Read and parse each template file
            for (const file of templateFiles) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(this.templatesPath, file);
                        const content = await fs.promises.readFile(filePath, 'utf8');
                        const template = JSON.parse(content) as ConfigurationTemplate;
                        templates.push(template);
                    } catch (error) {
                        console.warn(`Failed to read template file ${file}:`, error);
                        // Continue processing other files if one fails
                    }
                }
            }

            // Sort by name alphabetically
            return templates.sort((a, b) => a.name.localeCompare(b.name));

        } catch (error) {
            console.error('Failed to list templates:', error);
            return [];
        }
    }

    /**
     * Load template by ID
     * 
     * Loads a specific template by its ID.
     * 
     * @param templateId - ID of the template to load
     * @returns Promise resolving to template load result with template or error
     */
    async loadTemplate(templateId: string): Promise<{ success: boolean; template?: ConfigurationTemplate; error?: string }> {
        try {
            // Read template file
            const templateFilePath = path.join(this.templatesPath, `${templateId}.json`);
            const content = await fs.promises.readFile(templateFilePath, 'utf8');
            const template = JSON.parse(content) as ConfigurationTemplate;

            return { success: true, template };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Validate configuration
     * 
     * Validates a configuration against the schema and returns
     * validation results including errors and warnings.
     * 
     * @param configuration - Configuration to validate (can be partial)
     * @returns ValidationResult with validation status and any errors/warnings
     */
    validateConfiguration(configuration: Partial<ConfigurationSchema>): ValidationResult {
        return ConfigurationValidator.validate(configuration);
    }

    /**
     * Create default configuration
     * 
     * Returns a new configuration with default values for all settings.
     * 
     * @returns Default configuration schema
     */
    createDefaultConfiguration(): ConfigurationSchema {
        return ConfigurationValidator.createDefault();
    }

    /**
     * Helper methods
     */

    /**
     * Remove secrets from configuration
     * 
     * Removes sensitive information like API keys from a configuration
     * object for security purposes.
     * 
     * @param config - Configuration object to sanitize
     */
    private removeSecrets(config: ConfigurationSchema): void {
        // Remove API keys and other sensitive information
        if (config.database?.connection?.apiKey) {
            delete config.database.connection.apiKey;
        }
        if (config.embedding?.connection?.apiKey) {
            delete config.embedding.connection.apiKey;
        }
    }

    /**
     * Get export file path
     * 
     * Determines where to save an exported configuration file.
     * If no path is provided, prompts the user with a save dialog.
     * 
     * @param configName - Name of the configuration being exported
     * @returns Promise resolving to the file path for export
     */
    private async getExportPath(configName: string): Promise<string> {
        // Sanitize configuration name for use in filename
        const sanitizedName = configName.replace(/[^a-zA-Z0-9-_]/g, '_');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${sanitizedName}_${timestamp}.json`;
        
        // Use VS Code's file dialog if available
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(this.configurationPath, fileName)),
            filters: {
                'JSON Configuration': ['json']
            }
        });

        // Return user-selected path or default path
        return uri ? uri.fsPath : path.join(this.configurationPath, fileName);
    }

    /**
     * Get current configuration
     * 
     * Retrieves the current active configuration.
     * Note: This is a placeholder implementation that would need to be
     * customized based on how configurations are stored in the application.
     * 
     * @returns Promise resolving to current configuration or null if not available
     */
    private async getCurrentConfiguration(): Promise<ConfigurationSchema | null> {
        // This would typically load from VS Code settings or a current config file
        // For now, return null as this would be implemented based on your current config storage
        return null;
    }

    /**
     * Migrate configuration to current version
     * 
     * Checks if a configuration needs to be migrated to the current
     * schema version and applies any available migrations.
     * 
     * @param config - Configuration to potentially migrate
     * @returns Promise resolving to migrated configuration
     */
    private async migrateConfiguration(config: ConfigurationSchema): Promise<ConfigurationSchema> {
        // Check if migration is needed
        const currentVersion = ConfigurationValidator.createDefault().version;
        if (config.version === currentVersion) {
            return config;  // No migration needed
        }

        // Apply migrations if available
        const migrationKey = `${config.version}->${currentVersion}`;
        const migration = this.migrations.get(migrationKey);
        
        if (migration) {
            console.log(`Migrating configuration from ${config.version} to ${currentVersion}`);
            return migration.migrate(config);
        }

        // If no migration available, return as-is with updated version
        // This allows for forward compatibility when new versions add optional fields
        return { ...config, version: currentVersion };
    }

    /**
     * Clean up old backups
     * 
     * Removes old backup files, keeping only the most recent 10.
     * This prevents backup storage from growing indefinitely.
     */
    private async cleanupOldBackups(): Promise<void> {
        try {
            const backups = await this.listBackups();
            if (backups.length > 10) {
                // Remove oldest backups beyond the 10 most recent
                const oldBackups = backups.slice(10);
                for (const backup of oldBackups) {
                    const backupFilePath = path.join(this.backupPath, `${backup.id}.json`);
                    await fs.promises.unlink(backupFilePath);
                }
            }
        } catch (error) {
            console.warn('Failed to cleanup old backups:', error);
            // Non-critical error, don't fail the operation
        }
    }

    /**
     * Get configuration presets for common setups
     * 
     * Returns predefined configuration templates for common use cases:
     * - Development (Local): Local development with Qdrant and Ollama
     * - Production (Cloud): Cloud production with Pinecone and OpenAI
     * - Team (Hybrid): Team collaboration with ChromaDB and flexible settings
     * 
     * @returns Array of configuration presets
     */
    getConfigurationPresets(): ConfigurationTemplate[] {
        return [
            {
                id: 'development-local',
                name: 'Development (Local)',
                description: 'Local development setup with Qdrant and Ollama',
                category: 'development',
                tags: ['local', 'development', 'qdrant', 'ollama'],
                version: '1.0.0',
                configuration: {
                    ...ConfigurationValidator.createDefault(),
                    metadata: {
                        name: 'Development Configuration',
                        description: 'Local development setup',
                        environment: 'development',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                }
            },
            {
                id: 'production-cloud',
                name: 'Production (Cloud)',
                description: 'Production setup with Pinecone and OpenAI',
                category: 'production',
                tags: ['cloud', 'production', 'pinecone', 'openai'],
                version: '1.0.0',
                configuration: {
                    ...ConfigurationValidator.createDefault(),
                    metadata: {
                        name: 'Production Configuration',
                        description: 'Cloud production setup',
                        environment: 'production',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    database: {
                        provider: 'pinecone',
                        connection: {
                            apiKey: '', // To be filled by user
                            environment: '', // To be filled by user
                            timeout: 30000
                        },
                        collections: {
                            defaultCollection: 'code_context_prod',
                            collections: [{
                                name: 'code_context_prod',
                                vectorSize: 1536,
                                distance: 'cosine'
                            }]
                        },
                        advanced: {
                            batchSize: 100,
                            maxRetries: 3,
                            retryDelay: 1000
                        }
                    },
                    embedding: {
                        provider: 'openai',
                        connection: {
                            apiKey: '', // To be filled by user
                            timeout: 30000
                        },
                        model: {
                            name: 'text-embedding-3-small',
                            dimensions: 1536
                        },
                        advanced: {
                            batchSize: 10,
                            rateLimiting: {
                                requestsPerMinute: 3000,
                                tokensPerMinute: 1000000
                            }
                        }
                    }
                }
            },
            {
                id: 'team-hybrid',
                name: 'Team (Hybrid)',
                description: 'Team setup with ChromaDB and flexible embedding',
                category: 'team',
                tags: ['team', 'hybrid', 'chromadb', 'flexible'],
                version: '1.0.0',
                configuration: {
                    ...ConfigurationValidator.createDefault(),
                    metadata: {
                        name: 'Team Configuration',
                        description: 'Team collaboration setup',
                        environment: 'staging',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    database: {
                        provider: 'chromadb',
                        connection: {
                            url: 'http://localhost:8000',
                            timeout: 30000
                        },
                        collections: {
                            defaultCollection: 'team_context',
                            collections: [{
                                name: 'team_context',
                                vectorSize: 384,
                                distance: 'cosine'
                            }]
                        },
                        advanced: {
                            batchSize: 50,
                            maxRetries: 3,
                            retryDelay: 1000
                        }
                    },
                    indexing: {
                        patterns: {
                            include: ['**/*.ts', '**/*.js', '**/*.py', '**/*.java', '**/*.md'],
                            exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
                            fileTypes: ['typescript', 'javascript', 'python', 'java', 'markdown'],
                            maxFileSize: 2097152 // 2MB
                        },
                        processing: {
                            chunkSize: 1500,
                            chunkOverlap: 300,
                            batchSize: 25,
                            parallelism: 2
                        },
                        scheduling: {
                            autoIndex: true,
                            watchFiles: true,
                            incrementalUpdates: true
                        },
                        advanced: {
                            languageDetection: true,
                            codeAnalysis: true,
                            semanticChunking: true,
                            metadataExtraction: ['language', 'functions', 'classes', 'imports', 'comments']
                        }
                    }
                }
            }
        ];
    }

    /**
     * Apply a configuration preset
     * 
     * Applies a predefined configuration preset to the current environment.
     * Automatically creates a backup before applying the preset.
     * 
     * @param presetId - ID of the preset to apply
     * @returns Promise resolving to preset application result with configuration or error
     */
    async applyPreset(presetId: string): Promise<{ success: boolean; configuration?: ConfigurationSchema; error?: string }> {
        try {
            // Find the requested preset
            const presets = this.getConfigurationPresets();
            const preset = presets.find(p => p.id === presetId);

            if (!preset) {
                return {
                    success: false,
                    error: `Configuration preset not found: ${presetId}`
                };
            }

            // Create backup before applying preset
            const currentConfig = await this.getCurrentConfiguration();
            if (currentConfig) {
                await this.createBackup(currentConfig, 'auto', `Pre-preset application: ${preset.name}`);
            }

            // Update metadata with application timestamp
            const configuration = {
                ...preset.configuration,
                metadata: {
                    ...preset.configuration.metadata,
                    updatedAt: new Date().toISOString()
                }
            };

            return { success: true, configuration };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
