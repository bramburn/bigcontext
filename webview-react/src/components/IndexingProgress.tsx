/**
 * Indexing Progress Component
 * 
 * This component provides a user interface for monitoring and controlling
 * the indexing process in the RAG for LLM VS Code extension. It displays
 * real-time progress information, statistics, and provides controls for
 * starting, pausing, resuming, and stopping indexing operations.
 * 
 * The component follows Fluent UI design patterns and integrates with the
 * VS Code webview communication system for indexing control and status updates.
 */

import React, { useState, useEffect } from 'react';
import {
  Stack,
  ProgressIndicator,
  Text,
  PrimaryButton,
  DefaultButton,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Label,
  Separator,
  DetailsList,
  IColumn,
  SelectionMode,
  Icon,
  TooltipHost,
} from '@fluentui/react';
import { postMessageToVsCode } from '../utils/vscode';

/**
 * Indexing progress interface
 */
interface IndexingProgress {
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Paused' | 'Error';
  percentageComplete: number;
  chunksIndexed: number;
  totalFiles?: number;
  filesProcessed?: number;
  timeElapsed?: number;
  estimatedTimeRemaining?: number;
  errorsEncountered?: number;
}

/**
 * Component state interface
 */
interface IndexingProgressState {
  progress: IndexingProgress;
  isLoading: boolean;
  isOperating: boolean;
  message: {
    type: MessageBarType;
    text: string;
  } | null;
  lastUpdate: Date | null;
  statistics: {
    totalSessions: number;
    totalFilesProcessed: number;
    totalChunksCreated: number;
    averageProcessingTime: number;
    successRate: number;
  };
}

/**
 * IndexingProgress Component Props
 */
interface IndexingProgressProps {
  /** Callback when indexing status changes */
  onStatusChange?: (status: string) => void;
  
  /** Whether to show detailed statistics */
  showStatistics?: boolean;
  
  /** Whether to auto-refresh status */
  autoRefresh?: boolean;
  
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
}

/**
 * Default progress state
 */
const DEFAULT_PROGRESS: IndexingProgress = {
  status: 'Not Started',
  percentageComplete: 0,
  chunksIndexed: 0,
  totalFiles: 0,
  filesProcessed: 0,
  timeElapsed: 0,
  estimatedTimeRemaining: 0,
  errorsEncountered: 0,
};

/**
 * IndexingProgress Component
 */
export const IndexingProgress: React.FC<IndexingProgressProps> = ({
  onStatusChange,
  showStatistics = true,
  autoRefresh = true,
  refreshInterval = 2000,
}) => {
  const [state, setState] = useState<IndexingProgressState>({
    progress: DEFAULT_PROGRESS,
    isLoading: false,
    isOperating: false,
    message: null,
    lastUpdate: null,
    statistics: {
      totalSessions: 0,
      totalFilesProcessed: 0,
      totalChunksCreated: 0,
      averageProcessingTime: 0,
      successRate: 0,
    },
  });

  /**
   * Load initial status and set up auto-refresh
   */
  useEffect(() => {
    loadIndexingStatus();

    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(loadIndexingStatus, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval]);

  /**
   * Notify parent of status changes
   */
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(state.progress.status);
    }
  }, [state.progress.status, onStatusChange]);

  /**
   * Load current indexing status
   */
  const loadIndexingStatus = async () => {
    if (state.isOperating) return; // Don't refresh during operations

    try {
      postMessageToVsCode({
        command: 'getIndexingStatus',
        requestId: `getIndexingStatus_${Date.now()}`,
      });
    } catch (error) {
      console.error('Failed to load indexing status:', error);
    }
  };

  /**
   * Start indexing process
   */
  const startIndexing = async () => {
    setState(prev => ({ ...prev, isOperating: true, message: null }));

    try {
      postMessageToVsCode({
        command: 'postIndexingStart',
        action: 'start',
        requestId: `startIndexing_${Date.now()}`,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOperating: false,
        message: {
          type: MessageBarType.error,
          text: `Failed to start indexing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      }));
    }
  };

  /**
   * Pause indexing process
   */
  const pauseIndexing = async () => {
    setState(prev => ({ ...prev, isOperating: true, message: null }));

    try {
      postMessageToVsCode({
        command: 'postIndexingStart',
        action: 'pause',
        requestId: `pauseIndexing_${Date.now()}`,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOperating: false,
        message: {
          type: MessageBarType.error,
          text: `Failed to pause indexing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      }));
    }
  };

  /**
   * Resume indexing process
   */
  const resumeIndexing = async () => {
    setState(prev => ({ ...prev, isOperating: true, message: null }));

    try {
      postMessageToVsCode({
        command: 'postIndexingStart',
        action: 'resume',
        requestId: `resumeIndexing_${Date.now()}`,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOperating: false,
        message: {
          type: MessageBarType.error,
          text: `Failed to resume indexing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      }));
    }
  };

  /**
   * Stop indexing process
   */
  const stopIndexing = async () => {
    setState(prev => ({ ...prev, isOperating: true, message: null }));

    try {
      postMessageToVsCode({
        command: 'postIndexingStart',
        action: 'stop',
        requestId: `stopIndexing_${Date.now()}`,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOperating: false,
        message: {
          type: MessageBarType.error,
          text: `Failed to stop indexing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      }));
    }
  };

  /**
   * Format time duration
   */
  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
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

  /**
   * Get status icon and color
   */
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Not Started':
        return { icon: 'CircleRing', color: '#666', text: 'Ready to start' };
      case 'In Progress':
        return { icon: 'ProgressRingDots', color: '#0078d4', text: 'Indexing in progress' };
      case 'Completed':
        return { icon: 'CheckMark', color: '#107c10', text: 'Indexing completed' };
      case 'Paused':
        return { icon: 'Pause', color: '#ff8c00', text: 'Indexing paused' };
      case 'Error':
        return { icon: 'ErrorBadge', color: '#d13438', text: 'Indexing failed' };
      default:
        return { icon: 'Unknown', color: '#666', text: 'Unknown status' };
    }
  };

  const statusDisplay = getStatusDisplay(state.progress.status);

  /**
   * Statistics columns for DetailsList
   */
  const statisticsColumns: IColumn[] = [
    {
      key: 'metric',
      name: 'Metric',
      fieldName: 'metric',
      minWidth: 150,
      maxWidth: 200,
    },
    {
      key: 'value',
      name: 'Value',
      fieldName: 'value',
      minWidth: 100,
      maxWidth: 150,
    },
  ];

  const statisticsItems = [
    { metric: 'Total Files Processed', value: state.statistics.totalFilesProcessed.toLocaleString() },
    { metric: 'Total Chunks Created', value: state.statistics.totalChunksCreated.toLocaleString() },
    { metric: 'Average Processing Time', value: `${state.statistics.averageProcessingTime.toFixed(2)}ms` },
    { metric: 'Success Rate', value: `${state.statistics.successRate.toFixed(1)}%` },
    { metric: 'Total Sessions', value: state.statistics.totalSessions.toString() },
  ];

  return (
    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20, maxWidth: 800 } }}>
      {/* Header */}
      <Stack>
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
          Indexing Progress
        </Text>
        <Text variant="medium" styles={{ root: { color: '#666' } }}>
          Monitor and control the code indexing process
        </Text>
      </Stack>

      {/* Message Bar */}
      {state.message && (
        <MessageBar
          messageBarType={state.message.type}
          onDismiss={() => setState(prev => ({ ...prev, message: null }))}
        >
          {state.message.text}
        </MessageBar>
      )}

      {/* Status Section */}
      <Stack tokens={{ childrenGap: 15 }}>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
          <Icon
            iconName={statusDisplay.icon}
            styles={{ root: { fontSize: 20, color: statusDisplay.color } }}
          />
          <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
            {statusDisplay.text}
          </Text>
          {state.progress.status === 'In Progress' && (
            <Spinner size={SpinnerSize.small} />
          )}
        </Stack>

        {/* Progress Bar */}
        {(state.progress.status === 'In Progress' || state.progress.status === 'Paused') && (
          <ProgressIndicator
            percentComplete={state.progress.percentageComplete / 100}
            description={`${state.progress.percentageComplete.toFixed(1)}% complete`}
          />
        )}

        {/* Progress Details */}
        <Stack horizontal tokens={{ childrenGap: 30 }}>
          <Stack tokens={{ childrenGap: 5 }}>
            <Label>Files Processed</Label>
            <Text variant="large">
              {state.progress.filesProcessed?.toLocaleString() || 0}
              {state.progress.totalFiles ? ` / ${state.progress.totalFiles.toLocaleString()}` : ''}
            </Text>
          </Stack>

          <Stack tokens={{ childrenGap: 5 }}>
            <Label>Chunks Indexed</Label>
            <Text variant="large">{state.progress.chunksIndexed.toLocaleString()}</Text>
          </Stack>

          {state.progress.timeElapsed !== undefined && state.progress.timeElapsed > 0 && (
            <Stack tokens={{ childrenGap: 5 }}>
              <Label>Time Elapsed</Label>
              <Text variant="large">{formatDuration(state.progress.timeElapsed)}</Text>
            </Stack>
          )}

          {state.progress.estimatedTimeRemaining !== undefined && state.progress.estimatedTimeRemaining > 0 && (
            <Stack tokens={{ childrenGap: 5 }}>
              <Label>Estimated Remaining</Label>
              <Text variant="large">{formatDuration(state.progress.estimatedTimeRemaining)}</Text>
            </Stack>
          )}
        </Stack>

        {/* Error Count */}
        {state.progress.errorsEncountered !== undefined && state.progress.errorsEncountered > 0 && (
          <MessageBar messageBarType={MessageBarType.warning}>
            {state.progress.errorsEncountered} error(s) encountered during indexing
          </MessageBar>
        )}
      </Stack>

      {/* Control Buttons */}
      <Stack horizontal tokens={{ childrenGap: 10 }} horizontalAlign="start">
        {state.progress.status === 'Not Started' || state.progress.status === 'Completed' || state.progress.status === 'Error' ? (
          <PrimaryButton
            text="Start Indexing"
            onClick={startIndexing}
            disabled={state.isOperating}
            iconProps={{ iconName: 'Play' }}
          />
        ) : null}

        {state.progress.status === 'In Progress' && (
          <>
            <DefaultButton
              text="Pause"
              onClick={pauseIndexing}
              disabled={state.isOperating}
              iconProps={{ iconName: 'Pause' }}
            />
            <DefaultButton
              text="Stop"
              onClick={stopIndexing}
              disabled={state.isOperating}
              iconProps={{ iconName: 'Stop' }}
            />
          </>
        )}

        {state.progress.status === 'Paused' && (
          <>
            <PrimaryButton
              text="Resume"
              onClick={resumeIndexing}
              disabled={state.isOperating}
              iconProps={{ iconName: 'Play' }}
            />
            <DefaultButton
              text="Stop"
              onClick={stopIndexing}
              disabled={state.isOperating}
              iconProps={{ iconName: 'Stop' }}
            />
          </>
        )}

        <DefaultButton
          text="Refresh"
          onClick={loadIndexingStatus}
          disabled={state.isOperating}
          iconProps={{ iconName: 'Refresh' }}
        />
      </Stack>

      {/* Statistics Section */}
      {showStatistics && (
        <>
          <Separator />
          <Stack tokens={{ childrenGap: 15 }}>
            <Label styles={{ root: { fontSize: 16, fontWeight: 600 } }}>
              Indexing Statistics
            </Label>
            
            <DetailsList
              items={statisticsItems}
              columns={statisticsColumns}
              selectionMode={SelectionMode.none}
              compact
            />
          </Stack>
        </>
      )}

      {/* Last Update */}
      {state.lastUpdate && (
        <Text variant="small" styles={{ root: { color: '#666', textAlign: 'center' } }}>
          Last updated: {state.lastUpdate.toLocaleTimeString()}
        </Text>
      )}
    </Stack>
  );
};
