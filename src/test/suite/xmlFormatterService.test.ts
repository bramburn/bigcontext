import * as assert from 'assert';
import { XmlFormatterService } from '../../formatting/XmlFormatterService';
import { SearchResult } from '../../db/qdrantService';

/**
 * Test suite for XmlFormatterService
 * 
 * These tests verify the XML formatting functionality, including CDATA handling,
 * special character escaping, and proper XML structure generation.
 */
suite('XmlFormatterService Tests', () => {
    let xmlFormatterService: XmlFormatterService;

    setup(() => {
        xmlFormatterService = new XmlFormatterService();
    });

    test('should format empty results array', () => {
        const results: SearchResult[] = [];
        const xml = xmlFormatterService.formatResults(results);

        assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Should include XML declaration');
        assert.ok(xml.includes('<files'), 'Should include root files element');
        assert.ok(xml.includes('count="0"'), 'Should include count attribute');
        assert.ok(xml.includes('</files>'), 'Should close files element');
    });

    test('should format single result with basic content', () => {
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

        assert.ok(xml.includes('<file path="src/test.ts"'), 'Should include file path attribute');
        assert.ok(xml.includes('score="0.8500"'), 'Should include score attribute');
        assert.ok(xml.includes('language="typescript"'), 'Should include language attribute');
        assert.ok(xml.includes('startLine="1"'), 'Should include startLine attribute');
        assert.ok(xml.includes('endLine="3"'), 'Should include endLine attribute');
        assert.ok(xml.includes('type="function"'), 'Should include type attribute');
        assert.ok(xml.includes('<![CDATA[function test() { return "hello"; }]]>'), 'Should wrap content in CDATA');
    });

    test('should handle special XML characters in content using CDATA', () => {
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

        // CDATA should preserve special characters
        assert.ok(xml.includes('<![CDATA[const xml = "<tag>content & more</tag>";]]>'), 
                 'Should preserve special XML characters in CDATA section');
        assert.ok(xmlFormatterService.validateXml(xml), 'Generated XML should be valid');
    });

    test('should handle multiple results with different file types', () => {
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

        assert.ok(xml.includes('count="2"'), 'Should include correct count');
        assert.ok(xml.includes('<file path="src/component.tsx"'), 'Should include first file');
        assert.ok(xml.includes('<file path="src/utils.py"'), 'Should include second file');
        assert.ok(xml.includes('language="typescript"'), 'Should include TypeScript language');
        assert.ok(xml.includes('language="python"'), 'Should include Python language');
        assert.ok(xmlFormatterService.validateXml(xml), 'Generated XML should be valid');
    });

    test('should handle results without content', () => {
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

        assert.ok(xml.includes('<file path="src/empty.ts"'), 'Should include file path');
        assert.ok(xml.includes('></file>') || xml.includes('/>'), 'Should handle empty content gracefully');
        assert.ok(xmlFormatterService.validateXml(xml), 'Generated XML should be valid');
    });

    test('should format minimal XML without metadata', () => {
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

        assert.ok(!xml.includes('<?xml'), 'Should not include XML declaration');
        assert.ok(!xml.includes('score='), 'Should not include score metadata');
        assert.ok(!xml.includes('language='), 'Should not include language metadata');
        assert.ok(xml.includes('<file path="src/minimal.ts"'), 'Should still include file path');
        assert.ok(xml.includes('<![CDATA[console.log("test");]]>'), 'Should include content');
    });

    test('should provide formatting statistics', () => {
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

        assert.strictEqual(stats.resultCount, 2, 'Should count all results');
        assert.strictEqual(stats.hasContent, 1, 'Should count results with content');
        assert.strictEqual(stats.emptyContent, 1, 'Should count results without content');
        assert.ok(stats.xmlSize > 0, 'Should calculate XML size');
        assert.ok(stats.averageContentLength >= 0, 'Should calculate average content length');
    });

    test('should validate generated XML', () => {
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

        assert.ok(isValid, 'Generated XML should be valid and well-formed');
    });

    test('should handle missing optional properties gracefully', () => {
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

        assert.ok(xml.includes('<file path="src/minimal.ts"'), 'Should include file path');
        assert.ok(xml.includes('language="unknown"'), 'Should handle unknown language');
        assert.ok(xml.includes('type="unknown"'), 'Should handle unknown type');
        assert.ok(xmlFormatterService.validateXml(xml), 'Generated XML should be valid');
    });
});
