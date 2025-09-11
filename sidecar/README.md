# Code Context Engine Sidecar Service

A FastAPI-based sidecar service for the Code Context Engine VSCode extension, providing advanced functionality through REST API endpoints.

## Features

- **Dynamic Port Discovery**: Automatically finds available ports to avoid conflicts
- **Health Monitoring**: Comprehensive health check endpoints
- **Service Registration**: Registers with the VSCode extension for seamless integration
- **Cross-Platform**: Supports Windows, macOS, and Linux
- **Standalone Packaging**: Can be packaged as standalone executables

## Development Setup

This project uses [uv](https://github.com/astral-sh/uv) for fast Python package management.

### Prerequisites

- Python 3.8+
- uv package manager

### Installation

```bash
# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .

# Install development dependencies
uv pip install -e ".[dev]"
```

### Running the Service

```bash
# Development mode with auto-reload
uv run uvicorn main:app --reload --host 127.0.0.1

# Production mode
uv run python main.py
```

### Testing

```bash
# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=. --cov-report=html
```

### Code Quality

```bash
# Format code
uv run black .
uv run isort .

# Lint code
uv run flake8 .
uv run mypy .
```

## Building Standalone Executables

```bash
# Install build dependencies
uv pip install -e ".[build]"

# Build executable
uv run pyinstaller --onefile --name code-context-sidecar main.py
```

## API Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health information
- `GET /info` - Service information and capabilities
- `POST /shutdown` - Graceful shutdown endpoint

## Configuration

The service automatically discovers available ports and configures itself for optimal performance. Configuration can be customized through environment variables or command-line arguments.
