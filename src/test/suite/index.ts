import * as path from 'path';
import { glob } from 'glob';

/**
 * Test Runner Entry Point
 *
 * This file serves as the entry point for running the VS Code extension test suite.
 * It discovers all test files, configures the Mocha test runner, and executes
 * the tests with appropriate error handling and reporting.
 *
 * The test runner follows VS Code's testing conventions and integrates with
 * the VS Code testing infrastructure for running tests in the extension development environment.
 */

/**
 * Run the test suite
 *
 * This function discovers all test files in the test directory, sets up the
 * Mocha test runner with TDD UI and colored output, and executes all tests.
 * It returns a Promise that resolves when all tests pass or rejects when
 * any test fails.
 *
 * @returns {Promise<void>} A Promise that resolves when tests complete successfully
 * @throws {Error} When test discovery fails or any test fails
 */
export function run(): Promise<void> {
    // Create and configure the Mocha test runner
    // Using TDD (Test Driven Development) UI for test structure
    // Enable colored output for better readability in test results
    const Mocha = require('mocha');
    const mocha = new Mocha({
        ui: 'tdd',        // Use TDD interface (suite(), test(), etc.)
        color: true       // Enable colored output for better readability
    });

    // Resolve the absolute path to the test root directory
    // This is the directory where test files are located
    const testsRoot = path.resolve(__dirname, '..');

    // Return a Promise to handle asynchronous test execution
    return new Promise((c, e) => {
        // Discover all test files using glob pattern matching
        // Look for files ending with .test.js in the test directory and subdirectories
        glob('**/**.test.js', { cwd: testsRoot }, (err: Error | null, files: string[]) => {
            // Handle errors during test file discovery
            if (err) {
                return e(err);
            }

            // Add each discovered test file to the Mocha test suite
            // This ensures all tests are loaded and executed
            files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // Run the Mocha test suite with the loaded test files
                // The callback receives the number of failed tests
                mocha.run((failures: number) => {
                    // If any tests failed, reject the Promise with an error
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        // If all tests passed, resolve the Promise
                        c();
                    }
                });
            } catch (err) {
                // Handle any errors that occur during test execution
                console.error(err);
                e(err);
            }
        });
    });
}
