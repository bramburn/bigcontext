/**
 * IndexingView Component
 * 
 * Displays indexing progress with real-time updates.
 * Shows progress bar, current file being processed, and statistics.
 */

import React, { useEffect } from 'react';
import {
  Card,
  Button,
  Text,
  Body1,
  Caption1,
  ProgressBar,
  Spinner,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  DocumentSearch24Regular,
  Stop24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular
} from '@fluentui/react-icons';
import { useAppStore, useIndexingState } from '../stores/appStore';
import { postMessage, onMessageCommand } from '../utils/vscodeApi';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXL,
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    marginBottom: tokens.spacingVerticalXL,
    textAlign: 'center'
  },
  title: {
    marginBottom: tokens.spacingVerticalS
  },
  description: {
    color: tokens.colorNeutralForeground2
  },
  card: {
    padding: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL
  },
  progressSection: {
    marginBottom: tokens.spacingVerticalL
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS
  },
  progressBar: {
    marginBottom: tokens.spacingVerticalM
  },
  currentFile: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall
  },
  fileName: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    wordBreak: 'break-all'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL
  },
  statItem: {
    textAlign: 'center',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall
  },
  statValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXS
  },
  statLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalM
  },
  completedIcon: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: '24px'
  },
  errorIcon: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: '24px'
  }
});

export const IndexingView: React.FC = () => {
  const styles = useStyles();
  const indexingState = useIndexingState();
  const { setCurrentView, setIndexingProgress, setIndexingMessage, setFilesProcessed, setCurrentFile, completeIndexing } = useAppStore();

  // Set up message listeners for indexing updates
  useEffect(() => {
    const unsubscribeProgress = onMessageCommand('indexingProgress', (data) => {
      setIndexingProgress(data.progress);
      setIndexingMessage(data.message);
      if (data.filesProcessed !== undefined) {
        setFilesProcessed(data.filesProcessed, data.totalFiles);
      }
      if (data.currentFile) {
        setCurrentFile(data.currentFile);
      }
    });

    const unsubscribeComplete = onMessageCommand('indexingComplete', (data) => {
      completeIndexing({
        chunksCreated: data.chunksCreated,
        duration: data.duration,
        errors: data.errors || []
      });
    });

    const unsubscribeError = onMessageCommand('indexingError', (data) => {
      completeIndexing({
        errors: [data.error]
      });
    });

    return () => {
      unsubscribeProgress();
      unsubscribeComplete();
      unsubscribeError();
    };
  }, [setIndexingProgress, setIndexingMessage, setFilesProcessed, setCurrentFile, completeIndexing]);

  const handleStopIndexing = () => {
    // Map to pause since full stop/cancel is not implemented in backend
    postMessage('pauseIndexing');
  };

  const handleGoToQuery = () => {
    setCurrentView('query');
  };

  const handleRetryIndexing = () => {
    postMessage('retryIndexing');
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const isCompleted = !indexingState.isIndexing && indexingState.progress === 100;
  const hasErrors = indexingState.stats.errors.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={800} weight="bold" className={styles.title}>
          <DocumentSearch24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
          {isCompleted ? 'Indexing Complete' : 'Indexing Workspace'}
        </Text>
        <Body1 className={styles.description}>
          {isCompleted 
            ? 'Your workspace has been successfully indexed and is ready for intelligent search.'
            : 'Processing your workspace files to create a searchable index...'
          }
        </Body1>
      </div>

      <Card className={styles.card}>
        {/* Progress Section */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <Text size={500} weight="semibold">
              Progress
            </Text>
            <Text size={400}>
              {Math.round(indexingState.progress)}%
            </Text>
          </div>
          
          <ProgressBar 
            value={indexingState.progress / 100}
            className={styles.progressBar}
          />

          {indexingState.message && (
            <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
              {indexingState.message}
            </Caption1>
          )}
        </div>

        {/* Current File */}
        {indexingState.isIndexing && indexingState.currentFile && (
          <div className={styles.currentFile}>
            <Spinner size="small" />
            <div>
              <Caption1>Processing:</Caption1>
              <div className={styles.fileName}>
                {indexingState.currentFile}
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {indexingState.filesProcessed}
            </div>
            <div className={styles.statLabel}>
              Files Processed
            </div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {indexingState.totalFiles}
            </div>
            <div className={styles.statLabel}>
              Total Files
            </div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {indexingState.stats.chunksCreated}
            </div>
            <div className={styles.statLabel}>
              Chunks Created
            </div>
          </div>
          
          {indexingState.stats.duration > 0 && (
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {formatDuration(indexingState.stats.duration)}
              </div>
              <div className={styles.statLabel}>
                Duration
              </div>
            </div>
          )}
        </div>

        {/* Completion Status */}
        {isCompleted && (
          <div style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalL }}>
            {hasErrors ? (
              <div>
                <ErrorCircle24Regular className={styles.errorIcon} />
                <Text size={500} style={{ marginLeft: tokens.spacingHorizontalS }}>
                  Completed with {indexingState.stats.errors.length} error(s)
                </Text>
              </div>
            ) : (
              <div>
                <CheckmarkCircle24Regular className={styles.completedIcon} />
                <Text size={500} style={{ marginLeft: tokens.spacingHorizontalS }}>
                  Successfully completed!
                </Text>
              </div>
            )}
          </div>
        )}

        {/* Error Details */}
        {hasErrors && (
          <div style={{ 
            marginTop: tokens.spacingVerticalM,
            padding: tokens.spacingVerticalM,
            backgroundColor: tokens.colorPaletteRedBackground1,
            borderRadius: tokens.borderRadiusSmall
          }}>
            <Text size={400} weight="semibold" style={{ color: tokens.colorPaletteRedForeground1 }}>
              Errors encountered:
            </Text>
            {indexingState.stats.errors.map((error, index) => (
              <div key={index} style={{ marginTop: tokens.spacingVerticalXS }}>
                <Caption1 style={{ color: tokens.colorPaletteRedForeground1 }}>
                  {error}
                </Caption1>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className={styles.actions}>
        {indexingState.isIndexing ? (
          <Button
            appearance="secondary"
            icon={<Stop24Regular />}
            onClick={handleStopIndexing}
          >
            Stop Indexing
          </Button>
        ) : isCompleted ? (
          <>
            <Button
              appearance="primary"
              onClick={handleGoToQuery}
            >
              Start Searching
            </Button>
            {hasErrors && (
              <Button
                appearance="secondary"
                onClick={handleRetryIndexing}
              >
                Retry Indexing
              </Button>
            )}
          </>
        ) : (
          <Button
            appearance="primary"
            onClick={handleRetryIndexing}
          >
            Retry Indexing
          </Button>
        )}
      </div>
    </div>
  );
};

export default IndexingView;
