/**
 * Main App Component
 *
 * Root component for the React webview application.
 * Handles routing between different views and manages global state.
 */

import { useEffect } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { useAppStore, useCurrentView, useIsWorkspaceOpen } from './stores/appStore';
import { initializeVSCodeApi, onMessageCommand, postMessage } from './utils/vscodeApi';
import ErrorBoundary from './components/ErrorBoundary';
import NoWorkspaceView from './components/NoWorkspaceView';
import SetupView from './components/SetupView';
import IndexingView from './components/IndexingView';
import QueryView from './components/QueryView';
import DiagnosticsView from './components/DiagnosticsView';
import { useVscodeTheme } from './hooks/useVscodeTheme';

const useStyles = makeStyles({
  app: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase
  }
});

function App() {
  const styles = useStyles();
  const currentView = useCurrentView();
  const isWorkspaceOpen = useIsWorkspaceOpen();
  const { setWorkspaceOpen, setCurrentView, setFirstRunComplete } = useAppStore();

  // Initialize VS Code API and set up message listeners
  useEffect(() => {
    // Notify extension that webview is ready
    postMessage('webviewReady');

    initializeVSCodeApi();

    // Set up message listeners
    const unsubscribeWorkspace = onMessageCommand('workspaceChanged', (data) => {
      setWorkspaceOpen(data.isOpen);
    });

    const unsubscribeView = onMessageCommand('changeView', (data) => {
      setCurrentView(data.view);
    });

    const unsubscribeFirstRun = onMessageCommand('firstRunComplete', () => {
      setFirstRunComplete(true);
    });

    // Handle initial state message from extension
    const unsubscribeInitial = onMessageCommand('initialState', (data) => {
      if (data?.data?.isWorkspaceOpen !== undefined) {
        setWorkspaceOpen(!!data.data.isWorkspaceOpen);
      }
    });

    // Request initial state from extension (support multiple endpoints)
    const vscodeApi = initializeVSCodeApi();
    if (vscodeApi) {
      // Preferred new API
      vscodeApi.postMessage({ command: 'getInitialState' });
      // Fallback to legacy state request
      vscodeApi.postMessage({ command: 'getState' });
    }

    return () => {
      unsubscribeWorkspace();
      unsubscribeView();
      unsubscribeFirstRun();
      unsubscribeInitial();
    };
  }, [setWorkspaceOpen, setCurrentView, setFirstRunComplete]);

  // Determine VS Code theme and map to Fluent UI themes
  // Note: webview inherits classes like 'vscode-dark' on body
  const vsTheme = useVscodeTheme();
  const theme = vsTheme === 'dark' ? webDarkTheme : webLightTheme;

  // Render the appropriate view based on current state
  const renderCurrentView = () => {
    if (!isWorkspaceOpen) {
      return <NoWorkspaceView />;
    }

    switch (currentView) {
      case 'setup':
        return <SetupView />;
      case 'indexing':
        return <IndexingView />;
      case 'query':
        return <QueryView />;
      case 'diagnostics':
        return <DiagnosticsView />;
      default:
        return <SetupView />;
    }
  };

  return (
    <FluentProvider theme={theme}>
      <ErrorBoundary
        fallbackMessage="The Code Context Engine encountered an unexpected error."
        showDetails={false}
        onError={(error, errorInfo) => {
          console.error('App Error:', error, errorInfo);
          // Could send error to extension for logging
        }}
      >
        <div className={styles.app}>
          {renderCurrentView()}
        </div>
      </ErrorBoundary>
    </FluentProvider>
  );
}

export default App;
