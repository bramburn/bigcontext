# Research Findings: Vitest Test Refactoring

This document outlines the research areas identified for resolving Vitest test failures and the proposed solutions.

## Research Tasks:

1.  **Research Vitest `environment` configuration for React components (e.g., `jsdom` or `happy-dom`).**
    -   **Decision**: Configure Vitest to use `jsdom` environment for `webview-react/` tests.
    -   **Rationale**: `jsdom` provides a comprehensive browser-like environment necessary for testing React components that interact with the DOM. While `happy-dom` is faster, `jsdom` offers a more accurate emulation, which is preferable for ensuring correctness in a UI context.
    -   **Alternatives considered**: `happy-dom` (faster, but less comprehensive).

2.  **Research Vitest global setup/teardown best practices and migration from `setup`/`suiteSetup`.**
    -   **Decision**: Migrate `setup` and `suiteSetup` calls in `src/test/suite/*.test.ts` files to Vitest's native `beforeEach`, `beforeAll`, `afterEach`, and `afterAll` hooks.
    -   **Rationale**: `setup` and `suiteSetup` are not standard Vitest globals and likely originate from other testing frameworks or older patterns. Using native Vitest hooks ensures compatibility, proper test lifecycle management, and better readability.
    -   **Alternatives considered**: Implementing a `globalSetup` file if there were truly global, one-time setups for the entire test run, but the current errors suggest per-suite/per-test file setup issues.

3.  **Research advanced mocking techniques in Vitest for TypeScript classes and services.**
    -   **Decision**: Apply a combination of `vi.mock` (for module-level mocking), manual mocking (for injected dependencies), and `vi.spyOn` (for observing real implementations) as appropriate for each failing test.
    -   **Rationale**: The errors indicate issues with how dependencies are being mocked or spied upon. Using `vi.mocked<T>(obj)` for type safety and `vi.clearAllMocks()` in `beforeEach` will ensure consistent and correct mock behavior. Correctly mocking asynchronous operations with `mockResolvedValue` will also be crucial.
    -   **Alternatives considered**: Over-mocking (leads to brittle tests) or under-mocking (leads to integration issues in unit tests).

4.  **Research common Vitest assertion pitfalls and debugging strategies.**
    -   **Decision**: Review and refactor assertions to use more specific Vitest matchers (e.g., `toBeVisible`, `toThrowError` with a function wrapper) and leverage IDE debugging tools.
    -   **Rationale**: Generic assertions can hide underlying issues. Specific matchers provide clearer intent and better error messages. Effective debugging tools are essential for diagnosing complex failures.
    -   **Alternatives considered**: Relying solely on `console.log` (less efficient for complex issues) or generic assertions (less precise).

5.  **Research how to correctly test VS Code extension lifecycle and file paths in Vitest.**
    -   **Decision**: Modify `src/test/suite/extensionLifecycle.test.ts` to reference `src/extension.ts` directly if the test's purpose is to verify source code structure, or mock file system interactions if the test is focused on the lifecycle logic independent of actual file content. Ensure the build process is considered if `extension.js` is truly the target.
    -   **Rationale**: The `ENOENT` error indicates an incorrect file path or an attempt to read a non-existent file. Tests should operate on source files or use mocks to simulate the environment. Ensuring the compilation step runs before tests that depend on compiled output is also important.
    -   **Alternatives considered**: Ignoring the test (not ideal for code quality) or complex test environment setups that might be overkill for the test's intent.