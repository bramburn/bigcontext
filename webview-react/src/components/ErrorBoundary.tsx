/**
 * ErrorBoundary Component
 * 
 * React error boundary to catch and display errors gracefully.
 * Provides fallback UI when component errors occur.
 */

import React, { Component, ReactNode } from 'react';
import {
  Card,
  CardHeader,
  Button,
  Text,
  Body1,
  Caption1,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { ErrorCircle24Regular, ArrowClockwise24Regular } from '@fluentui/react-icons';
import { ErrorInfo } from '../types';

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

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center'
  },
  card: {
    maxWidth: '500px',
    padding: tokens.spacingVerticalXL
  },
  header: {
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorPaletteRedForeground1
  },
  description: {
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground2
  },
  details: {
    marginTop: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'left',
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    maxHeight: '200px',
    overflow: 'auto'
  },
  buttonContainer: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL
  }
});

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

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, customErrorInfo);
    }

    // Log to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    // Reset the error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Reload the page
    window.location.reload();
  };

  handleRetry = () => {
    // Just reset the error state to retry rendering
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
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text size={600} className={styles.header}>
              <ErrorCircle24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
              Oops! Something went wrong
            </Text>
          }
        />
        
        <Body1 className={styles.description}>
          {fallbackMessage}
        </Body1>

        {showDetails && error && (
          <div className={styles.details}>
            <Caption1>Error Details:</Caption1>
            <div style={{ marginTop: tokens.spacingVerticalS }}>
              <strong>Message:</strong> {error?.message || 'Unknown error'}
            </div>
            {error.stack && (
              <div style={{ marginTop: tokens.spacingVerticalS }}>
                <strong>Stack:</strong>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: tokens.spacingVerticalXS }}>
                  {error.stack}
                </pre>
              </div>
            )}
            {errorInfo?.componentStack && (
              <div style={{ marginTop: tokens.spacingVerticalS }}>
                <strong>Component Stack:</strong>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: tokens.spacingVerticalXS }}>
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        )}
        
        <div className={styles.buttonContainer}>
          <Button
            appearance="primary"
            icon={<ArrowClockwise24Regular />}
            onClick={onRetry}
          >
            Try Again
          </Button>
          <Button
            appearance="secondary"
            onClick={onReload}
          >
            Reload Page
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ErrorBoundary;
