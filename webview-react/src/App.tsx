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
import { useAppStore, useIsWorkspaceOpen } from './stores/appStore';
import { initializeVSCodeApi, onMessageCommand, postMessage } from './utils/vscodeApi';
import { connectionMonitor } from './utils/connectionMonitor';
import ConnectionIndicator from './components/ConnectionStatus';
import ErrorBoundary from './components/ErrorBoundary';
import NoWorkspaceView from './components/NoWorkspaceView';
import Layout from './components/Layout';
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
  const isWorkspaceOpen = useIsWorkspaceOpen();
  const { setWorkspaceOpen, setCurrentView, setFirstRunComplete } = useAppStore();

  // Initialize VS Code API and set up message listeners
  useEffect(() => {
    // Notify extension that webview is ready
    postMessage('webviewReady');

    const api = initializeVSCodeApi();

    // Initialize connection monitor
    if (api) {
      connectionMonitor.initialize(api);
    }

    // Set up message listeners
    const unsubscribeWorkspace = onMessageCommand('workspaceChanged', (data) => {
      setWorkspaceOpen(data.isOpen);
    });

    // Listen for workspace state changes from the backend
    const unsubscribeWorkspaceState = onMessageCommand('workspaceStateChanged', (data) => {
      if (data?.data?.isWorkspaceOpen !== undefined) {
        setWorkspaceOpen(!!data.data.isWorkspaceOpen);
      }
    });

    const unsubscribeView = onMessageCommand('changeView', (data) => {
      setCurrentView(data.view);
    });

    const unsubscribeFirstRun = onMessageCommand('firstRunComplete', () => {
      setFirstRunComplete(true);
    });

    // Handle navigation messages from command palette
    const unsubscribeNavigate = onMessageCommand('navigateToView', (data) => {
      console.log('App: Navigate to view:', data);
      const { view } = data?.data || {};
      if (view) {
        useAppStore.getState().setSelectedNavItem(view);
      }
    });

    const unsubscribeSetQuery = onMessageCommand('setQuery', (data) => {
      console.log('App: Set query:', data);
      const { query } = data?.data || {};
      if (query) {
        useAppStore.getState().setQuery(query);
        useAppStore.getState().setSelectedNavItem('search');
        useAppStore.getState().setSelectedSearchTab('query');
      }
    });

    const unsubscribeSetSearchTab = onMessageCommand('setSearchTab', (data) => {
      console.log('App: Set search tab:', data);
      const { tab } = data?.data || {};
      if (tab) {
        useAppStore.getState().setSelectedSearchTab(tab);
        useAppStore.getState().setSelectedNavItem('search');
      }
    });

    // Handle initial state message from extension
    const unsubscribeInitial = onMessageCommand('initialState', (data) => {
      console.log('Frontend: Received initialState message:', data);
      if (data?.data?.isWorkspaceOpen !== undefined) {
        const isOpen = !!data.data.isWorkspaceOpen;
        console.log('Frontend: Setting workspace open to:', isOpen);
        setWorkspaceOpen(isOpen);
      } else {
        console.warn('Frontend: initialState message missing isWorkspaceOpen data');
      }
    });

    // Request initial state from extension (support multiple endpoints)
    if (api) {
      console.log('Frontend: Requesting initial state from extension...');
      // Preferred new API
      api.postMessage({ command: 'getInitialState' });
      // Fallback to legacy state request
      api.postMessage({ command: 'getState' });
      console.log('Frontend: Initial state requests sent');
    } else {
      console.error('Frontend: VS Code API not available, cannot request initial state');
    }

    return () => {
      unsubscribeWorkspace();
      unsubscribeWorkspaceState();
      unsubscribeView();
      unsubscribeFirstRun();
      unsubscribeInitial();
      unsubscribeNavigate();
      unsubscribeSetQuery();
      unsubscribeSetSearchTab();
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

    // Use the new Layout component for workspace views
    return <Layout />;
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
          <ConnectionIndicator />
          {renderCurrentView()}
        </div>
      </ErrorBoundary>
    </FluentProvider>
  );
}

export default App;
