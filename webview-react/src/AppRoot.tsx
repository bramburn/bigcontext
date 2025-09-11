import { useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { postMessage } from './utils/vscodeApi';
import SearchView from './views/SearchView';
import FilterPanel, { FilterOptions } from './ui/FilterPanel';
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
import ResizablePanel from './ui/ResizablePanel';
import { Button } from './ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, LayersIcon, GearIcon, RocketIcon, ActivityLogIcon, QuestionMarkCircledIcon } from '@radix-ui/react-icons';


function AppContent() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentView, setCurrentView] = useState<'search' | 'indexing' | 'settings' | 'setup' | 'diagnostics' | 'help'>('search');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [availableFileTypes, setAvailableFileTypes] = useState<string[]>([]);

  // Sidebar collapse state (user-pref or auto on narrow widths)
  const COLLAPSE_PREF_KEY = 'layout:sidebar:collapsed:user';
  const getInitCollapsed = () => {
    try {
      const stored = localStorage.getItem(COLLAPSE_PREF_KEY);
      if (stored !== null) return stored === 'true';
    } catch {}
    return typeof window !== 'undefined' ? window.innerWidth < 900 : false;
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(getInitCollapsed);
  const [userCollapsedPref, setUserCollapsedPref] = useState<boolean | null>(() => {
    try {
      const s = localStorage.getItem(COLLAPSE_PREF_KEY);
      return s === null ? null : s === 'true';
    } catch {
      return null;
    }
  });
  useEffect(() => {
    const onResize = () => {
      if (userCollapsedPref === null) {
        setSidebarCollapsed(window.innerWidth < 900);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [userCollapsedPref]);
  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    setUserCollapsedPref(next);
    try { localStorage.setItem(COLLAPSE_PREF_KEY, String(next)); } catch {}
  };
  const { isDark } = useTheme();
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

  // Keyboard shortcut: Cmd/Ctrl+B toggles sidebar (non-invasive; does not prevent default)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;
      const key = e.key.toLowerCase();
      if (key === 'b') {
        // Do not preventDefault to avoid conflicting with VS Code; attempt local toggle
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleSidebar]);

  return (
    <ErrorBoundary fallbackMessage="The Code Context Engine encountered an error. Please try refreshing the webview.">
      <div className={`min-h-screen w-full ${isDark ? 'bg-[#1e1e1e] text-[#cccccc]' : 'bg-white text-black'} p-4`}>
      <header className="w-full border-b border-[var(--vscode-panel-border,#3c3c3c)] pb-3 mb-6">
        <h1 className="text-2xl font-semibold">Code Context Engine</h1>
        <p className="text-sm opacity-80">Retrieval-Augmented context for your code</p>
      </header>

      <Tabs.Root value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
        <main className="w-full grid grid-cols-[auto_1fr] gap-4 ultrawide:max-w-[2400px] ultrawide:mx-auto">
        {/* Left Sidebar */}
        <ResizablePanel collapsed={sidebarCollapsed} collapsedWidth={28} storageKey="layout:sidebar" defaultWidth={280} minWidth={200} maxWidth={480} className="border-r border-[var(--vscode-panel-border,#3c3c3c)]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-expanded={!sidebarCollapsed}
              aria-controls="sidebar-content"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </Button>
          </div>

          {sidebarCollapsed ? (
            <div id="sidebar-content-collapsed" className="flex flex-col items-center gap-2 py-1">
              <nav aria-label="Main (collapsed)" className="flex flex-col items-center gap-2">
                <Tabs.List aria-label="Views" className="flex flex-col items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Tabs.Trigger value="search" aria-label="Search" className="rounded p-1.5 data-[state=active]:bg-white/10">
                        <MagnifyingGlassIcon />
                      </Tabs.Trigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">Search</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Tabs.Trigger value="indexing" aria-label="Indexing" className="rounded p-1.5 data-[state=active]:bg-white/10">
                        <LayersIcon />
                      </Tabs.Trigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">Indexing</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Tabs.Trigger value="settings" aria-label="Settings" className="rounded p-1.5 data-[state=active]:bg-white/10">
                        <GearIcon />
                      </Tabs.Trigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">Settings</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Tabs.Trigger value="setup" aria-label="Setup" className="rounded p-1.5 data-[state=active]:bg-white/10">
                        <RocketIcon />
                      </Tabs.Trigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">Setup</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Tabs.Trigger value="diagnostics" aria-label="Diagnostics" className="rounded p-1.5 data-[state=active]:bg-white/10">
                        <ActivityLogIcon />
                      </Tabs.Trigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">Diagnostics</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Tabs.Trigger value="help" aria-label="Help" className="rounded p-1.5 data-[state=active]:bg-white/10">
                        <QuestionMarkCircledIcon />
                      </Tabs.Trigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">Help</TooltipContent>
                  </Tooltip>
                </Tabs.List>
              </nav>
            </div>
          ) : (
            <div id="sidebar-content" className="flex flex-col gap-3">
              <nav aria-label="Main" className="flex flex-col gap-1">
                <Tabs.List aria-label="Views" className="flex flex-col gap-1">
                  <Tabs.Trigger value="search" className="w-full justify-start rounded px-2 py-1.5 text-sm text-left data-[state=active]:bg-white/5">Search</Tabs.Trigger>
                  <Tabs.Trigger value="indexing" className="w-full justify-start rounded px-2 py-1.5 text-sm text-left data-[state=active]:bg-white/5">Indexing</Tabs.Trigger>
                  <Tabs.Trigger value="settings" className="w-full justify-start rounded px-2 py-1.5 text-sm text-left data-[state=active]:bg-white/5">Settings</Tabs.Trigger>
                  <Tabs.Trigger value="setup" className="w-full justify-start rounded px-2 py-1.5 text-sm text-left data-[state=active]:bg-white/5">Setup</Tabs.Trigger>
                  <Tabs.Trigger value="diagnostics" className="w-full justify-start rounded px-2 py-1.5 text-sm text-left data-[state=active]:bg-white/5">Diagnostics</Tabs.Trigger>
                  <Tabs.Trigger value="help" className="w-full justify-start rounded px-2 py-1.5 text-sm text-left data-[state=active]:bg-white/5">Help</Tabs.Trigger>
                </Tabs.List>
              </nav>

              {currentView === 'search' && (
                <div className="mt-1">
                  <FilterPanel availableFileTypes={availableFileTypes} currentFilters={filters} onFilterChange={setFilters} />
                </div>
              )}
            </div>
          )}
        </ResizablePanel>

        {/* Main Content */}
        <div className="min-w-0">
          {message && (
            <div className={`mb-2 rounded border px-3 py-2 text-sm ${message.type === 'success' ? 'border-green-600/40 bg-green-500/10' : 'border-red-600/40 bg-red-500/10'}`}>
              <div className="flex items-center justify-between">
                <span>{message.text}</span>
                <button className="opacity-70 hover:opacity-100" onClick={() => setMessage(null)}>×</button>
              </div>
            </div>
          )}

          <Tabs.Content value="search" className="pt-0">
            <SearchView
              filters={filters}
              onAvailableFileTypesChange={setAvailableFileTypes}
            />
          </Tabs.Content>

          <Tabs.Content value="indexing" className="pt-0">
            <IndexingView />
          </Tabs.Content>

          <Tabs.Content value="settings" className="pt-0">
            <SettingsView />
          </Tabs.Content>

          <Tabs.Content value="setup" className="pt-0">
            <SetupView />
          </Tabs.Content>

          <Tabs.Content value="diagnostics" className="pt-0">
            <DiagnosticsView />
          </Tabs.Content>

          <Tabs.Content value="help" className="pt-0">
            <HelpView />
          </Tabs.Content>

          <ConnectionStatus />
        </div>
        </main>
      </Tabs.Root>
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

