import { Component, ReactNode } from 'react';

interface ErrorInfo {
  componentStack: string;
  errorBoundary: string;
}

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const customErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack || '',
      errorBoundary: this.constructor.name
    };

    this.setState({
      errorInfo: customErrorInfo
    });

    if (this.props.onError) {
      this.props.onError(error, customErrorInfo);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log Radix-specific errors for debugging
    if (error.message && (error.message.includes('radix') || error.message.includes('CSS var'))) {
      console.error('Radix UI or CSS variable error detected:', error.message);
    }
  }

  handleReload = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        fallbackMessage={this.props.fallbackMessage}
        showDetails={this.props.showDetails}
        onReload={this.handleReload}
        onRetry={this.handleRetry}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  fallbackMessage?: string;
  showDetails?: boolean;
  onReload: () => void;
  onRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  fallbackMessage = "Something went wrong",
  showDetails = false,
  onReload,
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-8 text-center">
      <div className="max-w-lg p-8 rounded border">
        <div className="mb-6 text-red-400">
          <h1 className="text-xl font-semibold flex items-center justify-center gap-2">
            <span className="text-2xl">❌</span>
            Oops! Something went wrong
          </h1>
        </div>
        
        <div>
          <p className="mb-6 opacity-80">
            {fallbackMessage}
          </p>

          {showDetails && error && (
            <div className="mt-6 p-4 bg-black/20 rounded border text-left font-mono text-sm max-h-[200px] overflow-auto">
              <p className="font-semibold text-sm">Error Details:</p>
              <div className="mt-2">
                <strong>Message:</strong> {error?.message || 'Unknown error'}
              </div>
              {error.stack && (
                <div className="mt-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo?.componentStack && (
                <div className="mt-2">
                  <strong>Component Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-4 mt-6 justify-center">
            <button
              className="flex items-center gap-2 rounded bg-[var(--vscode-button-background,#0e639c)] px-4 py-2 text-white hover:bg-[var(--vscode-button-hoverBackground,#1177bb)]"
              onClick={onRetry}
            >
              <span>🔄</span>
              Try Again
            </button>
            <button
              className="rounded border px-4 py-2 hover:bg-white/5"
              onClick={onReload}
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
