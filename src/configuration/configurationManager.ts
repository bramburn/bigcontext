/**
 * Configuration Manager
 * 
 * This service handles configuration import/export, backup/restore, versioning,
 * and multi-environment configuration management for the Code Context Engine.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationSchema, ConfigurationValidator, ValidationResult } from './configurationSchema';

export interface ConfigurationTemplate {
    id: string;
    name: string;
    description: string;
    category: 'development' | 'production' | 'team' | 'custom';
    configuration: ConfigurationSchema;
    tags: string[];
    author?: string;
    version: string;
}

export interface ConfigurationBackup {
    id: string;
    name: string;
    timestamp: string;
    configuration: ConfigurationSchema;
    metadata: {
        reason: 'manual' | 'auto' | 'migration';
        description?: string;
        previousVersion?: string;
    };
}

export interface ConfigurationMigration {
    fromVersion: string;
    toVersion: string;
    migrate: (config: any) => ConfigurationSchema;
    description: string;
}

export class ConfigurationManager {
    private context: vscode.ExtensionContext;
    private configurationPath: string;
    private backupPath: string;
    private templatesPath: string;
    private migrations: Map<string, ConfigurationMigration> = new Map();

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.configurationPath = path.join(context.globalStorageUri.fsPath, 'configurations');
        this.backupPath = path.join(context.globalStorageUri.fsPath, 'backups');
        this.templatesPath = path.join(context.globalStorageUri.fsPath, 'templates');
        
        this.initializeDirectories();
        this.initializeMigrations();
    }

    /**
     * Initialize storage directories
     */
    private async initializeDirectories(): Promise<void> {
        try {
            await fs.promises.mkdir(this.configurationPath, { recursive: true });
            await fs.promises.mkdir(this.backupPath, { recursive: true });
            await fs.promises.mkdir(this.templatesPath, { recursive: true });
        } catch (error) {
            console.error('Failed to initialize configuration directories:', error);
        }
    }

    /**
     * Initialize configuration migrations
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
     */
    async exportConfiguration(
        configuration: ConfigurationSchema,
        filePath?: string,
        options?: {
            includeSecrets?: boolean;
            minify?: boolean;
            validate?: boolean;
        }
    ): Promise<{ success: boolean; filePath?: string; error?: string }> {
        try {
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

            // Create export configuration
            const exportConfig = { ...configuration };
            
            // Remove secrets if not included
            if (!opts.includeSecrets) {
                this.removeSecrets(exportConfig);
            }

            // Update metadata
            exportConfig.metadata.updatedAt = new Date().toISOString();

            // Determine file path
            const exportPath = filePath || await this.getExportPath(configuration.metadata.name);
            
            // Write configuration
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
     */
    async importConfiguration(
        filePath: string,
        options?: {
            validate?: boolean;
            backup?: boolean;
            merge?: boolean;
        }
    ): Promise<{ success: boolean; configuration?: ConfigurationSchema; error?: string; warnings?: string[] }> {
        try {
            const opts = {
                validate: true,
                backup: true,
                merge: false,
                ...options
            };

            // Read configuration file
            const fileContent = await fs.promises.readFile(filePath, 'utf8');
            const importedConfig = JSON.parse(fileContent) as ConfigurationSchema;

            // Validate configuration
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

            // Create backup if requested
            if (opts.backup) {
                const currentConfig = await this.getCurrentConfiguration();
                if (currentConfig) {
                    await this.createBackup(currentConfig, 'manual', 'Pre-import backup');
                }
            }

            // Handle version migration if needed
            const migratedConfig = await this.migrateConfiguration(importedConfig);

            // Update metadata
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
     */
    async createBackup(
        configuration: ConfigurationSchema,
        reason: 'manual' | 'auto' | 'migration',
        description?: string
    ): Promise<{ success: boolean; backupId?: string; error?: string }> {
        try {
            const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const backup: ConfigurationBackup = {
                id: backupId,
                name: `${configuration.metadata.name} - ${new Date().toLocaleString()}`,
                timestamp: new Date().toISOString(),
                configuration: { ...configuration },
                metadata: {
                    reason,
                    description,
                    previousVersion: configuration.version
                }
            };

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
     */
    async restoreBackup(backupId: string): Promise<{ success: boolean; configuration?: ConfigurationSchema; error?: string }> {
        try {
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

            // Update metadata
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
     */
    async listBackups(): Promise<ConfigurationBackup[]> {
        try {
            const backupFiles = await fs.promises.readdir(this.backupPath);
            const backups: ConfigurationBackup[] = [];

            for (const file of backupFiles) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(this.backupPath, file);
                        const content = await fs.promises.readFile(filePath, 'utf8');
                        const backup = JSON.parse(content) as ConfigurationBackup;
                        backups.push(backup);
                    } catch (error) {
                        console.warn(`Failed to read backup file ${file}:`, error);
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
            const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Remove secrets from template
            const templateConfig = { ...configuration };
            this.removeSecrets(templateConfig);

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
     */
    async listTemplates(): Promise<ConfigurationTemplate[]> {
        try {
            const templateFiles = await fs.promises.readdir(this.templatesPath);
            const templates: ConfigurationTemplate[] = [];

            for (const file of templateFiles) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(this.templatesPath, file);
                        const content = await fs.promises.readFile(filePath, 'utf8');
                        const template = JSON.parse(content) as ConfigurationTemplate;
                        templates.push(template);
                    } catch (error) {
                        console.warn(`Failed to read template file ${file}:`, error);
                    }
                }
            }

            return templates.sort((a, b) => a.name.localeCompare(b.name));

        } catch (error) {
            console.error('Failed to list templates:', error);
            return [];
        }
    }

    /**
     * Load template by ID
     */
    async loadTemplate(templateId: string): Promise<{ success: boolean; template?: ConfigurationTemplate; error?: string }> {
        try {
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
     */
    validateConfiguration(configuration: Partial<ConfigurationSchema>): ValidationResult {
        return ConfigurationValidator.validate(configuration);
    }

    /**
     * Create default configuration
     */
    createDefaultConfiguration(): ConfigurationSchema {
        return ConfigurationValidator.createDefault();
    }

    /**
     * Helper methods
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

    private async getExportPath(configName: string): Promise<string> {
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

        return uri ? uri.fsPath : path.join(this.configurationPath, fileName);
    }

    private async getCurrentConfiguration(): Promise<ConfigurationSchema | null> {
        // This would typically load from VS Code settings or a current config file
        // For now, return null as this would be implemented based on your current config storage
        return null;
    }

    private async migrateConfiguration(config: ConfigurationSchema): Promise<ConfigurationSchema> {
        // Check if migration is needed
        const currentVersion = ConfigurationValidator.createDefault().version;
        if (config.version === currentVersion) {
            return config;
        }

        // Apply migrations if available
        const migrationKey = `${config.version}->${currentVersion}`;
        const migration = this.migrations.get(migrationKey);
        
        if (migration) {
            console.log(`Migrating configuration from ${config.version} to ${currentVersion}`);
            return migration.migrate(config);
        }

        // If no migration available, return as-is with updated version
        return { ...config, version: currentVersion };
    }

    private async cleanupOldBackups(): Promise<void> {
        try {
            const backups = await this.listBackups();
            if (backups.length > 10) {
                const oldBackups = backups.slice(10);
                for (const backup of oldBackups) {
                    const backupFilePath = path.join(this.backupPath, `${backup.id}.json`);
                    await fs.promises.unlink(backupFilePath);
                }
            }
        } catch (error) {
            console.warn('Failed to cleanup old backups:', error);
        }
    }

    /**
     * Get configuration presets for common setups
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
     */
    async applyPreset(presetId: string): Promise<{ success: boolean; configuration?: ConfigurationSchema; error?: string }> {
        try {
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

            // Update metadata
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
