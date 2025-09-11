import { useState } from 'react';
import { postMessage } from '../utils/vscodeApi';

export interface SetupStep {
  title: string;
  description?: string;
  command?: string;
  note?: string;
  warning?: string;
  link?: { url: string; text: string };
}

interface SetupInstructionsProps {
  steps: SetupStep[];
  title?: string;
}

export default function SetupInstructions({ steps, title }: SetupInstructionsProps) {
  const [copiedCommands, setCopiedCommands] = useState<Set<number>>(new Set());

  const copyToClipboard = async (text: string, stepIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommands(prev => new Set(prev).add(stepIndex));
      setTimeout(() => {
        setCopiedCommands(prev => {
          const newSet = new Set(prev);
          newSet.delete(stepIndex);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const openLink = (url: string) => {
    postMessage('openExternalLink', { url });
  };

  return (
    <div>
      {title && (
        <div className="text-base font-semibold mb-3">{title}</div>
      )}
      
      {steps.map((step, index) => (
        <div key={index} className="mb-3 rounded border p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--vscode-focusBorder,#007acc)] text-xs text-white font-semibold">
              {index + 1}
            </div>
            <div className="font-medium">{step.title}</div>
          </div>
          
          <div className="ml-8">
            {step.description && (
              <div className="text-sm mb-2">{step.description}</div>
            )}
            
            {step.command && (
              <div className="relative rounded bg-black/20 p-2 font-mono text-xs mb-2">
                <code>{step.command}</code>
                <button
                  className="absolute top-1 right-1 rounded border px-1 py-0.5 text-xs hover:bg-white/10"
                  onClick={() => copyToClipboard(step.command!, index)}
                  title="Copy command"
                >
                  {copiedCommands.has(index) ? '✓' : '📋'}
                </button>
              </div>
            )}
            
            {step.link && (
              <button
                className="mb-2 rounded border px-2 py-1 text-xs hover:bg-white/5"
                onClick={() => openLink(step.link!.url)}
              >
                🔗 {step.link.text}
              </button>
            )}
            
            {step.note && (
              <div className="rounded border border-yellow-600/40 bg-yellow-500/10 px-2 py-1 text-xs">
                <strong>Note:</strong> {step.note}
              </div>
            )}
            
            {step.warning && (
              <div className="rounded border border-red-600/40 bg-red-500/10 px-2 py-1 text-xs">
                <strong>Warning:</strong> {step.warning}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
