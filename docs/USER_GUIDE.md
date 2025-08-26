# Code Context Engine - User Guide

Welcome to the Code Context Engine! This guide will help you get started with using this AI-powered code context and search extension for VS Code.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Features Overview](#features-overview)
4. [Setup and Configuration](#setup-and-configuration)
5. [Using the Search Interface](#using-the-search-interface)
6. [Advanced Features](#advanced-features)
7. [Keyboard Shortcuts](#keyboard-shortcuts)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "Code Context Engine"
4. Click "Install"

### Manual Installation
1. Download the `.vsix` file from the releases page
2. Open VS Code
3. Go to Extensions view
4. Click the "..." menu and select "Install from VSIX..."
5. Select the downloaded `.vsix` file

## Quick Start

### 1. Open the Main Panel
- **Command Palette**: `Ctrl+Shift+P` → "Code Context: Open Main Panel"
- **Keyboard Shortcut**: `Ctrl+Alt+C` (Windows/Linux) or `Cmd+Alt+C` (macOS)

### 2. Setup Your Project
1. Open the main panel
2. Click "Setup Project" or use the setup wizard
3. Configure your database and embedding provider
4. Start indexing your codebase

### 3. Start Searching
- Use natural language queries like "function that validates email"
- Browse results with file paths, scores, and content previews
- Click on results to open files at specific locations

## Features Overview

### 🔍 Intelligent Code Search
- **Natural Language Queries**: Search using plain English descriptions
- **Semantic Understanding**: AI-powered search that understands code context
- **Multi-language Support**: Works with TypeScript, JavaScript, Python, C#, and more

### 🏗️ Advanced Setup & Configuration
- **Interactive Setup Wizard**: Guided configuration process
- **System Validation**: Automatic validation of your setup
- **Connection Testing**: Test database and embedding provider connections
- **Real-time Diagnostics**: Monitor system health and performance

### 📊 Rich Search Results
- **Relevance Scoring**: Results ranked by semantic similarity
- **File Previews**: See code snippets directly in search results
- **Line Number Navigation**: Jump directly to specific lines in files
- **XML Export**: Export search results in structured XML format

### ⚙️ Flexible Configuration
- **Multiple Database Options**: Support for Qdrant and other vector databases
- **Embedding Providers**: Choose from various AI embedding services
- **Customizable Indexing**: Control what files and directories to index
- **Performance Tuning**: Adjust chunk sizes and processing parameters

## Setup and Configuration

### Initial Setup

1. **Open Setup Wizard**
   - Use `Ctrl+Alt+C` to open the main panel
   - Click "Setup Project" button
   - Follow the guided setup process

2. **Configure Database**
   - Choose your vector database (Qdrant recommended)
   - Provide connection details (URL, API key if required)
   - Test the connection to ensure it's working

3. **Configure Embedding Provider**
   - Select an embedding service (OpenAI, Hugging Face, etc.)
   - Enter API credentials
   - Test the provider connection

4. **Start Indexing**
   - Review the files that will be indexed
   - Click "Start Indexing" or use `Ctrl+Alt+I`
   - Monitor progress in the indexing view

### Advanced Configuration

Access advanced settings through:
- **Command Palette**: "Code Context: Open Settings"
- **Settings UI**: `Ctrl+,` → Search for "Code Context Engine"

Key settings include:
- **Chunk Size**: Control how code is split for indexing
- **File Filters**: Specify which files to include/exclude
- **Performance**: Adjust processing limits and timeouts
- **UI Preferences**: Customize the interface appearance

## Using the Search Interface

### Basic Search

1. **Open Search Panel**
   - Main panel → "Search" tab
   - Or use the query input in the main interface

2. **Enter Your Query**
   - Use natural language: "function that handles user authentication"
   - Describe functionality: "code that processes file uploads"
   - Ask questions: "how to connect to the database"

3. **Review Results**
   - Results are ranked by relevance score
   - Click file names to open files
   - Use line numbers to jump to specific locations

### Advanced Search Options

- **Max Results**: Control how many results to return (default: 20)
- **Include Content**: Toggle full file content in results
- **XML Format**: Export results as structured XML

### Search Tips

- **Be Specific**: "email validation function" vs "validation"
- **Use Context**: "React component for user profile" vs "user profile"
- **Describe Purpose**: "function that calculates tax" vs "calculate"
- **Include Technology**: "Python function for data processing"

## Advanced Features

### XML Result Export

When "Include Content" is enabled, search results can be exported as XML:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<files count="3" generated="2024-01-15T10:30:00.000Z">
  <file path="src/auth.ts" score="0.9500" language="typescript" startLine="15" endLine="25">
    <![CDATA[
    function validateEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
    ]]>
  </file>
</files>
```

### Diagnostics and Monitoring

Access the diagnostics panel to:
- Monitor system health
- View indexing statistics
- Test connections
- Review error logs
- Check performance metrics

### State Management

The extension maintains state across sessions:
- **Indexing Progress**: Resume interrupted indexing
- **Search History**: Access previous queries
- **Configuration**: Persist settings and connections
- **Error Recovery**: Automatic recovery from failures

## Keyboard Shortcuts

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| Open Main Panel | `Ctrl+Alt+C` | `Cmd+Alt+C` | Opens the main Code Context Engine panel |
| Start Indexing | `Ctrl+Alt+I` | `Cmd+Alt+I` | Starts the indexing process |
| Open Settings | - | - | Use Command Palette: "Code Context: Open Settings" |
| Setup Project | - | - | Use Command Palette: "Code Context: Setup Project" |
| Open Diagnostics | - | - | Use Command Palette: "Code Context: Open Diagnostics" |

### Customizing Shortcuts

1. Open VS Code settings (`Ctrl+,`)
2. Go to "Keyboard Shortcuts"
3. Search for "Code Context"
4. Click the pencil icon to modify shortcuts

## Troubleshooting

### Common Issues

#### Extension Not Loading
- **Check VS Code Version**: Requires VS Code 1.74.0 or higher
- **Restart VS Code**: Sometimes a restart resolves loading issues
- **Check Output Panel**: View "Code Context Engine" output for errors

#### Indexing Fails
- **Check Workspace**: Ensure a folder is open in VS Code
- **Verify Permissions**: Check file system permissions
- **Database Connection**: Test database connectivity in diagnostics
- **Disk Space**: Ensure sufficient disk space for indexing

#### Search Returns No Results
- **Complete Indexing**: Ensure indexing has finished successfully
- **Check Query**: Try simpler or more specific queries
- **Verify Database**: Check that the database contains indexed data
- **Review Filters**: Ensure file filters aren't excluding relevant files

#### Performance Issues
- **Reduce Chunk Size**: Smaller chunks may improve performance
- **Limit File Types**: Index only necessary file types
- **Check Resources**: Monitor CPU and memory usage
- **Database Performance**: Ensure database server has adequate resources

### Getting Help

1. **Check Diagnostics**: Use the diagnostics panel to identify issues
2. **Review Logs**: Check the VS Code output panel for detailed logs
3. **GitHub Issues**: Report bugs or request features on GitHub
4. **Documentation**: Review the complete documentation in the `docs/` folder

### Debug Mode

Enable debug logging:
1. Open VS Code settings
2. Search for "Code Context Engine"
3. Enable "Debug Logging"
4. Restart VS Code
5. Check output panel for detailed logs

## FAQ

### General Questions

**Q: What programming languages are supported?**
A: Currently supports TypeScript, JavaScript, Python, C#, and more languages are being added.

**Q: How much disk space does indexing require?**
A: Typically 10-20% of your codebase size, depending on chunk size and content.

**Q: Can I use this with remote repositories?**
A: Yes, as long as the code is available locally in your VS Code workspace.

### Technical Questions

**Q: Which vector databases are supported?**
A: Currently supports Qdrant with plans to add more vector database options.

**Q: What embedding providers can I use?**
A: Supports OpenAI, Hugging Face, and other compatible embedding services.

**Q: How often should I re-index?**
A: Re-index when you've made significant changes to your codebase or added new files.

### Privacy and Security

**Q: Is my code sent to external services?**
A: Only if you choose an external embedding provider. Local embedding options are available.

**Q: Where is the indexed data stored?**
A: In your configured vector database, which can be local or remote based on your setup.

**Q: Can I use this offline?**
A: Yes, with local database and embedding providers, the extension can work completely offline.

---

For more detailed information, see the [Contributor Guide](CONTRIBUTING.md) and the technical documentation in the `docs/` folder.
