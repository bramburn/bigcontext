/**
 * IndexingDashboard Component
 * 
 * Enhanced indexing dashboard with pause/resume controls, error tracking,
 * and detailed progress monitoring. This component provides comprehensive
 * visibility into the indexing process and allows users to control it.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Button,
  Text,
  Body1,
  Caption1,
  ProgressBar,
  Spinner,
  Badge,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  DocumentSearch24Regular,
  Play24Regular,
  Pause24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular
} from '@fluentui/react-icons';
import { postMessage, onMessageCommand } from '../utils/vscodeApi';

/**
 * Interface for indexing status information
 */
interface IndexingStatusInfo {
  status: 'idle' | 'indexing' | 'paused' | 'error';
  currentFile?: string;
  processedFiles: number;
  totalFiles: number;
  errors: Array<{
    filePath: string;
    error: string;
    timestamp: string;
  }>;
  startTime?: string;
  estimatedTimeRemaining?: number;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
    maxWidth: '1000px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL
  },
  headerIcon: {
    color: tokens.colorBrandBackground
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold
  },
  description: {
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalXS
  },
  statusCard: {
    padding: tokens.spacingVerticalL
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalM
  },
  statusInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  progressSection: {
    marginBottom: tokens.spacingVerticalL
  },
  progressBar: {
    marginBottom: tokens.spacingVerticalS
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  controls: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    justifyContent: 'center'
  },
  errorSection: {
    marginTop: tokens.spacingVerticalL
  },
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorPaletteRedForeground1
  },
  errorGrid: {
    maxHeight: '300px',
    overflow: 'auto'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalM
  },
  statCard: {
    padding: tokens.spacingVerticalM,
    textAlign: 'center'
  },
  statValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandBackground
  },
  statLabel: {
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalXS
  }
});

export const IndexingDashboard: React.FC = () => {
  const styles = useStyles();
  
  const [status, setStatus] = useState<IndexingStatusInfo>({
    status: 'idle',
    processedFiles: 0,
    totalFiles: 0,
    errors: []
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Load initial status
  useEffect(() => {
    loadIndexingStatus();
    
    // Set up periodic status updates
    const interval = setInterval(loadIndexingStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Set up message listeners
  useEffect(() => {
    const unsubscribeStatus = onMessageCommand('getIndexingStatusResponse', (data) => {
      if (data.success && data.data) {
        setStatus(data.data);
      }
    });

    const unsubscribePause = onMessageCommand('pauseIndexingResponse', (data) => {
      setIsLoading(false);
      if (data.success) {
        loadIndexingStatus();
      }
    });

    const unsubscribeResume = onMessageCommand('resumeIndexingResponse', (data) => {
      setIsLoading(false);
      if (data.success) {
        loadIndexingStatus();
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribePause();
      unsubscribeResume();
    };
  }, []);

  const loadIndexingStatus = useCallback(() => {
    postMessage('getIndexingStatus');
  }, []);

  const handlePause = useCallback(() => {
    setIsLoading(true);
    postMessage('pauseIndexing');
  }, []);

  const handleResume = useCallback(() => {
    setIsLoading(true);
    postMessage('resumeIndexing');
  }, []);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'indexing':
        return <Spinner size="small" />;
      case 'paused':
        return <Pause24Regular />;
      case 'error':
        return <ErrorCircle24Regular />;
      default:
        return <CheckmarkCircle24Regular />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'indexing':
        return tokens.colorPaletteBlueForeground2;
      case 'paused':
        return tokens.colorPaletteYellowForeground2;
      case 'error':
        return tokens.colorPaletteRedForeground2;
      default:
        return tokens.colorPaletteGreenForeground2;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'indexing':
        return 'Indexing in progress...';
      case 'paused':
        return 'Indexing paused';
      case 'error':
        return 'Indexing error occurred';
      default:
        return 'Indexing complete';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const calculateProgress = () => {
    if (status.totalFiles === 0) return 0;
    return (status.processedFiles / status.totalFiles) * 100;
  };



  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <DocumentSearch24Regular />
        </div>
        <div>
          <Text size={800} weight="bold" className={styles.title}>
            Indexing Dashboard
          </Text>
          <Body1 className={styles.description}>
            Monitor indexing progress and manage the indexing process
          </Body1>
        </div>
      </div>

      {/* Status Card */}
      <Card className={styles.statusCard}>
        <div className={styles.statusRow}>
          <div className={styles.statusInfo}>
            <div style={{ color: getStatusColor() }}>
              {getStatusIcon()}
            </div>
            <Text size={600} weight="semibold">
              {getStatusText()}
            </Text>
            {status.status === 'indexing' && status.currentFile && (
              <Badge appearance="outline">
                {status.currentFile}
              </Badge>
            )}
          </div>
          
          <div className={styles.controls}>
            {status.status === 'indexing' ? (
              <Button
                appearance="secondary"
                icon={<Pause24Regular />}
                onClick={handlePause}
                disabled={isLoading}
              >
                {isLoading ? 'Pausing...' : 'Pause'}
              </Button>
            ) : status.status === 'paused' ? (
              <Button
                appearance="primary"
                icon={<Play24Regular />}
                onClick={handleResume}
                disabled={isLoading}
              >
                {isLoading ? 'Resuming...' : 'Resume'}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Progress Section */}
        {(status.status === 'indexing' || status.status === 'paused') && (
          <div className={styles.progressSection}>
            <ProgressBar 
              value={calculateProgress()} 
              className={styles.progressBar}
            />
            <div className={styles.progressText}>
              <Caption1>
                {status.processedFiles} of {status.totalFiles} files processed
              </Caption1>
              <Caption1>
                {calculateProgress().toFixed(1)}% complete
              </Caption1>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className={styles.statsGrid}>
          <Card className={styles.statCard}>
            <Text className={styles.statValue}>{status.totalFiles}</Text>
            <Caption1 className={styles.statLabel}>Total Files</Caption1>
          </Card>
          <Card className={styles.statCard}>
            <Text className={styles.statValue}>{status.processedFiles}</Text>
            <Caption1 className={styles.statLabel}>Processed</Caption1>
          </Card>
          <Card className={styles.statCard}>
            <Text className={styles.statValue}>{status.errors.length}</Text>
            <Caption1 className={styles.statLabel}>Errors</Caption1>
          </Card>
          {status.estimatedTimeRemaining && (
            <Card className={styles.statCard}>
              <Text className={styles.statValue}>
                {Math.round(status.estimatedTimeRemaining / 1000)}s
              </Text>
              <Caption1 className={styles.statLabel}>Est. Remaining</Caption1>
            </Card>
          )}
        </div>
      </Card>

      {/* Error Section */}
      {status.errors.length > 0 && (
        <Card>
          <div className={styles.errorHeader}>
            <ErrorCircle24Regular />
            <Text size={600} weight="semibold">
              Indexing Errors ({status.errors.length})
            </Text>
          </div>

          <div className={styles.errorGrid}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 100px', gap: tokens.spacingHorizontalS, padding: tokens.spacingVerticalS }}>
              {/* Header */}
              <Text weight="semibold">File</Text>
              <Text weight="semibold">Error</Text>
              <Text weight="semibold">Time</Text>

              {/* Error rows */}
              {status.errors.map((error, index) => (
                <React.Fragment key={index}>
                  <Text size={200} title={error.filePath}>
                    {error.filePath.length > 50
                      ? `...${error.filePath.slice(-47)}`
                      : error.filePath}
                  </Text>
                  <Text size={200} title={error.error}>
                    {error.error.length > 80
                      ? `${error.error.slice(0, 77)}...`
                      : error.error}
                  </Text>
                  <Text size={200}>
                    {formatTime(error.timestamp)}
                  </Text>
                </React.Fragment>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default IndexingDashboard;
