/**
 * ConnectionTester Component
 * 
 * Component for testing connections to external services.
 * Displays test button and results with appropriate status indicators.
 */

import React, { useState } from 'react';
import {
  Button,
  Card,
  Text,
  Body1,
  Caption1,
  Spinner,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  Play24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Clock24Regular
} from '@fluentui/react-icons';
import { ValidationMessage } from './ValidationMessage';
import { ConnectionTestResult } from '../types';

interface ConnectionTesterProps {
  title: string;
  description?: string;
  testFunction: () => Promise<ConnectionTestResult>;
  disabled?: boolean;
  className?: string;
}

const useStyles = makeStyles({
  container: {
    marginBottom: tokens.spacingVerticalL
  },
  card: {
    padding: tokens.spacingVerticalM
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalS
  },
  title: {
    fontWeight: tokens.fontWeightSemibold
  },
  description: {
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalM
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalM
  },
  statusIcon: {
    fontSize: '20px'
  },
  statusText: {
    flex: 1
  },
  latency: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200
  },
  details: {
    marginTop: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    maxHeight: '150px',
    overflow: 'auto'
  }
});

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export const ConnectionTester: React.FC<ConnectionTesterProps> = ({
  title,
  description,
  testFunction,
  disabled = false,
  className
}) => {
  const styles = useStyles();
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
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      setResult(errorResult);
      setStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'testing':
        return <Spinner size="small" />;
      case 'success':
        return <CheckmarkCircle24Regular className={styles.statusIcon} style={{ color: tokens.colorPaletteGreenForeground1 }} />;
      case 'error':
        return <ErrorCircle24Regular className={styles.statusIcon} style={{ color: tokens.colorPaletteRedForeground1 }} />;
      default:
        return <Clock24Regular className={styles.statusIcon} style={{ color: tokens.colorNeutralForeground2 }} />;
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
    <div className={`${styles.container} ${className || ''}`}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Text className={styles.title} size={400}>
            {title}
          </Text>
          <Button
            appearance="secondary"
            icon={status === 'testing' ? undefined : <Play24Regular />}
            disabled={disabled || status === 'testing'}
            onClick={handleTest}
          >
            {getButtonText()}
          </Button>
        </div>

        {description && (
          <Body1 className={styles.description}>
            {description}
          </Body1>
        )}

        <div className={styles.statusContainer}>
          {getStatusIcon()}
          <div className={styles.statusText}>
            <Text>{getStatusText()}</Text>
            {result?.latency && (
              <Caption1 className={styles.latency}>
                ({result.latency}ms)
              </Caption1>
            )}
          </div>
        </div>

        {result && !result.success && (
          <ValidationMessage
            type="error"
            message={result.message}
          />
        )}

        {result && result.success && (
          <ValidationMessage
            type="success"
            message={result.message}
          />
        )}

        {result?.details && (
          <div className={styles.details}>
            <Caption1>Details:</Caption1>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {typeof result.details === 'string' 
                ? result.details 
                : JSON.stringify(result.details, null, 2)
              }
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ConnectionTester;
