import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../utils/cn';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  onWidthChange?: (width: number) => void;
  storageKey?: string; // For persisting width in localStorage
  collapsed?: boolean; // When true, panel renders at collapsedWidth and disables resize
  collapsedWidth?: number; // Width when collapsed (defaults to 28)
}

export default function ResizablePanel({
  children,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  className,
  onWidthChange,
  storageKey,
  collapsed = false,
  collapsedWidth = 28,
}: ResizablePanelProps) {
  // Initialize width from localStorage if available
  const getInitialWidth = () => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedWidth = parseInt(stored, 10);
        if (parsedWidth >= minWidth && parsedWidth <= maxWidth) {
          return parsedWidth;
        }
      }
    }
    return defaultWidth;
  };

  const [width, setWidth] = useState(getInitialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Save width to localStorage when it changes
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, width.toString());
    }
    onWidthChange?.(width);
  }, [width, storageKey, onWidthChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(
      minWidth,
      Math.min(maxWidth, startWidthRef.current + deltaX)
    );
    
    setWidth(newWidth);
  }, [isResizing, minWidth, maxWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={panelRef}
      className={cn('relative flex-shrink-0 overflow-hidden', className)}
      style={{ width: `${collapsed ? collapsedWidth : width}px`, transition: 'width 200ms ease-in-out' }}
      aria-hidden={false}
    >
      {children}
      
      {/* Resize handle */}
      {!collapsed && (
        <div
          className={cn(
            'absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-[var(--vscode-focusBorder,#007acc)]/30 transition-colors',
            isResizing && 'bg-[var(--vscode-focusBorder,#007acc)]/50'
          )}
          onMouseDown={handleMouseDown}
        >
        {/* Visual indicator for the resize handle */}
        <div className="absolute top-1/2 right-0 w-1 h-8 -translate-y-1/2 bg-[var(--vscode-panel-border,#3c3c3c)] rounded-l" />
        </div>
      )}

      {/* Overlay during resize to prevent text selection */}
      {isResizing && !collapsed && (
        <div className="fixed inset-0 z-50 cursor-col-resize" style={{ userSelect: 'none' }} />
      )}
    </div>
  );
}

// Hook for managing resizable panel state
export function useResizablePanel(storageKey: string, defaultWidth = 300) {
  const [width, setWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      return stored ? parseInt(stored, 10) : defaultWidth;
    }
    return defaultWidth;
  });

  const updateWidth = useCallback((newWidth: number) => {
    setWidth(newWidth);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newWidth.toString());
    }
  }, [storageKey]);

  return { width, updateWidth };
}
