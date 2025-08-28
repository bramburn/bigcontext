import * as assert from 'assert';
import { XmlFormatterService } from '../../formatting/XmlFormatterService';
import { SearchResult } from '../../db/qdrantService';

/**
 * Test suite for XmlFormatterService
 *
 * These tests verify the XML formatting functionality, including CDATA handling,
 * special character escaping, and proper XML structure generation. The XmlFormatterService
 * is responsible for converting search results into well-formed XML documents that can
 * be consumed by external systems or exported for analysis.
 */
suite('XmlFormatterService Tests', () => {
    let xmlFormatterService: XmlFormatterService;

    setup(() => {
        // Create a fresh XmlFormatterService instance for each test
        // This ensures tests are isolated and don't affect each other
        xmlFormatterService = new XmlFormatterService();
    });

    test('should format empty results array', () => {
        // Test that the service handles empty results arrays correctly
        // This verifies the basic XML structure when no search results are available
        const results: SearchResult[] = [];
        const xml = xmlFormatterService.formatResults(results);

        // Verify the basic XML structure is present even with no results
        assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Should include XML declaration');
        assert.ok(xml.includes('<files'), 'Should include root files element');
        assert.ok(xml.includes('count="0"'), 'Should include count attribute');
        assert.ok(xml.includes('</files>'), 'Should close files element');
    });

    test('should format single result with basic content', () => {
        // Test that the service correctly formats a single search result
        // This verifies that all required attributes and content are properly included
        const results: SearchResult[] = [
            {
                id: 'test-1',
                score: 0.85,
                payload: {
                    filePath: 'src/test.ts',
                    content: 'function test() { return "hello"; }',
                    startLine: 1,
                    endLine: 3,
                    type: 'function',
                    language: 'typescript'
                }
            }
        ];

        const xml = xmlFormatterService.formatResults(results);

        // Verify all required attributes are present and correctly formatted
        assert.ok(xml.includes('<file path="src/test.ts"'), 'Should include file path attribute');
        assert.ok(xml.includes('score="0.8500"'), 'Should include score attribute');
        assert.ok(xml.includes('language="typescript"'), 'Should include language attribute');
        assert.ok(xml.includes('startLine="1"'), 'Should include startLine attribute');
        assert.ok(xml.includes('endLine="3"'), 'Should include endLine attribute');
        assert.ok(xml.includes('type="function"'), 'Should include type attribute');
        assert.ok(xml.includes('<![CDATA[function test() { return "hello"; }]]>'), 'Should wrap content in CDATA');
    });

    test('should handle special XML characters in content using CDATA', () => {
        // Test that the service properly handles special XML characters in code content
        // This verifies that CDATA sections are used to preserve special characters
        const results: SearchResult[] = [
            {
                id: 'test-2',
                score: 0.75,
                payload: {
                    filePath: 'src/special.ts',
                    content: 'const xml = "<tag>content & more</tag>";',
                    startLine: 5,
                    endLine: 5,
                    type: 'variable',
                    language: 'typescript'
                }
            }
        ];

        const xml = xmlFormatterService.formatResults(results);

        // CDATA should preserve special characters without XML escaping
        assert.ok(xml.includes('<![CDATA[const xml = "<tag>content & more</tag>";]]>'),
                 'Should preserve special XML characters in CDATA section');
        assert.ok(xmlFormatterService.validateXml(xml), 'Generated XML should be valid');
    });

    test('should handle multiple results with different file types', () => {
        // Test that the service correctly handles multiple results with different file types
        // This verifies that the service can process diverse search results in a single XML document
        const results: SearchResult[] = [
            {
                id: 'test-3',
                score: 0.9,
                payload: {
                    filePath: 'src/component.tsx',
                    content: 'export const Component = () => <div>Hello</div>;',
                    startLine: 1,
                    endLine: 1,
                    type: 'component',
                    language: 'typescript'
                }
            },
            {
                id: 'test-4',
                score: 0.8,
                payload: {
                    filePath: 'src/utils.py',
                    content: 'def helper_function():\n    return True',
                    startLine: 10,
                    endLine: 12,
                    type: 'function',
                    language: 'python'
                }
            }
        ];

        const xml = xmlFormatterService.formatResults(results);

        // Verify that multiple results are correctly included with their respective metadata
        assert.ok(xml.includes('count="2"'), 'Should include correct count');
        assert.ok(xml.includes('<file path="src/component.tsx"'), 'Should include first file');
        assert.ok(xml.includes('<file path="src/utils.py"'), 'Should include second file');
        assert.ok(xml.includes('language="typescript"'), 'Should include TypeScript language');
        assert.ok(xml.includes('language="python"'), 'Should include Python language');
        assert.ok(xmlFormatterService.validateXml(xml), 'Generated XML should be valid');
    });

    test('should handle results without content', () => {
        // Test that the service handles results with empty content gracefully
        // This verifies edge cases where search results might not have content
        const results: SearchResult[] = [
            {
                id: 'test-5',
                score: 0.6,
                payload: {
                    filePath: 'src/empty.ts',
                    content: '',
                    startLine: 1,
                    endLine: 1,
                    type: 'file',
                    language: 'typescript'
                }
            }
        ];

        const xml = xmlFormatterService.formatResults(results);

        // Verify that empty content is handled without breaking XML structure
        assert.ok(xml.includes('<file path="src/empty.ts"'), 'Should include file path');
        assert.ok(xml.includes('></file>') || xml.includes('/>'), 'Should handle empty content gracefully');
        assert.ok(xmlFormatterService.validateXml(xml), 'Generated XML should be valid');
    });

    test('should format minimal XML without metadata', () => {
        // Test that the service can generate minimal XML without metadata
        // This verifies the alternative formatting option for simpler XML output
        const results: SearchResult[] = [
            {
                id: 'test-6',
                score: 0.7,
                payload: {
                    filePath: 'src/minimal.ts',
                    content: 'console.log("test");',
                    startLine: 1,
                    endLine: 1,
                    type: 'statement',
                    language: 'typescript'
                }
            }
        ];

        const xml = xmlFormatterService.formatMinimal(results);

        // Verify that minimal XML excludes metadata but includes essential content
        assert.ok(!xml.includes('<?xml'), 'Should not include XML declaration');
        assert.ok(!xml.includes('score='), 'Should not include score metadata');
        assert.ok(!xml.includes('language='), 'Should not include language metadata');
        assert.ok(xml.includes('<file path="src/minimal.ts"'), 'Should still include file path');
        assert.ok(xml.includes('<![CDATA[console.log("test");]]>'), 'Should include content');
    });

    test('should provide formatting statistics', () => {
        // Test that the service can provide statistics about the formatting process
        // This verifies the statistics calculation functionality
        const results: SearchResult[] = [
            {
                id: 'test-7',
                score: 0.8,
                payload: {
                    filePath: 'src/stats.ts',
                    content: 'function test() {}',
                    startLine: 1,
                    endLine: 1,
                    type: 'function',
                    language: 'typescript'
                }
            },
            {
                id: 'test-8',
                score: 0.7,
                payload: {
                    filePath: 'src/empty.ts',
                    content: '',
                    startLine: 1,
                    endLine: 1,
                    type: 'file',
                    language: 'typescript'
                }
            }
        ];

        const xml = xmlFormatterService.formatResults(results);
        const stats = xmlFormatterService.getFormattingStats(results, xml);

        // Verify that statistics are calculated correctly
        assert.strictEqual(stats.resultCount, 2, 'Should count all results');
        assert.strictEqual(stats.hasContent, 1, 'Should count results with content');
        assert.strictEqual(stats.emptyContent, 1, 'Should count results without content');
        assert.ok(stats.xmlSize > 0, 'Should calculate XML size');
        assert.ok(stats.averageContentLength >= 0, 'Should calculate average content length');
    });

    test('should validate generated XML', () => {
        // Test that the service can validate its own generated XML
        // This verifies the XML validation functionality
        const results: SearchResult[] = [
            {
                id: 'test-9',
                score: 0.9,
                payload: {
                    filePath: 'src/valid.ts',
                    content: 'const test = "valid & proper <XML>";',
                    startLine: 1,
                    endLine: 1,
                    type: 'variable',
                    language: 'typescript'
                }
            }
        ];

        const xml = xmlFormatterService.formatResults(results);
        const isValid = xmlFormatterService.validateXml(xml);

        // Verify that the generated XML is valid and well-formed
        assert.ok(isValid, 'Generated XML should be valid and well-formed');
    });

    test('should handle missing optional properties gracefully', () => {
        // Test that the service handles missing optional properties gracefully
        // This verifies robustness when dealing with incomplete search result data
        const results: SearchResult[] = [
            {
                id: 'test-10',
                score: 0.5,
                payload: {
                    filePath: 'src/minimal.ts',
                    content: 'test content',
                    startLine: 1,
                    endLine: 1,
                    type: 'unknown',
                    language: 'unknown'
                    // Missing optional properties like name, signature, etc.
                }
            }
        ];

        const xml = xmlFormatterService.formatResults(results);

        // Verify that missing optional properties don't break XML generation
        assert.ok(xml.includes('<file path="src/minimal.ts"'), 'Should include file path');
        assert.ok(xml.includes('language="unknown"'), 'Should handle unknown language');
        assert.ok(xml.includes('type="unknown"'), 'Should handle unknown type');
        assert.ok(xmlFormatterService.validateXml(xml), 'Generated XML should be valid');
    });
});
