# Implementation Guide: Telemetry & Accessibility

## Integration Steps

### 1. Initialize Telemetry Service in Extension

Add to your main extension.ts file:

```typescript
import { TelemetryService } from './telemetry/telemetryService';
import { ConfigService } from './configService';

// In your extension activation
const configService = new ConfigService();
const telemetryService = new TelemetryService(configService, context);

// Pass telemetry service to your managers
searchManager = new SearchManager(
    contextService,
    configService,
    loggingService,
    notificationService,
    queryExpansionService,
    llmReRankingService,
    telemetryService // Add this parameter
);

indexingService = new IndexingService(
    workspaceRoot,
    fileWalker,
    astParser,
    chunker,
    qdrantService,
    embeddingProvider,
    lspService,
    stateManager,
    workspaceManager,
    configService,
    loggingService,
    telemetryService // Add this parameter
);

// Update message router
messageRouter.setAdvancedManagers(
    searchManager,
    legacyConfigurationManager,
    performanceManager,
    xmlFormatterService,
    telemetryService // Add this parameter
);
```

### 2. Add Settings Command

Add to package.json commands:

```json
{
  "command": "code-context-engine.openSettings",
  "title": "Open Settings",
  "category": "Code Context"
}
```

Register in extension.ts:

```typescript
context.subscriptions.push(
    vscode.commands.registerCommand('code-context-engine.openSettings', () => {
        webviewManager.showSettingsPanel();
    })
);
```

### 3. Testing Checklist

#### Telemetry Testing:
- [ ] Verify telemetry toggle in settings works
- [ ] Test that disabling telemetry stops all events
- [ ] Confirm no PII is collected in telemetry data
- [ ] Test search and indexing telemetry events
- [ ] Verify settings persistence across sessions

#### Accessibility Testing:
- [ ] Tab through all UI elements using keyboard only
- [ ] Test with screen reader (NVDA, VoiceOver, or JAWS)
- [ ] Verify all buttons respond to Enter and Space keys
- [ ] Test in high contrast mode
- [ ] Confirm ARIA labels are properly announced
- [ ] Test live regions announce status changes

### 4. Manual Testing Steps

#### Telemetry:
1. Open settings and toggle telemetry off
2. Perform search - verify no telemetry events sent
3. Toggle telemetry on
4. Perform search - verify events are tracked
5. Start indexing - verify indexing events are tracked

#### Accessibility:
1. Use only Tab/Shift+Tab to navigate entire interface
2. Use Enter/Space to activate buttons and controls
3. Enable Windows High Contrast or macOS Increase Contrast
4. Test with screen reader enabled

### 5. Configuration Updates

Ensure your VS Code settings schema includes:

```json
"code-context-engine.enableTelemetry": {
  "type": "boolean",
  "default": true,
  "description": "Enable anonymous usage telemetry to help improve the extension. No code content or personal information is collected."
}
```

### 6. Privacy Documentation

Update your README.md to include:

```markdown
## Privacy & Telemetry

This extension collects anonymous usage data to help improve the product. The telemetry:

- Is completely anonymous (no personal information or code content)
- Can be disabled in the extension settings
- Only tracks feature usage and performance metrics
- Respects your privacy preferences

To disable telemetry:
1. Open the extension settings
2. Navigate to Privacy & Telemetry section
3. Toggle off "Enable Anonymous Usage Telemetry"
```

## Troubleshooting

### Common Issues:

1. **Telemetry not working**: Check that TelemetryService is properly initialized and passed to managers
2. **Settings not saving**: Verify message router handlers are registered
3. **Accessibility issues**: Ensure all interactive elements have proper ARIA labels
4. **Keyboard navigation**: Check that tabIndex and onKeyDown handlers are properly set

### Debug Commands:

```typescript
// Check telemetry status
console.log('Telemetry enabled:', configService.getTelemetryEnabled());

// Test telemetry event
telemetryService?.trackEvent('test_event', { source: 'debug' });
```
