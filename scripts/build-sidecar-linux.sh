#!/bin/bash
# Build script for Linux sidecar executable
# This script builds the FastAPI sidecar service as a standalone Linux executable

set -e  # Exit on any error

# Default values
OUTPUT_DIR="dist"
CLEAN=false
TEST=false
PYTHON_VERSION="3.11"
STATIC_BUILD=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --test)
            TEST=true
            shift
            ;;
        --python-version)
            PYTHON_VERSION="$2"
            shift 2
            ;;
        --static)
            STATIC_BUILD=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --output-dir DIR     Output directory (default: dist)"
            echo "  --clean             Clean previous builds"
            echo "  --test              Run tests before building"
            echo "  --python-version VER Python version (default: 3.11)"
            echo "  --static            Create static build (experimental)"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🐧 Building Code Context Sidecar for Linux..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SIDECAR_DIR="$ROOT_DIR/sidecar"

# Change to sidecar directory
cd "$SIDECAR_DIR"

# Clean previous builds if requested
if [ "$CLEAN" = true ]; then
    echo "🧹 Cleaning previous builds..."
    rm -rf dist build *.spec
fi

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ uv is not installed. Please install uv first:"
    echo "curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

echo "📦 Using uv: $(uv --version)"

# Detect Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    DISTRO="$ID"
    DISTRO_VERSION="$VERSION_ID"
    echo "🔍 Detected Linux distribution: $DISTRO $DISTRO_VERSION"
else
    DISTRO="unknown"
    DISTRO_VERSION="unknown"
    echo "⚠️  Could not detect Linux distribution"
fi

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "🐍 Creating virtual environment..."
    uv venv --python "$PYTHON_VERSION"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
uv pip install -e ".[build]"

# Install additional dependencies for static builds
if [ "$STATIC_BUILD" = true ]; then
    echo "📦 Installing static build dependencies..."
    uv pip install staticx
fi

# Run tests if requested
if [ "$TEST" = true ]; then
    echo "🧪 Running tests..."
    uv pip install -e ".[dev]"
    uv run pytest -v
fi

# Create output directory
ARCHITECTURE=$(uname -m)
FULL_OUTPUT_DIR="$ROOT_DIR/$OUTPUT_DIR/sidecar/linux-$ARCHITECTURE"
mkdir -p "$FULL_OUTPUT_DIR"

# Build executable with PyInstaller
echo "🔨 Building Linux executable..."
uv run pyinstaller pyinstaller.spec --clean --noconfirm

# Copy executable to output directory
EXE_NAME="code-context-sidecar-linux"
SOURCE_PATH="dist/$EXE_NAME"
DEST_PATH="$FULL_OUTPUT_DIR/$EXE_NAME"

if [ -f "$SOURCE_PATH" ]; then
    cp "$SOURCE_PATH" "$DEST_PATH"
    chmod +x "$DEST_PATH"
    echo "✅ Executable built successfully: $DEST_PATH"
    
    # Get file size
    FILE_SIZE=$(du -h "$DEST_PATH" | cut -f1)
    echo "📊 Executable size: $FILE_SIZE"
else
    echo "❌ Build failed: Executable not found at $SOURCE_PATH"
    exit 1
fi

# Create static build if requested
if [ "$STATIC_BUILD" = true ]; then
    echo "🔧 Creating static build..."
    STATIC_DEST_PATH="$FULL_OUTPUT_DIR/$EXE_NAME-static"
    
    if command -v staticx &> /dev/null; then
        staticx "$DEST_PATH" "$STATIC_DEST_PATH"
        echo "✅ Static executable created: $STATIC_DEST_PATH"
        
        # Get static file size
        STATIC_FILE_SIZE=$(du -h "$STATIC_DEST_PATH" | cut -f1)
        echo "📊 Static executable size: $STATIC_FILE_SIZE"
    else
        echo "⚠️  staticx not available, skipping static build"
    fi
fi

# Test the executable
echo "🧪 Testing executable..."
if "$DEST_PATH" --help > /dev/null 2>&1; then
    echo "✅ Executable test passed"
else
    echo "⚠️  Executable test failed, but build completed"
fi

# Check for required libraries
echo "🔍 Checking library dependencies..."
if command -v ldd &> /dev/null; then
    echo "📚 Library dependencies:"
    ldd "$DEST_PATH" | head -10
    
    # Count dependencies
    DEP_COUNT=$(ldd "$DEST_PATH" | wc -l)
    echo "📊 Total library dependencies: $DEP_COUNT"
else
    echo "⚠️  ldd not available, cannot check dependencies"
fi

echo "🎉 Linux build completed successfully!"
echo "📁 Output: $DEST_PATH"

# Create build info file
BUILD_INFO_PATH="$FULL_OUTPUT_DIR/build-info.json"
cat > "$BUILD_INFO_PATH" << EOF
{
    "platform": "linux",
    "architecture": "$ARCHITECTURE",
    "distro": "$DISTRO",
    "distro_version": "$DISTRO_VERSION",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "version": "0.1.0",
    "python_version": "$PYTHON_VERSION",
    "executable_path": "$DEST_PATH",
    "static_build": $STATIC_BUILD,
    "dependency_count": $(ldd "$DEST_PATH" 2>/dev/null | wc -l || echo 0)
}
EOF

echo "📋 Build information saved to: $BUILD_INFO_PATH"
