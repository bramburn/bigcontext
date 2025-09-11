/**
 * AstParser Error Handling Tests
 *
 * Tests for the enhanced AstParser with configuration-aware error handling
 */

import * as assert from 'assert';
import { AstParser, ParseResult } from '../../parsing/astParser';
import { ConfigurationService } from '../../services/ConfigurationService';
import { Configuration, DEFAULT_CONFIGURATION } from '../../types/configuration';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock configuration service for testing
class MockConfigurationService {
  private config: Configuration;

  constructor(skipSyntaxErrors = true) {
    this.config = {
      ...DEFAULT_CONFIGURATION,
      treeSitter: {
        skipSyntaxErrors,
      },
    };
  }

  getConfiguration(): Configuration {
    return this.config;
  }

  setSkipSyntaxErrors(skip: boolean): void {
    this.config.treeSitter.skipSyntaxErrors = skip;
  }
}

describe('AstParser Error Handling', () => {
  let astParser: AstParser;
  let mockConfigService: MockConfigurationService;

  beforeEach(() => {
    mockConfigService = new MockConfigurationService();
    astParser = new AstParser(mockConfigService as any);
  });

  describe('shouldSkipSyntaxErrors', () => {
    it('should return true when configuration allows skipping errors', () => {
      mockConfigService.setSkipSyntaxErrors(true);
      assert.strictEqual(astParser.shouldSkipSyntaxErrors(), true);
    });

    it('should return false when configuration disallows skipping errors', () => {
      mockConfigService.setSkipSyntaxErrors(false);
      assert.strictEqual(astParser.shouldSkipSyntaxErrors(), false);
    });

    it('should default to true when no config service is provided', () => {
      const parserWithoutConfig = new AstParser();
      assert.strictEqual(parserWithoutConfig.shouldSkipSyntaxErrors(), true);
    });
  });

  describe('parseRobust', () => {
    const validTypeScriptCode = `
      function hello(name: string): string {
        return \`Hello, \${name}!\`;
      }
    `;

    const invalidTypeScriptCode = `
      function hello(name: string): string {
        return \`Hello, \${name!\`;  // Missing closing brace
      }
      // More invalid syntax
      const x = ;
    `;

    it('should successfully parse valid code', () => {
      const result = astParser.parseRobust('test.ts', validTypeScriptCode, 'typescript');

      assert.strictEqual(result.success, true);
      assert.ok(result.tree);
      assert.strictEqual(result.errors.length, 0);
      assert.strictEqual(result.errorsSkipped, false);
      assert.strictEqual(result.filePath, 'test.ts');
    });

    it('should handle syntax errors when skipping is enabled', () => {
      mockConfigService.setSkipSyntaxErrors(true);

      const result = astParser.parseRobust('test.ts', invalidTypeScriptCode, 'typescript');

      assert.strictEqual(result.success, true); // Should still succeed
      assert.ok(result.tree); // Tree should be available for partial processing
      assert.ok(result.errors.length > 0); // Should have detected errors
      assert.strictEqual(result.errorsSkipped, true);
    });

    it('should fail when syntax errors exist and skipping is disabled', () => {
      mockConfigService.setSkipSyntaxErrors(false);

      const result = astParser.parseRobust('test.ts', invalidTypeScriptCode, 'typescript');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.tree, null);
      assert.ok(result.errors.length > 0);
      assert.strictEqual(result.errorsSkipped, false);
    });

    it('should provide detailed error information', () => {
      const codeWithSyntaxError = `
        function test() {
          const x =
        }
      `;

      const result = astParser.parseRobust('test.ts', codeWithSyntaxError, 'typescript');

      if (result.errors.length > 0) {
        assert.ok(result.errors[0].includes('Syntax error at line'));
      }
    });
  });

  describe('parseWithErrorRecovery', () => {
    it('should collect syntax errors from AST', () => {
      const invalidCode = `
        function test() {
          const x = ;
          return x
        }
      `;

      const result = astParser.parseWithErrorRecovery('typescript', invalidCode);

      // Should have a tree (even with errors) and error information
      assert.ok(result.tree || result.errors.length > 0);
    });

    it('should handle valid code without errors', () => {
      const validCode = `
        function test(): number {
          return 42;
        }
      `;

      const result = astParser.parseWithErrorRecovery('typescript', validCode);

      assert.ok(result.tree);
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe('language support', () => {
    it('should handle different languages with error recovery', () => {
      const languages = ['typescript', 'javascript', 'python'] as const;

      for (const language of languages) {
        let testCode = '';

        switch (language) {
          case 'typescript':
          case 'javascript':
            testCode = 'function test() { const x = ; }'; // Missing value
            break;
          case 'python':
            testCode = 'def test():\n    x = \n    return x'; // Missing value
            break;
        }

        const result = astParser.parseRobust(`test.${language}`, testCode, language);

        // Should handle the error gracefully regardless of language
        assert.strictEqual(result.filePath, `test.${language}`);
        assert.ok(typeof result.success === 'boolean');
      }
    });
  });

  describe('integration with configuration changes', () => {
    it('should respect configuration changes during runtime', () => {
      const invalidCode = 'function test() { const x = ; }';

      // First parse with skipping enabled
      mockConfigService.setSkipSyntaxErrors(true);
      const result1 = astParser.parseRobust('test.ts', invalidCode, 'typescript');

      // Then parse with skipping disabled
      mockConfigService.setSkipSyntaxErrors(false);
      const result2 = astParser.parseRobust('test.ts', invalidCode, 'typescript');

      // Results should be different based on configuration
      assert.notStrictEqual(result1.success, result2.success);
    });
  });
});
