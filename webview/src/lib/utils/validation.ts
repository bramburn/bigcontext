/**
 * Comprehensive Validation Utilities
 * 
 * Provides validation functions for all user inputs in the Code Context Engine.
 * Includes database connections, provider configurations, search queries, and more.
 */

// Validation result interface
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}

// Validation rule interface
export interface ValidationRule<T = any> {
    name: string;
    validate: (value: T) => ValidationResult;
    required?: boolean;
    async?: boolean;
}

// Database configuration interfaces
export interface DatabaseConfig {
    type: 'qdrant' | 'chromadb' | 'pinecone';
    host?: string;
    port?: number;
    apiKey?: string;
    environment?: string;
    collection?: string;
}

export interface ProviderConfig {
    type: 'ollama' | 'openai' | 'azure';
    apiKey?: string;
    endpoint?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

/**
 * Create a successful validation result
 */
export function createValidResult(warnings: string[] = [], suggestions: string[] = []): ValidationResult {
    return {
        isValid: true,
        errors: [],
        warnings,
        suggestions
    };
}

/**
 * Create a failed validation result
 */
export function createInvalidResult(errors: string[], warnings: string[] = [], suggestions: string[] = []): ValidationResult {
    return {
        isValid: false,
        errors,
        warnings,
        suggestions
    };
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
    const combined: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
    };

    for (const result of results) {
        if (!result.isValid) {
            combined.isValid = false;
        }
        combined.errors.push(...result.errors);
        combined.warnings.push(...result.warnings);
        combined.suggestions.push(...result.suggestions);
    }

    return combined;
}

// Basic validation functions
export const validators = {
    /**
     * Validate that a value is not empty
     */
    required: (value: any, fieldName: string = 'Field'): ValidationResult => {
        if (value === null || value === undefined || value === '') {
            return createInvalidResult([`${fieldName} is required`]);
        }
        return createValidResult();
    },

    /**
     * Validate string length
     */
    stringLength: (value: string, min: number = 0, max: number = Infinity, fieldName: string = 'Field'): ValidationResult => {
        if (typeof value !== 'string') {
            return createInvalidResult([`${fieldName} must be a string`]);
        }

        const length = value.length;
        const errors: string[] = [];

        if (length < min) {
            errors.push(`${fieldName} must be at least ${min} characters long`);
        }
        if (length > max) {
            errors.push(`${fieldName} must be no more than ${max} characters long`);
        }

        return errors.length > 0 ? createInvalidResult(errors) : createValidResult();
    },

    /**
     * Validate URL format
     */
    url: (value: string, fieldName: string = 'URL'): ValidationResult => {
        if (!value) {
            return createValidResult();
        }

        try {
            new URL(value);
            return createValidResult();
        } catch {
            return createInvalidResult([`${fieldName} must be a valid URL`]);
        }
    },

    /**
     * Validate port number
     */
    port: (value: number | string, fieldName: string = 'Port'): ValidationResult => {
        const port = typeof value === 'string' ? parseInt(value, 10) : value;
        
        if (isNaN(port)) {
            return createInvalidResult([`${fieldName} must be a valid number`]);
        }

        if (port < 1 || port > 65535) {
            return createInvalidResult([`${fieldName} must be between 1 and 65535`]);
        }

        return createValidResult();
    },

    /**
     * Validate API key format
     */
    apiKey: (value: string, fieldName: string = 'API Key'): ValidationResult => {
        if (!value) {
            return createInvalidResult([`${fieldName} is required`]);
        }

        const warnings: string[] = [];
        const suggestions: string[] = [];

        // Check for common API key patterns
        if (value.length < 10) {
            warnings.push(`${fieldName} seems unusually short`);
        }

        if (value.includes(' ')) {
            return createInvalidResult([`${fieldName} should not contain spaces`]);
        }

        if (value === 'your-api-key' || value === 'placeholder' || value === 'test') {
            return createInvalidResult([`Please enter a valid ${fieldName}`]);
        }

        // Check for potential security issues
        if (value.toLowerCase().includes('key') || value.toLowerCase().includes('secret')) {
            suggestions.push('Ensure this API key is kept secure and not shared');
        }

        return createValidResult(warnings, suggestions);
    },

    /**
     * Validate search query
     */
    searchQuery: (value: string, fieldName: string = 'Search query'): ValidationResult => {
        if (!value || !value.trim()) {
            return createInvalidResult([`${fieldName} cannot be empty`]);
        }

        const trimmed = value.trim();
        const warnings: string[] = [];
        const suggestions: string[] = [];

        if (trimmed.length < 3) {
            warnings.push('Very short queries may not return meaningful results');
        }

        if (trimmed.length > 500) {
            warnings.push('Very long queries may be truncated');
        }

        // Check for potentially problematic characters
        if (/[<>{}[\]\\]/.test(trimmed)) {
            warnings.push('Special characters in queries may affect search results');
        }

        // Provide helpful suggestions
        if (trimmed.split(' ').length === 1) {
            suggestions.push('Try using multiple words or phrases for better results');
        }

        return createValidResult(warnings, suggestions);
    }
};

// Database-specific validation
export const databaseValidators = {
    /**
     * Validate Qdrant configuration
     */
    qdrant: (config: Partial<DatabaseConfig>): ValidationResult => {
        const results: ValidationResult[] = [];

        // Host validation
        if (config.host) {
            results.push(validators.url(`http://${config.host}`, 'Host'));
        }

        // Port validation
        if (config.port) {
            results.push(validators.port(config.port, 'Port'));
        } else {
            results.push(createValidResult([], ['Default port 6333 will be used']));
        }

        return combineValidationResults(...results);
    },

    /**
     * Validate ChromaDB configuration
     */
    chromadb: (config: Partial<DatabaseConfig>): ValidationResult => {
        const results: ValidationResult[] = [];

        // Host validation
        if (config.host) {
            results.push(validators.url(`http://${config.host}`, 'Host'));
        }

        // Port validation
        if (config.port) {
            results.push(validators.port(config.port, 'Port'));
        } else {
            results.push(createValidResult([], ['Default port 8000 will be used']));
        }

        return combineValidationResults(...results);
    },

    /**
     * Validate Pinecone configuration
     */
    pinecone: (config: Partial<DatabaseConfig>): ValidationResult => {
        const results: ValidationResult[] = [];

        // API key is required for Pinecone
        results.push(validators.required(config.apiKey, 'API Key'));
        if (config.apiKey) {
            results.push(validators.apiKey(config.apiKey, 'Pinecone API Key'));
        }

        // Environment validation
        results.push(validators.required(config.environment, 'Environment'));
        if (config.environment) {
            results.push(validators.stringLength(config.environment, 1, 50, 'Environment'));
        }

        return combineValidationResults(...results);
    }
};

// Provider-specific validation
export const providerValidators = {
    /**
     * Validate Ollama configuration
     */
    ollama: (config: Partial<ProviderConfig>): ValidationResult => {
        const results: ValidationResult[] = [];

        // Endpoint validation (optional, defaults to localhost)
        if (config.endpoint) {
            results.push(validators.url(config.endpoint, 'Endpoint'));
        } else {
            results.push(createValidResult([], ['Default endpoint http://localhost:11434 will be used']));
        }

        // Model validation
        if (config.model) {
            results.push(validators.stringLength(config.model, 1, 100, 'Model'));
        } else {
            results.push(createValidResult([], ['Default model will be used']));
        }

        return combineValidationResults(...results);
    },

    /**
     * Validate OpenAI configuration
     */
    openai: (config: Partial<ProviderConfig>): ValidationResult => {
        const results: ValidationResult[] = [];

        // API key is required
        results.push(validators.required(config.apiKey, 'OpenAI API Key'));
        if (config.apiKey) {
            results.push(validators.apiKey(config.apiKey, 'OpenAI API Key'));
            
            // OpenAI API keys have a specific format
            if (!config.apiKey.startsWith('sk-')) {
                results.push(createInvalidResult(['OpenAI API keys should start with "sk-"']));
            }
        }

        // Model validation
        if (config.model) {
            const validModels = ['text-embedding-ada-002', 'text-embedding-3-small', 'text-embedding-3-large'];
            if (!validModels.includes(config.model)) {
                results.push(createValidResult(['Unknown model specified'], [`Consider using one of: ${validModels.join(', ')}`]));
            }
        }

        return combineValidationResults(...results);
    },

    /**
     * Validate Azure OpenAI configuration
     */
    azure: (config: Partial<ProviderConfig>): ValidationResult => {
        const results: ValidationResult[] = [];

        // API key is required
        results.push(validators.required(config.apiKey, 'Azure API Key'));
        if (config.apiKey) {
            results.push(validators.apiKey(config.apiKey, 'Azure API Key'));
        }

        // Endpoint is required for Azure
        results.push(validators.required(config.endpoint, 'Azure Endpoint'));
        if (config.endpoint) {
            results.push(validators.url(config.endpoint, 'Azure Endpoint'));
            
            // Azure endpoints should contain 'openai.azure.com'
            if (!config.endpoint.includes('openai.azure.com')) {
                results.push(createValidResult(['Endpoint doesn\'t appear to be an Azure OpenAI endpoint'], ['Azure endpoints typically contain "openai.azure.com"']));
            }
        }

        return combineValidationResults(...results);
    }
};

/**
 * Validate complete database configuration
 */
export function validateDatabaseConfig(config: Partial<DatabaseConfig>): ValidationResult {
    if (!config.type) {
        return createInvalidResult(['Database type is required']);
    }

    switch (config.type) {
        case 'qdrant':
            return databaseValidators.qdrant(config);
        case 'chromadb':
            return databaseValidators.chromadb(config);
        case 'pinecone':
            return databaseValidators.pinecone(config);
        default:
            return createInvalidResult(['Invalid database type']);
    }
}

/**
 * Validate complete provider configuration
 */
export function validateProviderConfig(config: Partial<ProviderConfig>): ValidationResult {
    if (!config.type) {
        return createInvalidResult(['Provider type is required']);
    }

    switch (config.type) {
        case 'ollama':
            return providerValidators.ollama(config);
        case 'openai':
            return providerValidators.openai(config);
        case 'azure':
            return providerValidators.azure(config);
        default:
            return createInvalidResult(['Invalid provider type']);
    }
}

/**
 * Debounced validation function
 */
export function createDebouncedValidator<T>(
    validator: (value: T) => ValidationResult,
    delay: number = 300
): (value: T) => Promise<ValidationResult> {
    let timeoutId: NodeJS.Timeout;

    return (value: T): Promise<ValidationResult> => {
        return new Promise((resolve) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                try {
                    resolve(validator(value));
                } catch (error) {
                    resolve(createInvalidResult([
                        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    ]));
                }
            }, delay);
        });
    };
}
