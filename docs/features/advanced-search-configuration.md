# Advanced Search Configuration

## Overview

The Advanced Search Configuration feature provides power users with fine-grained control over search behavior, query expansion, result limits, and AI model selection. This comprehensive settings interface allows customization of the search engine to match specific needs and preferences.

## Features

### Query Expansion
- **Automatic Enhancement**: Expand search queries with synonyms and related terms
- **Semantic Similarity**: Use AI to generate semantically similar terms
- **Configurable Limits**: Control the number of additional terms generated
- **Toggle Control**: Enable or disable query expansion as needed

### Result Customization
- **Result Limits**: Set maximum number of results (1-100)
- **Similarity Threshold**: Control minimum similarity score for results
- **Content Filtering**: Include or exclude comments and test files
- **Quality Control**: Fine-tune result relevance and quality

### AI Model Selection
- **Embedding Models**: Choose from multiple embedding model options
- **Language Models**: Select LLM for query expansion and re-ranking
- **Provider Support**: Support for OpenAI, Ollama, and other providers
- **Performance Optimization**: Balance quality and speed based on model choice

### Persistent Configuration
- **Workspace Settings**: Configuration saved to VS Code workspace
- **Profile Support**: Different settings for different projects
- **Import/Export**: Share configurations across environments
- **Reset Options**: Restore default settings when needed

## User Interface

### Settings Organization
The settings are organized into logical sections:

1. **Query Expansion**: Controls for automatic query enhancement
2. **Result Limits**: Configuration for search result parameters
3. **AI Model Selection**: Choose embedding and language models
4. **Search Behavior**: Fine-tune search behavior and filtering

### Interactive Controls
- **Toggle Switches**: Enable/disable features with clear visual feedback
- **Number Inputs**: Precise control over numeric parameters
- **Dropdown Menus**: Select from available options with descriptions
- **Real-time Validation**: Immediate feedback on configuration changes

## Configuration Options

### Query Expansion Settings

#### Enable Query Expansion
- **Purpose**: Automatically expand search queries with related terms
- **Default**: Disabled
- **Impact**: Improves recall but may reduce precision

#### Maximum Expanded Terms
- **Range**: 1-10 additional terms
- **Default**: 3 terms
- **Purpose**: Control the breadth of query expansion
- **Recommendation**: Start with 3, increase for broader searches

#### Use Semantic Similarity
- **Purpose**: Generate semantically similar terms instead of just synonyms
- **Default**: Enabled (when query expansion is enabled)
- **Requires**: Language model for semantic understanding
- **Impact**: More intelligent term expansion

### Result Limit Settings

#### Maximum Search Results
- **Range**: 1-100 results
- **Default**: 20 results
- **Purpose**: Control the number of results returned
- **Performance**: Higher limits may impact search speed

#### Minimum Similarity Threshold
- **Range**: 0.0-1.0 (similarity score)
- **Default**: 0.5
- **Purpose**: Filter out low-relevance results
- **Recommendation**: 0.3-0.7 for most use cases

### AI Model Configuration

#### Embedding Model
Available options:
- **OpenAI Ada-002**: High-quality embeddings, requires API key
- **Nomic Embed**: Open source embeddings, local processing
- **Custom Models**: Support for additional embedding providers

#### Language Model (LLM)
Available options:
- **GPT-3.5 Turbo**: Fast and efficient for query expansion
- **GPT-4**: Most capable but slower and more expensive
- **Local Models**: Ollama and other local LLM options

### Search Behavior Settings

#### Include Comments
- **Purpose**: Include code comments in search results
- **Default**: Enabled
- **Use Case**: Disable for code-only searches

#### Include Test Files
- **Purpose**: Include test files in search results
- **Default**: Disabled
- **Use Case**: Enable when searching for test examples

## Configuration Management

### Saving Settings
Settings are automatically saved to VS Code workspace configuration:

```json
{
  "code-context-engine.queryExpansion.enabled": true,
  "code-context-engine.queryExpansion.maxExpandedTerms": 3,
  "code-context-engine.queryExpansion.useSemanticSimilarity": true,
  "code-context-engine.search.maxResults": 20,
  "code-context-engine.search.minSimilarity": 0.5,
  "code-context-engine.search.includeComments": true,
  "code-context-engine.search.includeTests": false,
  "code-context-engine.openaiModel": "text-embedding-ada-002",
  "code-context-engine.queryExpansion.model": "gpt-3.5-turbo"
}
```

### Configuration Scope
- **Workspace**: Settings apply to the current workspace
- **User**: Global settings for all workspaces (when configured)
- **Folder**: Folder-specific settings for multi-root workspaces

### Reset and Defaults
- **Reset Button**: Restore all settings to defaults
- **Individual Reset**: Reset specific sections
- **Default Values**: Well-tested defaults for most use cases

## API Integration

### Configuration Messages
The settings interface communicates with the extension through:

#### Get Configuration
```typescript
postMessage('getConfiguration');

// Response
{
  command: 'configurationResponse',
  success: true,
  config: {
    advancedSearch: {
      queryExpansion: {
        enabled: boolean,
        maxExpandedTerms: number,
        useSemanticSimilarity: boolean
      },
      resultLimit: number,
      aiModel: {
        embedding: string,
        llm: string
      },
      searchBehavior: {
        minSimilarity: number,
        includeComments: boolean,
        includeTests: boolean
      }
    }
  }
}
```

#### Set Configuration
```typescript
postMessage('setConfiguration', {
  advancedSearch: {
    queryExpansion: { enabled: true, maxExpandedTerms: 5 },
    resultLimit: 30,
    // ... other settings
  }
});

// Response
{
  command: 'setConfigurationResponse',
  success: boolean,
  message?: string,
  error?: string
}
```

### Backend Integration
Settings are integrated with:

#### SearchManager
- **Query Expansion**: Uses LLM to expand queries when enabled
- **Result Filtering**: Applies similarity threshold and result limits
- **Content Filtering**: Respects comment and test file preferences

#### ConfigService
- **Configuration Loading**: Reads settings from VS Code configuration
- **Change Detection**: Monitors for configuration changes
- **Validation**: Ensures configuration values are valid

## Usage Guide

### Accessing Settings
1. Open the extension webview
2. Navigate to the "Settings" view
3. Configure options as needed
4. Click "Save Settings" to apply changes

### Recommended Configurations

#### For Broad Searches
```json
{
  "queryExpansion.enabled": true,
  "queryExpansion.maxExpandedTerms": 5,
  "search.maxResults": 50,
  "search.minSimilarity": 0.3
}
```

#### For Precise Searches
```json
{
  "queryExpansion.enabled": false,
  "search.maxResults": 10,
  "search.minSimilarity": 0.7
}
```

#### For Code-Only Searches
```json
{
  "search.includeComments": false,
  "search.includeTests": false,
  "search.minSimilarity": 0.6
}
```

### Performance Tuning

#### For Speed
- Disable query expansion
- Use lower result limits (10-20)
- Use faster embedding models
- Higher similarity thresholds

#### For Comprehensiveness
- Enable query expansion with semantic similarity
- Use higher result limits (50-100)
- Use high-quality embedding models
- Lower similarity thresholds

## Best Practices

### Query Expansion
- **Start Conservative**: Begin with 3 expanded terms
- **Monitor Results**: Check if expansion improves or hurts relevance
- **Context Matters**: Enable for exploratory searches, disable for specific lookups

### Result Limits
- **Balance Performance**: Higher limits slow down searches
- **User Experience**: Too many results can overwhelm users
- **Pagination**: Consider implementing pagination for large result sets

### Model Selection
- **Quality vs Speed**: Higher quality models are slower
- **Cost Considerations**: API-based models have usage costs
- **Local vs Remote**: Local models provide privacy but may be less capable

## Troubleshooting

### Common Issues

**Settings not saving:**
- Check VS Code workspace permissions
- Verify extension has configuration access
- Try restarting VS Code

**Query expansion not working:**
- Verify LLM model is configured and accessible
- Check API keys for external models
- Monitor VS Code output panel for errors

**Poor search results:**
- Adjust similarity threshold
- Try different embedding models
- Enable/disable query expansion
- Check content filtering settings

### Performance Issues

**Slow searches:**
- Reduce result limits
- Increase similarity threshold
- Disable query expansion
- Use faster models

**High resource usage:**
- Use local models instead of API calls
- Reduce query expansion terms
- Lower result limits
- Optimize similarity thresholds

## Future Enhancements

### Planned Features
- **Advanced Filters**: File type, date range, author filters
- **Custom Models**: Support for user-provided models
- **Search Profiles**: Predefined configuration sets
- **A/B Testing**: Compare different configurations

### UI Improvements
- **Configuration Wizard**: Guided setup for optimal settings
- **Performance Metrics**: Show impact of configuration changes
- **Preview Mode**: Test settings before applying
- **Import/Export**: Share configurations between workspaces

### Integration Features
- **Context Awareness**: Automatically adjust settings based on search context
- **Learning System**: Adapt settings based on user behavior
- **Team Settings**: Share configurations across team members
- **Version Control**: Track configuration changes over time
