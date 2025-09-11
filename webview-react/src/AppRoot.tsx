import { useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { postMessage } from './utils/vscodeApi';
import SearchView from './views/SearchView';
import IndexingView from './views/IndexingView';
import SettingsView from './views/SettingsView';
import SetupView from './views/SetupView';
import DiagnosticsView from './views/DiagnosticsView';
import HelpView from './views/HelpView';
import ConnectionStatus from './ui/ConnectionStatus';
import ErrorBoundary from './ui/ErrorBoundary';
import { ThemeProvider, useTheme } from './providers/ThemeProvider';
import { TooltipProvider } from './ui/Tooltip';
import PerformanceDashboard, { usePerformanceDashboard } from './components/PerformanceDashboard';


function AppContent() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentView, setCurrentView] = useState<'search' | 'indexing' | 'settings' | 'setup' | 'diagnostics' | 'help'>('search');
  const { theme, isDark } = useTheme();
  const performanceDashboard = usePerformanceDashboard();

  useEffect(() => {

    const onMessage = (event: MessageEvent) => {
      const m = event.data;
      if (!m || typeof m !== 'object') return;
      if (m.command === 'postSettingsResponse') {
        setMessage(m.success ? { type: 'success', text: 'Settings saved successfully!' } : { type: 'error', text: m.message || 'Failed to save settings' });
      }
    };
    window.addEventListener('message', onMessage);
    window.acquireVsCodeApi?.()?.postMessage({ command: 'webviewReady' });
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (currentView === 'indexing') {
      try { postMessage('startFileScan', {}); } catch {}
    }
  }, [currentView]);

  return (
    <ErrorBoundary fallbackMessage="The Code Context Engine encountered an error. Please try refreshing the webview.">
      <div className={`min-h-screen w-full ${isDark ? 'bg-[#1e1e1e] text-[#cccccc]' : 'bg-white text-black'} p-4`}>
      <header className="max-w-5xl mx-auto border-b border-[var(--vscode-panel-border,#3c3c3c)] pb-3 mb-6">
        <h1 className="text-2xl font-semibold">Code Context Engine</h1>
        <p className="text-sm opacity-80">Retrieval-Augmented context for your code</p>
      </header>

      <main className="max-w-5xl mx-auto">
        {message && (
          <div className={`mb-4 rounded border px-3 py-2 text-sm ${message.type === 'success' ? 'border-green-600/40 bg-green-500/10' : 'border-red-600/40 bg-red-500/10'}`}>
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <button className="opacity-70 hover:opacity-100" onClick={() => setMessage(null)}>×</button>
            </div>
          </div>
        )}

        <Tabs.Root value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
          <Tabs.List className="flex gap-2 border-b border-[var(--vscode-panel-border,#3c3c3c)]">
            <Tabs.Trigger value="search" className="px-3 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-[var(--vscode-focusBorder,#007acc)]">Search</Tabs.Trigger>
            <Tabs.Trigger value="indexing" className="px-3 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-[var(--vscode-focusBorder,#007acc)]">Indexing</Tabs.Trigger>
            <Tabs.Trigger value="settings" className="px-3 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-[var(--vscode-focusBorder,#007acc)]">Settings</Tabs.Trigger>
            <Tabs.Trigger value="setup" className="px-3 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-[var(--vscode-focusBorder,#007acc)]">Setup</Tabs.Trigger>
            <Tabs.Trigger value="diagnostics" className="px-3 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-[var(--vscode-focusBorder,#007acc)]">Diagnostics</Tabs.Trigger>
            <Tabs.Trigger value="help" className="px-3 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-[var(--vscode-focusBorder,#007acc)]">Help</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="search" className="pt-4">
            <SearchView />
          </Tabs.Content>

          <Tabs.Content value="indexing" className="pt-4">
            <IndexingView />
          </Tabs.Content>

          <Tabs.Content value="settings" className="pt-4">
            <SettingsView />
          </Tabs.Content>

          <Tabs.Content value="setup" className="pt-4">
            <SetupView />
          </Tabs.Content>

          <Tabs.Content value="diagnostics" className="pt-4">
            <DiagnosticsView />
          </Tabs.Content>

          <Tabs.Content value="help" className="pt-4">
            <HelpView />
          </Tabs.Content>
        </Tabs.Root>

        <ConnectionStatus />
      </main>
      </div>

      {/* Performance Dashboard (development only) */}
      <PerformanceDashboard
        isVisible={performanceDashboard.isVisible}
        onClose={performanceDashboard.hide}
      />
    </ErrorBoundary>
  );
}

export default function AppRoot() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default AppRoot;

