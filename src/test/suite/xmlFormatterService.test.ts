import * as assert from 'assert';
import { XmlFormatterService, XmlFormattingOptions } from '../../formatting/XmlFormatterService';
import { SearchResult } from '../../db/qdrantService';

/**
 * Test suite for XmlFormatterService
 *
 * These tests verify that the XmlFormatterService correctly formats search results
 * into XML format with proper structure, attributes, and content handling.
 * The service is responsible for generating well-formed XML that represents
 * search results in a structured format.
 */
describe('XmlFormatterService Tests', () => {
    let xmlFormatterService: XmlFormatterService;
    let mockSearchResults: SearchResult[];

    beforeEach(() => {
        // Create a fresh XmlFormatterService instance for each test
        xmlFormatterService = new XmlFormatterService();

        // Create mock search results for testing
        mockSearchResults = [
            {
                id: 'result1',
                score: 0.95,
                payload: {
                    filePath: '/path/to/file1.ts',
                    content: 'export function hello() { return "world"; }',
                    startLine: 1,
                    endLine: 3,
                    type: 'function',
                    name: 'hello',
                    language: 'typescript',
                    signature: 'hello(): string'
                }
            },
            {
                id: 'result2',
                score: 0.85,
                payload: {
                    filePath: '/path/to/file2.ts',
                    content: 'export class User { private name: string; }',
                    startLine: 10,
                    endLine: 12,
                    type: 'class',
                    name: 'User',
                    language: 'typescript'
                }
            },
            {
                id: 'result3',
                score: 0.75,
                payload: {
                    filePath: '/path/to/file3.ts',
                    content: '',  // Empty content for testing
                    startLine: 20,
                    endLine: 20,
                    type: 'variable',
                    language: 'typescript'
                }
            }
        ];
    });

    test('should format results with default options', () => {
        // Test that the service correctly formats results with default options
        const xml = xmlFormatterService.formatResults(mockSearchResults);
        
        // Verify XML structure and content
        assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Should include XML declaration');
        assert.ok(xml.includes('<files count="3" generated="'), 'Should include root element with count attribute');
        assert.ok(xml.includes('path="/path/to/file1.ts"'), 'Should include file path attribute');
        assert.ok(xml.includes('score="0.9500"'), 'Should include score attribute with 4 decimal places');
        assert.ok(xml.includes('language="typescript"'), 'Should include language attribute');
        assert.ok(xml.includes('startLine="1"'), 'Should include startLine attribute');
        assert.ok(xml.includes('endLine="3"'), 'Should include endLine attribute');
        assert.ok(xml.includes('type="function"'), 'Should include type attribute');
        
        // Verify content is included
        assert.ok(xml.includes('export function hello() { return "world"; }'), 'Should include file content');
    });

    test('should format results with custom options', () => {
        // Test that the service respects custom formatting options
        const options: XmlFormattingOptions = {
            prettyPrint: false,
            includeDeclaration: false,
            rootElementName: 'searchResults',
            includeMetadata: false
        };
        
        const xml = xmlFormatterService.formatResults(mockSearchResults, options);

        // Verify custom options are applied
        assert.ok(!xml.includes('<?xml'), 'Should not include XML declaration');
        assert.ok(xml.includes('<searchResults>'), 'Should use custom root element name');
        assert.ok(!xml.includes('count='), 'Should not include count attribute');
        assert.ok(!xml.includes('generated='), 'Should not include generated attribute');
        assert.ok(!xml.includes('score='), 'Should not include score attribute');
        
        // Verify file paths are still included (required attribute)
        assert.ok(xml.includes('path="/path/to/file1.ts"'), 'Should still include file path attribute');
        
        // Verify content is still included
        assert.ok(xml.includes('export function hello() { return "world"; }'), 'Should include file content');
    });

    test('should handle special characters in content', () => {
        // Test that the service properly handles special XML characters
        const resultsWithSpecialChars: SearchResult[] = [
            {
                id: 'special',
                score: 0.9,
                payload: {
                    filePath: '/path/to/special.ts',
                    content: 'if (x < 10 && y > 5) { return "Quote\'s & ampersands"; }',
                    startLine: 1,
                    endLine: 1,
                    type: 'code',
                    language: 'typescript'
                }
            }
        ];
        
        const xml = xmlFormatterService.formatResults(resultsWithSpecialChars);
        
        // Verify special characters are properly handled (should be in CDATA)
        assert.ok(xml.includes('if (x < 10 && y > 5)'), 'Should preserve < character');
        assert.ok(xml.includes('Quote\'s & ampersands'), 'Should preserve & and \' characters');
    });

    test('should format a single result', () => {
        // Test the convenience method for formatting a single result
        const singleResult = mockSearchResults[0];
        const xml = xmlFormatterService.formatSingleResult(singleResult);
        
        // Verify it's properly formatted
        assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Should include XML declaration');
        assert.ok(xml.includes('<files count="1" generated="'), 'Should include root element with count=1');
        assert.ok(xml.includes('path="/path/to/file1.ts"'), 'Should include file path attribute');
        assert.ok(xml.includes('export function hello() { return "world"; }'), 'Should include file content');
    });

    test('should format minimal XML', () => {
        // Test the minimal formatting option
        const xml = xmlFormatterService.formatMinimal(mockSearchResults);
        
        // Verify minimal format
        assert.ok(!xml.includes('<?xml'), 'Should not include XML declaration');
        assert.ok(!xml.includes('count='), 'Should not include count attribute');
        assert.ok(!xml.includes('score='), 'Should not include score attribute');
        assert.ok(xml.includes('path="/path/to/file1.ts"'), 'Should include file path attribute');
        assert.ok(xml.includes('export function hello() { return "world"; }'), 'Should include file content');
    });

    test('should validate well-formed XML', () => {
        // Test the XML validation functionality
        const xml = xmlFormatterService.formatResults(mockSearchResults);
        const isValid = xmlFormatterService.validateXml(xml);
        
        assert.strictEqual(isValid, true, 'Generated XML should be valid');
    });

    test('should detect invalid XML', () => {
        // Test that the validator detects invalid XML
        const invalidXml = '<unclosed>This is not valid XML';
        const isValid = xmlFormatterService.validateXml(invalidXml);
        
        assert.strictEqual(isValid, false, 'Should detect invalid XML');
    });

    test('should handle empty results array', () => {
        // Test handling of empty results array
        const xml = xmlFormatterService.formatResults([]);

        assert.ok(xml.includes('count="0"'), 'Should show count of 0');
        assert.ok(!xml.includes('<file '), 'Should not include any file elements');
    });

    test('should handle results with empty content', () => {
        // Test handling of results with empty content
        const emptyContentResult = mockSearchResults[2]; // The third mock result has empty content
        const xml = xmlFormatterService.formatSingleResult(emptyContentResult);
        
        assert.ok(xml.includes('path="/path/to/file3.ts"'), 'Should include file path attribute');
        assert.ok(xml.includes('<file'), 'Should include file element');
        // Empty content should result in self-closing tag or empty element
    });

    test('should provide formatting statistics', () => {
        // Test the statistics generation functionality
        const xml = xmlFormatterService.formatResults(mockSearchResults);
        const stats = xmlFormatterService.getFormattingStats(mockSearchResults, xml);
        
        assert.strictEqual(stats.resultCount, 3, 'Should count 3 results');
        assert.ok(stats.xmlSize > 0, 'XML size should be positive');
        assert.ok(stats.averageContentLength > 0, 'Average content length should be positive');
        assert.strictEqual(stats.hasContent, 2, 'Should count 2 results with content');
        assert.strictEqual(stats.emptyContent, 1, 'Should count 1 result with empty content');
    });
});