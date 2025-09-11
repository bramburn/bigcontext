import { useState } from 'react';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  latency?: number;
}

interface ConnectionTesterProps {
  title: string;
  description?: string;
  testFunction: () => Promise<ConnectionTestResult>;
  disabled?: boolean;
  className?: string;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export default function ConnectionTester({
  title,
  description,
  testFunction,
  disabled = false,
  className,
}: ConnectionTesterProps) {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  const handleTest = async () => {
    setStatus('testing');
    setResult(null);

    try {
      const testResult = await testFunction();
      setResult(testResult);
      setStatus(testResult.success ? 'success' : 'error');
    } catch (error) {
      const errorResult: ConnectionTestResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
      setResult(errorResult);
      setStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'testing':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
      case 'success':
        return <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>;
      case 'error':
        return <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">✗</div>;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs">⏱</div>;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'testing':
        return 'Testing connection...';
      case 'success':
        return result?.message || 'Connection successful';
      case 'error':
        return result?.message || 'Connection failed';
      default:
        return 'Ready to test';
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'testing':
        return 'Testing...';
      case 'success':
        return 'Test Again';
      case 'error':
        return 'Retry Test';
      default:
        return 'Test Connection';
    }
  };

  return (
    <div className={`rounded border p-3 ${className || ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{title}</div>
        <button
          className="rounded border px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
          disabled={disabled || status === 'testing'}
          onClick={handleTest}
        >
          {getButtonText()}
        </button>
      </div>

      {description && (
        <div className="text-sm opacity-80 mb-3">{description}</div>
      )}

      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="text-sm">{getStatusText()}</div>
          {result?.latency && (
            <div className="text-xs opacity-70">({result.latency}ms)</div>
          )}
        </div>
      </div>

      {result && !result.success && (
        <div className="mt-2 rounded border border-red-600/40 bg-red-500/10 px-2 py-1 text-xs text-red-400">
          {result.message}
        </div>
      )}

      {result && result.success && (
        <div className="mt-2 rounded border border-green-600/40 bg-green-500/10 px-2 py-1 text-xs text-green-400">
          {result.message}
        </div>
      )}

      {result?.details && (
        <div className="mt-2 rounded bg-black/20 p-2 text-xs">
          <div className="opacity-70 mb-1">Details:</div>
          <pre className="whitespace-pre-wrap">
            {typeof result.details === 'string' 
              ? result.details 
              : JSON.stringify(result.details, null, 2)
            }
          </pre>
        </div>
      )}
    </div>
  );
}
