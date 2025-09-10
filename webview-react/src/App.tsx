/**
 * Main App Component
 *
 * Root component for the RAG for LLM VS Code extension React webview.
 * Handles routing between settings and indexing views, manages global state,
 * and provides communication with the VS Code extension backend.
 */

import React, { useEffect, useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
  tokens,
  Stack,
  Pivot,
  PivotItem,
  Text,
  MessageBar,
  MessageBarType,
} from '@fluentui/react-components';
import { SettingsForm } from './components/SettingsForm';
import { IndexingProgress } from './components/IndexingProgress';
import { ProgressDisplay } from './components/ProgressDisplay';
import { postMessage } from './utils/vscodeApi';

/**
 * VS Code API interface
 */
interface VSCodeAPI {
  postMessage: (message: any) => void;
  setState: (state: any) => void;
  getState: () => any;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VSCodeAPI;
  }
}

/**
 * App state interface
 */
interface AppState {
  currentView: 'settings' | 'indexing';
  isWorkspaceOpen: boolean;
  message: {
    type: MessageBarType;
    text: string;
  } | null;
  theme: 'light' | 'dark';
}

const useStyles = makeStyles({
  app: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    padding: tokens.spacingVerticalM,
  },
  header: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingBottom: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
});

function App() {
  const styles = useStyles();

  const [state, setState] = useState<AppState>({
    currentView: 'settings',
    isWorkspaceOpen: true, // Assume workspace is open for now
    message: null,
    theme: 'light',
  });

  /**
   * Initialize VS Code API and set up message listeners
   */
  useEffect(() => {
    // Initialize VS Code API
    const vscodeApi = window.acquireVsCodeApi?.();

    if (!vscodeApi) {
      console.error('VS Code API not available');
      setState(prev => ({
        ...prev,
        message: {
          type: MessageBarType.error,
          text: 'VS Code API not available. Please reload the extension.',
        },
      }));
      return;
    }

    // Detect VS Code theme
    const detectTheme = () => {
      const body = document.body;
      const isDark = body.classList.contains('vscode-dark') ||
                    body.classList.contains('vscode-high-contrast');
      setState(prev => ({ ...prev, theme: isDark ? 'dark' : 'light' }));
    };

    detectTheme();

    // Set up message listener for responses from extension
    const messageListener = (event: MessageEvent) => {
      const message = event.data;

      switch (message.command) {
        case 'getSettingsResponse':
          // Handle settings response
          console.log('Received settings:', message.settings);
          break;

        case 'postSettingsResponse':
          // Handle save settings response
          if (message.success) {
            setState(prev => ({
              ...prev,
              message: {
                type: MessageBarType.success,
                text: 'Settings saved successfully!',
              },
            }));
          } else {
            setState(prev => ({
              ...prev,
              message: {
                type: MessageBarType.error,
                text: message.message || 'Failed to save settings',
              },
            }));
          }
          break;

        case 'getIndexingStatusResponse':
          // Handle indexing status response
          console.log('Received indexing status:', message.progress);
          break;

        case 'postIndexingStartResponse':
          // Handle indexing operation response
          if (message.success) {
            setState(prev => ({
              ...prev,
              message: {
                type: MessageBarType.success,
                text: message.message,
              },
            }));
          } else {
            setState(prev => ({
              ...prev,
              message: {
                type: MessageBarType.error,
                text: message.message || 'Operation failed',
              },
            }));
          }
          break;

        case 'indexingProgressUpdate':
          // Handle real-time progress updates
          console.log('Indexing progress update:', message.progress);
          break;

        default:
          console.log('Unhandled message:', message);
      }
    };

    window.addEventListener('message', messageListener);

    // Notify extension that webview is ready
    vscodeApi.postMessage({ command: 'webviewReady' });

    return () => {
      window.removeEventListener('message', messageListener);
    };
  }, []);

  /**
   * Handle view change
   */
  const handleViewChange = (view: 'settings' | 'indexing') => {
    setState(prev => ({ ...prev, currentView: view }));

    // Trigger file scan when navigating to indexing tab
    if (view === 'indexing') {
      console.log('Navigating to indexing tab, triggering file scan...');
      postMessage('startFileScan', {});
    }
  };

  /**
   * Handle settings saved
   */
  const handleSettingsSaved = (settings: any) => {
    console.log('Settings saved:', settings);
    setState(prev => ({
      ...prev,
      message: {
        type: MessageBarType.success,
        text: 'Settings saved successfully!',
      },
    }));
  };

  /**
   * Handle indexing status change
   */
  const handleIndexingStatusChange = (status: string) => {
    console.log('Indexing status changed:', status);
  };

  /**
   * Dismiss message
   */
  const dismissMessage = () => {
    setState(prev => ({ ...prev, message: null }));
  };

  // Determine theme
  const theme = state.theme === 'dark' ? webDarkTheme : webLightTheme;

  // Check if workspace is open
  if (!state.isWorkspaceOpen) {
    return (
      <FluentProvider theme={theme}>
        <div className={styles.app}>
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" verticalAlign="center">
            <Text variant="xLarge">No Workspace Open</Text>
            <Text>Please open a workspace folder to use the RAG for LLM extension.</Text>
          </Stack>
        </div>
      </FluentProvider>
    );
  }

  return (
    <FluentProvider theme={theme}>
      <div className={styles.app}>
        <div className={styles.content}>
          {/* Header */}
          <Stack className={styles.header} tokens={{ childrenGap: 10 }}>
            <Text variant="xxLarge" styles={{ root: { fontWeight: 600 } }}>
              RAG for LLM
            </Text>
            <Text variant="large" styles={{ root: { color: tokens.colorNeutralForeground2 } }}>
              Retrieval-Augmented Generation for Large Language Models
            </Text>
          </Stack>

          {/* Global Message */}
          {state.message && (
            <MessageBar
              messageBarType={state.message.type}
              onDismiss={dismissMessage}
              styles={{ root: { marginBottom: tokens.spacingVerticalL } }}
            >
              {state.message.text}
            </MessageBar>
          )}

          {/* Navigation Tabs */}
          <Pivot
            selectedKey={state.currentView}
            onLinkClick={(item) => {
              if (item?.props.itemKey) {
                handleViewChange(item.props.itemKey as 'settings' | 'indexing');
              }
            }}
            styles={{ root: { marginBottom: tokens.spacingVerticalL } }}
          >
            <PivotItem headerText="Settings" itemKey="settings" />
            <PivotItem headerText="Indexing" itemKey="indexing" />
          </Pivot>

          {/* Content */}
          <Stack>
            {state.currentView === 'settings' && (
              <SettingsForm
                onSettingsSaved={handleSettingsSaved}
              />
            )}

            {state.currentView === 'indexing' && (
              <Stack tokens={{ childrenGap: 20 }}>
                <ProgressDisplay showStats={true} />
                <IndexingProgress
                  onStatusChange={handleIndexingStatusChange}
                  showStatistics={true}
                  autoRefresh={true}
                />
              </Stack>
            )}
          </Stack>
        </div>
      </div>
    </FluentProvider>
  );
}

export default App;
