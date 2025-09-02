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
  Badge,
  Divider,
  makeStyles,
  tokens,
  mergeClasses
} from '@fluentui/react-components';
import {
  DocumentSearch24Regular,
  Stop24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  DocumentBulletList24Regular,
  Clock24Regular,
  Warning24Regular,
  Settings24Regular,
  Play24Regular
} from '@fluentui/react-icons';
import { useAppStore, useIndexingState } from '../stores/appStore';
import { postMessage, onMessageCommand } from '../utils/vscodeApi';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXL,
    maxWidth: '900px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  header: {
    textAlign: 'center',
    padding: tokens.spacingVerticalL
  },
  headerIcon: {
    fontSize: '32px',
    marginBottom: tokens.spacingVerticalS,
    color: tokens.colorBrandForeground1
  },
  title: {
    marginBottom: tokens.spacingVerticalS,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalS
  },
  description: {
    color: tokens.colorNeutralForeground2,
    maxWidth: '600px',
    margin: '0 auto'
  },
  mainCard: {
    padding: tokens.spacingVerticalXL
  },
  progressSection: {
    marginBottom: tokens.spacingVerticalXL
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM
  },
  progressBadge: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold
  },
  progressBar: {
    marginBottom: tokens.spacingVerticalM,
    height: '8px'
  },
  statusMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground2
  },
  currentFileSection: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: tokens.spacingVerticalL
  },
  currentFileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS
  },
  fileName: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    wordBreak: 'break-all',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalXL
  },
  statCard: {
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    textAlign: 'center',
    transition: 'all 0.2s ease-in-out',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8
    }
  },
  statIcon: {
    fontSize: '20px',
    marginBottom: tokens.spacingVerticalS,
    color: tokens.colorBrandForeground1
  },
  statValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground1
  },
  statLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200
  },
  completionSection: {
    textAlign: 'center',
    padding: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL
  },
  completionIcon: {
    fontSize: '48px',
    marginBottom: tokens.spacingVerticalM
  },
  successIcon: {
    color: tokens.colorPaletteGreenForeground1
  },
  errorIcon: {
    color: tokens.colorPaletteRedForeground1
  },
  warningIcon: {
    color: tokens.colorPaletteYellowForeground1
  },
  completionMessage: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold
  },
  errorDetails: {
    marginTop: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorPaletteRedBorder1}`
  },
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorPaletteRedForeground1,
    fontWeight: tokens.fontWeightSemibold
  },
  errorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  errorItem: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    color: tokens.colorPaletteRedForeground1,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalL,
    paddingTop: tokens.spacingVerticalL
  },
  divider: {
    margin: `${tokens.spacingVerticalL} 0`
  }
});

export const IndexingView: React.FC = () => {
  const styles = useStyles();
  const indexingState = useIndexingState();
  const { setCurrentView, setIndexing, setIndexingProgress, setIndexingMessage, setFilesProcessed, setCurrentFile, completeIndexing, setPaused } = useAppStore();

  // Set up message listeners for indexing updates
  useEffect(() => {
    const unsubscribeProgress = onMessageCommand('indexingProgress', (data) => {
      setIndexing(true);
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

    // Pause/Resume responses
    const unsubscribePause = onMessageCommand('pauseIndexingResponse', (data) => {
      if (data.success) {
        setPaused(true);
        setIndexingMessage('Indexing paused');
      }
    });
    const unsubscribeResume = onMessageCommand('resumeIndexingResponse', (data) => {
      if (data.success) {
        setPaused(false);
        setIndexingMessage('Resuming indexing...');
      }
    });

    return () => {
      unsubscribeProgress();
      unsubscribeComplete();
      unsubscribeError();
      unsubscribePause();
      unsubscribeResume();
    };
  }, [setIndexingProgress, setIndexingMessage, setFilesProcessed, setCurrentFile, completeIndexing]);

  const handlePauseIndexing = () => {
    postMessage('pauseIndexing');
  };

  const handleResumeIndexing = () => {
    postMessage('resumeIndexing');
  };

  const handleGoToQuery = () => {
    setCurrentView('query');
  };

  const handleRetryIndexing = () => {
    postMessage('retryIndexing');
  };

  const handleOpenSettings = () => {
    postMessage('openSettings');
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
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <DocumentSearch24Regular />
        </div>
        <Text size={800} weight="bold" className={styles.title}>
          {isCompleted ? 'Indexing Complete' : 'Indexing Workspace'}
        </Text>
        <Body1 className={styles.description}>
          {isCompleted
            ? 'Your workspace has been successfully indexed and is ready for intelligent search.'
            : 'Processing your workspace files to create a searchable index...'
          }
        </Body1>
      </div>

      {/* Main Content Card */}
      <Card className={styles.mainCard}>
        {/* Progress Section */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <Text size={500} weight="semibold">
              Indexing Progress
            </Text>
            <Badge
              appearance="filled"
              color={isCompleted ? 'success' : 'brand'}
              className={styles.progressBadge}
            >
              {Math.round(indexingState.progress)}%
            </Badge>
          </div>

          <ProgressBar
            value={indexingState.progress / 100}
            className={styles.progressBar}
            color={isCompleted ? 'success' : 'brand'}
          />

          {indexingState.message && (
            <div className={styles.statusMessage}>
              <Clock24Regular />
              <Caption1>{indexingState.message}</Caption1>
            </div>
          )}
        </div>

        {/* Current File Processing */}
        {indexingState.isIndexing && indexingState.currentFile && (
          <>
            <div className={styles.currentFileSection}>
              <div className={styles.currentFileHeader}>
                <Spinner size="small" />
                <Text size={400} weight="semibold">Currently Processing</Text>
              </div>
              <div className={styles.fileName}>
                {indexingState.currentFile}
              </div>
            </div>
            <Divider className={styles.divider} />
          </>
        )}

        {/* Statistics Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <DocumentBulletList24Regular />
            </div>
            <div className={styles.statValue}>
              {indexingState.filesProcessed}
            </div>
            <div className={styles.statLabel}>
              Files Processed
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <DocumentSearch24Regular />
            </div>
            <div className={styles.statValue}>
              {indexingState.totalFiles}
            </div>
            <div className={styles.statLabel}>
              Total Files
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <DocumentBulletList24Regular />
            </div>
            <div className={styles.statValue}>
              {indexingState.stats.chunksCreated}
            </div>
            <div className={styles.statLabel}>
              Chunks Created
            </div>
          </div>

          {indexingState.stats.duration > 0 && (
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Clock24Regular />
              </div>
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
          <>
            <Divider className={styles.divider} />
            <div className={styles.completionSection}>
              {hasErrors ? (
                <>
                  <div className={mergeClasses(styles.completionIcon, styles.warningIcon)}>
                    <Warning24Regular />
                  </div>
                  <Text className={styles.completionMessage}>
                    Completed with {indexingState.stats.errors.length} warning(s)
                  </Text>
                </>
              ) : (
                <>
                  <div className={mergeClasses(styles.completionIcon, styles.successIcon)}>
                    <CheckmarkCircle24Regular />
                  </div>
                  <Text className={styles.completionMessage}>
                    Successfully completed!
                  </Text>
                </>
              )}
            </div>
          </>
        )}

        {/* Error Details */}
        {hasErrors && (
          <div className={styles.errorDetails}>
            <div className={styles.errorHeader}>
              <ErrorCircle24Regular />
              <Text>Issues encountered during indexing:</Text>
            </div>
            <div className={styles.errorList}>
              {indexingState.stats.errors.map((error, index) => (
                <div key={index} className={styles.errorItem}>
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className={styles.actions}>
        {indexingState.isIndexing ? (
          indexingState.isPaused ? (
            <Button
              appearance="primary"
              size="large"
              icon={<Play24Regular />}
              onClick={handleResumeIndexing}
            >
              Resume Indexing
            </Button>
          ) : (
            <Button
              appearance="secondary"
              size="large"
              icon={<Stop24Regular />}
              onClick={handlePauseIndexing}
            >
              Pause Indexing
            </Button>
          )
        ) : isCompleted ? (
          <>
            <Button
              appearance="primary"
              size="large"
              icon={<DocumentSearch24Regular />}
              onClick={handleGoToQuery}
            >
              Start Searching
            </Button>
            <Button
              appearance="secondary"
              size="large"
              icon={<Settings24Regular />}
              onClick={handleOpenSettings}
            >
              Manage Settings
            </Button>
            {hasErrors && (
              <Button
                appearance="secondary"
                size="large"
                onClick={handleRetryIndexing}
              >
                Retry Indexing
              </Button>
            )}
          </>
        ) : (
          <Button
            appearance="primary"
            size="large"
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
