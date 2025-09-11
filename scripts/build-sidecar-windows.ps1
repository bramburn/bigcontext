# Build script for Windows sidecar executable
# This script builds the FastAPI sidecar service as a standalone Windows executable

param(
    [string]$OutputDir = "dist",
    [switch]$Clean = $false,
    [switch]$Test = $false,
    [string]$PythonVersion = "3.11"
)

Write-Host "Building Code Context Sidecar for Windows..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Stop"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$SidecarDir = Join-Path $RootDir "sidecar"

# Change to sidecar directory
Push-Location $SidecarDir

try {
    # Clean previous builds if requested
    if ($Clean) {
        Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
        if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
        if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
        if (Test-Path "*.spec") { Remove-Item -Force "*.spec" }
    }

    # Check if uv is installed
    try {
        $uvVersion = uv --version
        Write-Host "Using uv: $uvVersion" -ForegroundColor Cyan
    }
    catch {
        Write-Error "uv is not installed. Please install uv first: https://github.com/astral-sh/uv"
        exit 1
    }

    # Create virtual environment if it doesn't exist
    if (-not (Test-Path ".venv")) {
        Write-Host "Creating virtual environment..." -ForegroundColor Yellow
        uv venv --python $PythonVersion
    }

    # Activate virtual environment
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & ".venv\Scripts\Activate.ps1"

    # Install dependencies
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    uv pip install -e ".[build]"

    # Run tests if requested
    if ($Test) {
        Write-Host "Running tests..." -ForegroundColor Yellow
        uv pip install -e ".[dev]"
        uv run pytest -v
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Tests failed. Aborting build."
            exit 1
        }
    }

    # Create output directory
    $FullOutputDir = Join-Path $RootDir $OutputDir "sidecar" "win32"
    if (-not (Test-Path $FullOutputDir)) {
        New-Item -ItemType Directory -Path $FullOutputDir -Force | Out-Null
    }

    # Build executable with PyInstaller
    Write-Host "Building Windows executable..." -ForegroundColor Yellow
    uv run pyinstaller pyinstaller.spec --clean --noconfirm

    # Copy executable to output directory
    $ExeName = "code-context-sidecar-win32.exe"
    $SourcePath = Join-Path "dist" $ExeName
    $DestPath = Join-Path $FullOutputDir $ExeName

    if (Test-Path $SourcePath) {
        Copy-Item $SourcePath $DestPath -Force
        Write-Host "Executable built successfully: $DestPath" -ForegroundColor Green
        
        # Get file size
        $FileSize = (Get-Item $DestPath).Length / 1MB
        Write-Host "Executable size: $([math]::Round($FileSize, 2)) MB" -ForegroundColor Cyan
    }
    else {
        Write-Error "Build failed: Executable not found at $SourcePath"
        exit 1
    }

    # Test the executable
    Write-Host "Testing executable..." -ForegroundColor Yellow
    $TestOutput = & $DestPath --help
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Executable test passed" -ForegroundColor Green
    }
    else {
        Write-Warning "Executable test failed, but build completed"
    }

    Write-Host "Windows build completed successfully!" -ForegroundColor Green
    Write-Host "Output: $DestPath" -ForegroundColor Cyan

}
catch {
    Write-Error "Build failed: $_"
    exit 1
}
finally {
    # Return to original directory
    Pop-Location
}

# Create build info file
$BuildInfo = @{
    platform = "win32"
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    version = "0.1.0"
    python_version = $PythonVersion
    executable_path = $DestPath
} | ConvertTo-Json

$BuildInfoPath = Join-Path $FullOutputDir "build-info.json"
$BuildInfo | Out-File -FilePath $BuildInfoPath -Encoding UTF8

Write-Host "Build information saved to: $BuildInfoPath" -ForegroundColor Cyan
