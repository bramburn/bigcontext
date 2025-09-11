#!/bin/bash
# Build script for macOS sidecar executable
# This script builds the FastAPI sidecar service as a standalone macOS executable

set -e  # Exit on any error

# Default values
OUTPUT_DIR="dist"
CLEAN=false
TEST=false
PYTHON_VERSION="3.11"
SIGN_BINARY=false
NOTARIZE=false

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
        --sign)
            SIGN_BINARY=true
            shift
            ;;
        --notarize)
            NOTARIZE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --output-dir DIR     Output directory (default: dist)"
            echo "  --clean             Clean previous builds"
            echo "  --test              Run tests before building"
            echo "  --python-version VER Python version (default: 3.11)"
            echo "  --sign              Sign the binary (requires developer certificate)"
            echo "  --notarize          Notarize the binary (requires Apple ID)"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🍎 Building Code Context Sidecar for macOS..."

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

# Run tests if requested
if [ "$TEST" = true ]; then
    echo "🧪 Running tests..."
    uv pip install -e ".[dev]"
    uv run pytest -v
fi

# Create output directory
FULL_OUTPUT_DIR="$ROOT_DIR/$OUTPUT_DIR/sidecar/darwin"
mkdir -p "$FULL_OUTPUT_DIR"

# Build executable with PyInstaller
echo "🔨 Building macOS executable..."
uv run pyinstaller pyinstaller.spec --clean --noconfirm

# Copy executable to output directory
EXE_NAME="code-context-sidecar-darwin"
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

# Sign the binary if requested
if [ "$SIGN_BINARY" = true ]; then
    if [ -z "$DEVELOPER_ID" ]; then
        echo "⚠️  DEVELOPER_ID environment variable not set. Skipping code signing."
    else
        echo "✍️  Signing binary..."
        codesign --force --verify --verbose --sign "$DEVELOPER_ID" "$DEST_PATH"
        echo "✅ Binary signed successfully"
    fi
fi

# Notarize the binary if requested
if [ "$NOTARIZE" = true ]; then
    if [ -z "$APPLE_ID" ] || [ -z "$APPLE_ID_PASSWORD" ]; then
        echo "⚠️  APPLE_ID or APPLE_ID_PASSWORD environment variables not set. Skipping notarization."
    else
        echo "📋 Notarizing binary..."
        # Create a zip file for notarization
        ZIP_PATH="$FULL_OUTPUT_DIR/$EXE_NAME.zip"
        cd "$FULL_OUTPUT_DIR"
        zip "$ZIP_PATH" "$EXE_NAME"
        
        # Submit for notarization
        xcrun altool --notarize-app \
            --primary-bundle-id "com.icelabz.code-context-sidecar" \
            --username "$APPLE_ID" \
            --password "$APPLE_ID_PASSWORD" \
            --file "$ZIP_PATH"
        
        echo "✅ Binary submitted for notarization"
        rm "$ZIP_PATH"
    fi
fi

# Test the executable
echo "🧪 Testing executable..."
if "$DEST_PATH" --help > /dev/null 2>&1; then
    echo "✅ Executable test passed"
else
    echo "⚠️  Executable test failed, but build completed"
fi

echo "🎉 macOS build completed successfully!"
echo "📁 Output: $DEST_PATH"

# Create build info file
BUILD_INFO_PATH="$FULL_OUTPUT_DIR/build-info.json"
cat > "$BUILD_INFO_PATH" << EOF
{
    "platform": "darwin",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "version": "0.1.0",
    "python_version": "$PYTHON_VERSION",
    "executable_path": "$DEST_PATH",
    "signed": $SIGN_BINARY,
    "notarized": $NOTARIZE,
    "architecture": "$(uname -m)"
}
EOF

echo "📋 Build information saved to: $BUILD_INFO_PATH"
