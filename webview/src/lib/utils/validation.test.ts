/**
 * Validation Utilities Unit Tests
 * 
 * Tests for the comprehensive validation system.
 */

import { describe, it, expect, vi } from 'vitest';
import {
	validators,
	validateDatabaseConfig,
	validateProviderConfig,
	createValidResult,
	createInvalidResult,
	combineValidationResults,
	createDebouncedValidator
} from './validation';

describe('Validation Utilities', () => {
	describe('Helper Functions', () => {
		it('should create valid result', () => {
			const result = createValidResult(['warning'], ['suggestion']);
			expect(result).toEqual({
				isValid: true,
				errors: [],
				warnings: ['warning'],
				suggestions: ['suggestion']
			});
		});

		it('should create invalid result', () => {
			const result = createInvalidResult(['error'], ['warning'], ['suggestion']);
			expect(result).toEqual({
				isValid: false,
				errors: ['error'],
				warnings: ['warning'],
				suggestions: ['suggestion']
			});
		});

		it('should combine validation results', () => {
			const result1 = createValidResult(['warning1']);
			const result2 = createInvalidResult(['error1']);
			const result3 = createValidResult([], ['suggestion1']);

			const combined = combineValidationResults(result1, result2, result3);
			expect(combined).toEqual({
				isValid: false,
				errors: ['error1'],
				warnings: ['warning1'],
				suggestions: ['suggestion1']
			});
		});
	});

	describe('Basic Validators', () => {
		describe('required', () => {
			it('should pass for non-empty values', () => {
				expect(validators.required('test')).toEqual(createValidResult());
				expect(validators.required(0)).toEqual(createValidResult());
				expect(validators.required(false)).toEqual(createValidResult());
			});

			it('should fail for empty values', () => {
				expect(validators.required('')).toEqual(createInvalidResult(['Field is required']));
				expect(validators.required(null)).toEqual(createInvalidResult(['Field is required']));
				expect(validators.required(undefined)).toEqual(createInvalidResult(['Field is required']));
			});

			it('should use custom field name', () => {
				const result = validators.required('', 'Username');
				expect(result.errors[0]).toBe('Username is required');
			});
		});

		describe('stringLength', () => {
			it('should pass for valid length strings', () => {
				expect(validators.stringLength('test', 1, 10)).toEqual(createValidResult());
				expect(validators.stringLength('hello', 5, 5)).toEqual(createValidResult());
			});

			it('should fail for strings that are too short', () => {
				const result = validators.stringLength('hi', 5, 10);
				expect(result.isValid).toBe(false);
				expect(result.errors[0]).toContain('at least 5 characters');
			});

			it('should fail for strings that are too long', () => {
				const result = validators.stringLength('this is a very long string', 1, 10);
				expect(result.isValid).toBe(false);
				expect(result.errors[0]).toContain('no more than 10 characters');
			});

			it('should fail for non-string values', () => {
				const result = validators.stringLength(123 as any, 1, 10);
				expect(result.isValid).toBe(false);
				expect(result.errors[0]).toContain('must be a string');
			});
		});

		describe('url', () => {
			it('should pass for valid URLs', () => {
				expect(validators.url('https://example.com')).toEqual(createValidResult());
				expect(validators.url('http://localhost:3000')).toEqual(createValidResult());
				expect(validators.url('ftp://files.example.com')).toEqual(createValidResult());
			});

			it('should pass for empty values (optional)', () => {
				expect(validators.url('')).toEqual(createValidResult());
			});

			it('should fail for invalid URLs', () => {
				expect(validators.url('not-a-url').isValid).toBe(false);
				expect(validators.url('http://').isValid).toBe(false);
				expect(validators.url('just-text').isValid).toBe(false);
			});
		});

		describe('port', () => {
			it('should pass for valid port numbers', () => {
				expect(validators.port(80)).toEqual(createValidResult());
				expect(validators.port('3000')).toEqual(createValidResult());
				expect(validators.port(65535)).toEqual(createValidResult());
			});

			it('should fail for invalid port numbers', () => {
				expect(validators.port(0).isValid).toBe(false);
				expect(validators.port(65536).isValid).toBe(false);
				expect(validators.port(-1).isValid).toBe(false);
				expect(validators.port('not-a-number').isValid).toBe(false);
			});
		});

		describe('apiKey', () => {
			it('should pass for valid API keys', () => {
				expect(validators.apiKey('sk-1234567890abcdef')).toEqual(
					expect.objectContaining({ isValid: true })
				);
				expect(validators.apiKey('valid-api-key-123')).toEqual(
					expect.objectContaining({ isValid: true })
				);
			});

			it('should fail for invalid API keys', () => {
				expect(validators.apiKey('').isValid).toBe(false);
				expect(validators.apiKey('key with spaces').isValid).toBe(false);
				expect(validators.apiKey('your-api-key').isValid).toBe(false);
				expect(validators.apiKey('placeholder').isValid).toBe(false);
			});

			it('should provide warnings for short keys', () => {
				const result = validators.apiKey('short');
				expect(result.warnings).toContain('API Key seems unusually short');
			});

			it('should provide security suggestions', () => {
				const result = validators.apiKey('my-secret-key');
				expect(result.suggestions).toContain('Ensure this API key is kept secure and not shared');
			});
		});

		describe('searchQuery', () => {
			it('should pass for valid search queries', () => {
				expect(validators.searchQuery('function test')).toEqual(
					expect.objectContaining({ isValid: true })
				);
				expect(validators.searchQuery('class Component')).toEqual(
					expect.objectContaining({ isValid: true })
				);
			});

			it('should fail for empty queries', () => {
				expect(validators.searchQuery('').isValid).toBe(false);
				expect(validators.searchQuery('   ').isValid).toBe(false);
			});

			it('should provide warnings for short queries', () => {
				const result = validators.searchQuery('ab');
				expect(result.warnings).toContain('Very short queries may not return meaningful results');
			});

			it('should provide warnings for very long queries', () => {
				const longQuery = 'a'.repeat(600);
				const result = validators.searchQuery(longQuery);
				expect(result.warnings).toContain('Very long queries may be truncated');
			});

			it('should provide suggestions for single word queries', () => {
				const result = validators.searchQuery('function');
				expect(result.suggestions).toContain('Try using multiple words or phrases for better results');
			});
		});
	});

	describe('Database Configuration Validation', () => {
		describe('Qdrant', () => {
			it('should pass for valid Qdrant config', () => {
				const config = {
					type: 'qdrant' as const,
					host: 'localhost',
					port: 6333
				};
				const result = validateDatabaseConfig(config);
				expect(result.isValid).toBe(true);
			});

			it('should provide default port suggestion', () => {
				const config = {
					type: 'qdrant' as const,
					host: 'localhost'
				};
				const result = validateDatabaseConfig(config);
				expect(result.suggestions).toContain('Default port 6333 will be used');
			});
		});

		describe('ChromaDB', () => {
			it('should pass for valid ChromaDB config', () => {
				const config = {
					type: 'chromadb' as const,
					host: 'localhost',
					port: 8000
				};
				const result = validateDatabaseConfig(config);
				expect(result.isValid).toBe(true);
			});
		});

		describe('Pinecone', () => {
			it('should require API key and environment', () => {
				const config = {
					type: 'pinecone' as const
				};
				const result = validateDatabaseConfig(config);
				expect(result.isValid).toBe(false);
				expect(result.errors).toContain('API Key is required');
				expect(result.errors).toContain('Environment is required');
			});

			it('should pass for valid Pinecone config', () => {
				const config = {
					type: 'pinecone' as const,
					apiKey: 'valid-api-key-123',
					environment: 'us-west1-gcp'
				};
				const result = validateDatabaseConfig(config);
				expect(result.isValid).toBe(true);
			});
		});

		it('should fail for missing database type', () => {
			const config = {};
			const result = validateDatabaseConfig(config as any);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Database type is required');
		});

		it('should fail for invalid database type', () => {
			const config = { type: 'invalid' };
			const result = validateDatabaseConfig(config as any);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Invalid database type');
		});
	});

	describe('Provider Configuration Validation', () => {
		describe('Ollama', () => {
			it('should pass for valid Ollama config', () => {
				const config = {
					type: 'ollama' as const,
					endpoint: 'http://localhost:11434',
					model: 'nomic-embed-text'
				};
				const result = validateProviderConfig(config);
				expect(result.isValid).toBe(true);
			});

			it('should provide default endpoint suggestion', () => {
				const config = {
					type: 'ollama' as const
				};
				const result = validateProviderConfig(config);
				expect(result.suggestions).toContain('Default endpoint http://localhost:11434 will be used');
			});
		});

		describe('OpenAI', () => {
			it('should require API key', () => {
				const config = {
					type: 'openai' as const
				};
				const result = validateProviderConfig(config);
				expect(result.isValid).toBe(false);
				expect(result.errors).toContain('OpenAI API Key is required');
			});

			it('should validate API key format', () => {
				const config = {
					type: 'openai' as const,
					apiKey: 'invalid-key'
				};
				const result = validateProviderConfig(config);
				expect(result.isValid).toBe(false);
				expect(result.errors).toContain('OpenAI API keys should start with "sk-"');
			});

			it('should pass for valid OpenAI config', () => {
				const config = {
					type: 'openai' as const,
					apiKey: 'sk-1234567890abcdef',
					model: 'text-embedding-ada-002'
				};
				const result = validateProviderConfig(config);
				expect(result.isValid).toBe(true);
			});
		});

		describe('Azure', () => {
			it('should require API key and endpoint', () => {
				const config = {
					type: 'azure' as const
				};
				const result = validateProviderConfig(config);
				expect(result.isValid).toBe(false);
				expect(result.errors).toContain('Azure API Key is required');
				expect(result.errors).toContain('Azure Endpoint is required');
			});

			it('should validate Azure endpoint format', () => {
				const config = {
					type: 'azure' as const,
					apiKey: 'valid-key',
					endpoint: 'https://example.com'
				};
				const result = validateProviderConfig(config);
				expect(result.warnings).toContain('Endpoint doesn\'t appear to be an Azure OpenAI endpoint');
			});

			it('should pass for valid Azure config', () => {
				const config = {
					type: 'azure' as const,
					apiKey: 'valid-key',
					endpoint: 'https://my-resource.openai.azure.com/'
				};
				const result = validateProviderConfig(config);
				expect(result.isValid).toBe(true);
			});
		});
	});

	describe('Debounced Validator', () => {
		it('should debounce validation calls', async () => {
			const mockValidator = vi.fn(() => createValidResult());
			const debouncedValidator = createDebouncedValidator(mockValidator, 50);

			// Call multiple times quickly
			debouncedValidator('test1');
			debouncedValidator('test2');
			const finalResult = debouncedValidator('test3');

			// Wait for the final result
			await finalResult;

			// Wait a bit more to ensure debouncing worked
			await new Promise(resolve => setTimeout(resolve, 100));

			// Should only call the validator once with the last value
			expect(mockValidator).toHaveBeenCalledTimes(1);
			expect(mockValidator).toHaveBeenCalledWith('test3');
		});

		it('should handle validation errors', async () => {
			const mockValidator = vi.fn(() => {
				throw new Error('Validation failed');
			});
			const debouncedValidator = createDebouncedValidator(mockValidator, 10);

			// The debounced validator should catch errors and return invalid result
			const result = await debouncedValidator('test');
			expect(result.isValid).toBe(false);
			expect(result.errors[0]).toContain('Validation failed');
		});
	});
});
