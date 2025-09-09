# BigContext Constitution
<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### I. Modularity and Reusability
<!-- Example: I. Library-First -->
Every component and feature should be designed with modularity and reusability in mind. This means creating self-contained units that are independently testable, well-documented, and have a clear, single purpose. Avoid creating components that serve multiple, unrelated functions.
<!-- Example: Every feature starts as a standalone library; Libraries must be self-contained, independently testable, documented; Clear purpose required - no organizational-only libraries -->

### II. Clear Communication Protocols
<!-- Example: II. CLI Interface -->
All inter-component communication should adhere to well-defined and documented protocols. For CLI interactions, this means clear text input/output, with errors directed to stderr.
<!-- Example: Every library exposes functionality via CLI; Text in/out protocol: stdin/args → stdout, errors → stderr; Support JSON + human-readable formats -->

### III. Test-Driven Development (TDD)
<!-- Example: III. Test-First (NON-NEGOTIABLE) -->
Test-Driven Development is a mandatory practice. Tests must be written before any code implementation. The workflow involves: writing a test, ensuring it fails, implementing the code to make the test pass, and then refactoring.
<!-- Example: TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced -->

### IV. Comprehensive Testing Strategy
<!-- Example: IV. Integration Testing -->
Beyond unit tests, a comprehensive testing strategy is required, including integration tests for new component contracts, changes to existing contracts, inter-service communication, and shared schemas. **Vitest is the chosen testing framework for all tests.** Every single component, function, and feature must be thoroughly tested to ensure complete code coverage and reliability.
<!-- Example: Focus areas requiring integration tests: New library contract tests, Contract changes, Inter-service communication, Shared schemas -->

### V. Observability and Maintainability
<!-- Example: V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity -->
All components must be designed with observability in mind, including structured logging, metrics, and tracing where appropriate. Code should be clean, well-commented (where necessary), and follow established coding standards to ensure long-term maintainability.
<!-- Example: Text I/O ensures debuggability; Structured logging required; Or: MAJOR.MINOR.BUILD format; Or: Start simple, YAGNI principles -->

## Project Structure and Technologies

This project is structured as a monorepo, encompassing various components for a comprehensive development environment. Key directories and their purposes include:

-   `src/`: Contains the core TypeScript source code for the application's backend logic and main extension.
-   `webview-react/`: Houses the frontend components developed using React, specifically for the webview interface.
-   `webview-simple/`: Contains simpler webview implementations, possibly for basic UI elements or testing.
-   `scripts/`: Stores utility scripts for various development tasks, including testing, setup, and release processes.
-   `docs/`: Contains comprehensive documentation, including user guides, implementation details, and feature descriptions.
-   `memory/`: Stores important project-related documents, such as this constitution and checklists.
-   `qdrant_storage/`: Used for Qdrant vector database storage, indicating the use of Qdrant for vector search or similar functionalities.

The primary technologies and frameworks used in this project are:

-   **TypeScript**: For robust and scalable application development.
-   **React**: For building interactive and dynamic user interfaces within the webview.
-   **Node.js**: As the JavaScript runtime environment for backend processes and development tooling.
-   **Qdrant**: A vector similarity search engine, likely used for efficient data retrieval or AI-related features.

-   **CLI Tools**: `gh cli` (GitHub CLI) and `fly.io cli` are available for deployment needs.
-   **Node.js Version Management**: `nvm` (Node Version Manager) is installed for managing Node.js versions. If there are Node.js version issues, `nvmrc` setup can be used.

## Development Workflow

The development workflow adheres to the following practices:

-   **Test-Driven Development (TDD)**: Tests are written before implementation, ensuring functionality and preventing regressions.
-   **Code Reviews**: All code changes undergo thorough peer review to maintain code quality and consistency.
-   **Automated Testing**: Extensive use of unit, integration, and end-to-end tests to ensure the stability and reliability of the application.
-   **Version Control**: Git is used for version control, with a clear branching strategy for features, bug fixes, and releases.

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

This Constitution supersedes all other project practices and guidelines. Any proposed amendments to this document must be thoroughly documented, approved by the core team, and include a clear migration plan. All pull requests and code reviews must verify compliance with the principles outlined herein. Complexity in design or implementation must always be justified.
<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use [GUIDANCE_FILE] for runtime development guidance -->

**Version**: 1.0.0 | **Ratified**: 2025-09-09 | **Last Amended**: 2025-09-09
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->