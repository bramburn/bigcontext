/**
 * Progress Display Component
 * 
 * This component displays file scanning progress messages to the user.
 * It shows real-time updates during the file scanning process including
 * start, progress, and completion messages.
 */

import React from 'react';
import {
  Stack,
  Text,
  ProgressBar,
  Spinner,
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Body1,
  Caption1
} from '@fluentui/react-components';
import { DocumentRegular, FolderRegular } from '@fluentui/react-icons';
import { useProgressMessages } from '../hooks/useProgressMessages';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalM,
    gap: tokens.spacingVerticalM,
  },
  card: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  progressContainer: {
    gap: tokens.spacingVerticalS,
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  messageText: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
  },
  completedText: {
    textAlign: 'center',
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
});

export interface ProgressDisplayProps {
  /** Whether to show detailed statistics */
  showStats?: boolean;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  showStats = true,
}) => {
  const styles = useStyles();
  const { progressState } = useProgressMessages();

  const { status, message, scannedFiles, ignoredFiles, totalFiles } = progressState;

  const renderProgressIndicator = () => {
    switch (status) {
      case 'scanning':
        return (
          <Stack className={styles.progressContainer}>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
              <Spinner size="small" />
              <Text variant="medium">Scanning files...</Text>
            </Stack>
            {totalFiles && totalFiles > 0 ? (
              <ProgressBar
                value={scannedFiles}
                max={totalFiles}
                shape="rounded"
              />
            ) : (
              <ProgressBar shape="rounded" />
            )}
          </Stack>
        );
      case 'complete':
        return (
          <Stack className={styles.progressContainer}>
            <Text className={styles.completedText} variant="medium">
              ✓ Scan Complete
            </Text>
          </Stack>
        );
      case 'error':
        return (
          <Stack className={styles.progressContainer}>
            <Text variant="medium" style={{ color: tokens.colorPaletteRedForeground1 }}>
              ⚠ Scan Error
            </Text>
          </Stack>
        );
      default:
        return null;
    }
  };

  const renderStats = () => {
    if (!showStats || status === 'idle') {
      return null;
    }

    return (
      <div className={styles.statsContainer}>
        <div className={styles.statItem}>
          <DocumentRegular fontSize={16} />
          <Stack tokens={{ childrenGap: 2 }}>
            <Caption1>Files Scanned</Caption1>
            <Body1>{totalFiles !== undefined ? totalFiles : scannedFiles}</Body1>
          </Stack>
        </div>
        <div className={styles.statItem}>
          <FolderRegular fontSize={16} />
          <Stack tokens={{ childrenGap: 2 }}>
            <Caption1>Files Ignored</Caption1>
            <Body1>{ignoredFiles}</Body1>
          </Stack>
        </div>
      </div>
    );
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <Stack className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text variant="large" weight="semibold">
              File Scanning Progress
            </Text>
          }
        />
        <CardPreview>
          <Stack tokens={{ childrenGap: 16, padding: 16 }}>
            {renderProgressIndicator()}
            
            {message && (
              <Text 
                className={status === 'complete' ? styles.completedText : styles.messageText}
                variant="medium"
              >
                {message}
              </Text>
            )}
            
            {renderStats()}
          </Stack>
        </CardPreview>
      </Card>
    </Stack>
  );
};

export default ProgressDisplay;
