import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'high-contrast' | 'high-contrast-light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isHighContrast: boolean;
  cssVariables: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

function detectVSCodeTheme(): Theme {
  const classList = document.body.classList;
  
  if (classList.contains('vscode-high-contrast-light')) {
    return 'high-contrast-light';
  }
  if (classList.contains('vscode-high-contrast') || classList.contains('vscode-high-contrast-dark')) {
    return 'high-contrast';
  }
  if (classList.contains('vscode-light')) {
    return 'light';
  }
  return 'dark';
}

function getCSSVariables(theme: Theme): Record<string, string> {
  const computedStyle = getComputedStyle(document.documentElement);
  
  const baseVariables = {
    '--vscode-foreground': computedStyle.getPropertyValue('--vscode-foreground') || (theme === 'light' ? '#333333' : '#cccccc'),
    '--vscode-editor-background': computedStyle.getPropertyValue('--vscode-editor-background') || (theme === 'light' ? '#ffffff' : '#1e1e1e'),
    '--vscode-panel-border': computedStyle.getPropertyValue('--vscode-panel-border') || (theme === 'light' ? '#e5e5e5' : '#3c3c3c'),
    '--vscode-button-background': computedStyle.getPropertyValue('--vscode-button-background') || '#0e639c',
    '--vscode-button-foreground': computedStyle.getPropertyValue('--vscode-button-foreground') || '#ffffff',
    '--vscode-button-hoverBackground': computedStyle.getPropertyValue('--vscode-button-hoverBackground') || '#1177bb',
    '--vscode-focusBorder': computedStyle.getPropertyValue('--vscode-focusBorder') || '#007acc',
    '--vscode-input-placeholderForeground': computedStyle.getPropertyValue('--vscode-input-placeholderForeground') || '#a6a6a6',
    '--vscode-list-hoverBackground': computedStyle.getPropertyValue('--vscode-list-hoverBackground') || (theme === 'light' ? '#f3f3f3' : '#2a2d2e'),
    '--vscode-list-focusBackground': computedStyle.getPropertyValue('--vscode-list-focusBackground') || (theme === 'light' ? '#0078d4' : '#094771'),
    '--vscode-errorForeground': computedStyle.getPropertyValue('--vscode-errorForeground') || '#f14c4c',
  };

  // High contrast adjustments
  if (theme.includes('high-contrast')) {
    return {
      ...baseVariables,
      '--vscode-panel-border': '#ffffff',
      '--vscode-foreground': theme === 'high-contrast-light' ? '#000000' : '#ffffff',
      '--vscode-editor-background': theme === 'high-contrast-light' ? '#ffffff' : '#000000',
    };
  }

  return baseVariables;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme || detectVSCodeTheme);
  const [cssVariables, setCssVariables] = useState<Record<string, string>>({});

  const isDark = theme === 'dark' || theme === 'high-contrast';
  const isHighContrast = theme.includes('high-contrast');

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Update body class for theme detection
    document.body.classList.remove('vscode-light', 'vscode-dark', 'vscode-high-contrast', 'vscode-high-contrast-light', 'vscode-high-contrast-dark');
    
    switch (newTheme) {
      case 'light':
        document.body.classList.add('vscode-light');
        break;
      case 'dark':
        document.body.classList.add('vscode-dark');
        break;
      case 'high-contrast':
        document.body.classList.add('vscode-high-contrast', 'vscode-high-contrast-dark');
        break;
      case 'high-contrast-light':
        document.body.classList.add('vscode-high-contrast', 'vscode-high-contrast-light');
        break;
    }
  };

  useEffect(() => {
    // Initial theme detection
    const detectedTheme = detectVSCodeTheme();
    if (detectedTheme !== theme) {
      setThemeState(detectedTheme);
    }

    // Update CSS variables
    setCssVariables(getCSSVariables(theme));

    // Watch for theme changes via MutationObserver
    const observer = new MutationObserver(() => {
      const newTheme = detectVSCodeTheme();
      if (newTheme !== theme) {
        setThemeState(newTheme);
        setCssVariables(getCSSVariables(newTheme));
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Listen for VS Code theme change messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.command === 'themeChanged') {
        const newTheme = event.data.theme || detectVSCodeTheme();
        setThemeState(newTheme);
        setCssVariables(getCSSVariables(newTheme));
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      observer.disconnect();
      window.removeEventListener('message', handleMessage);
    };
  }, [theme]);

  // Apply CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [cssVariables]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    isDark,
    isHighContrast,
    cssVariables,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
