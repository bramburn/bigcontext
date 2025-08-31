import { useEffect, useState } from 'react';

/**
 * Detects VS Code webview theme by inspecting body classes and observing changes.
 * Returns 'light' | 'dark' | 'high-contrast'.
 */
export function useVscodeTheme(): 'light' | 'dark' | 'high-contrast' {
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>(() => detect());

  useEffect(() => {
    const update = () => setTheme(detect());
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return theme;
}

function detect(): 'light' | 'dark' | 'high-contrast' {
  const cls = document.body.classList;
  if (cls.contains('vscode-high-contrast') || cls.contains('vscode-high-contrast-light') || cls.contains('vscode-high-contrast-dark')) {
    return 'high-contrast';
  }
  if (cls.contains('vscode-dark')) return 'dark';
  return 'light';
}
