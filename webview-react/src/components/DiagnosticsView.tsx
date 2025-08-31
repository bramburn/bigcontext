/**
 * DiagnosticsView Component
 * 
 * System diagnostics and health monitoring view.
 * Shows connection status, system stats, and troubleshooting tools.
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  Button,
  Text,
  Body1,
  Caption1,
  Badge,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  Shield24Regular,
  ArrowClockwise24Regular,
  Database24Regular,
  Bot24Regular,
  DocumentSearch24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular
} from '@fluentui/react-icons';
import { SystemStatus } from '../types';
import { postMessage, onMessageCommand } from '../utils/vscodeApi';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalL,
    maxWidth: '1000px',
    margin: '0 auto'
  },
  header: {
    marginBottom: tokens.spacingVerticalL,
    textAlign: 'center'
  },
  title: {
    marginBottom: tokens.spacingVerticalS
  },
  description: {
    color: tokens.colorNeutralForeground2
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalL
  },
  statusCard: {
    padding: tokens.spacingVerticalL
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalM
  },
  statusTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  statusIcon: {
    fontSize: '20px'
  },
  statusDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  statusItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statsCard: {
    padding: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM
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
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL
  },
  troubleshootCard: {
    padding: tokens.spacingVerticalL,
    marginTop: tokens.spacingVerticalL
  },
  troubleshootItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '&:last-child': {
      borderBottom: 'none'
    }
  }
});

const getStatusBadge = (status: 'unknown' | 'connected' | 'error') => {
  switch (status) {
    case 'connected':
      return (
        <Badge appearance="filled" color="success" icon={<CheckmarkCircle24Regular />}>
          Connected
        </Badge>
      );
    case 'error':
      return (
        <Badge appearance="filled" color="danger" icon={<ErrorCircle24Regular />}>
          Error
        </Badge>
      );
    default:
      return (
        <Badge appearance="filled" color="warning" icon={<Warning24Regular />}>
          Unknown
        </Badge>
      );
  }
};

export const DiagnosticsView: React.FC = () => {
  const styles = useStyles();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'unknown',
    provider: 'unknown',
    lastIndexed: null,
    totalChunks: 0,
    lastError: null
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set up message listeners for system status updates
  useEffect(() => {
    const unsubscribeStatus = onMessageCommand('serviceStatusResponse', (message) => {
      const status = message.data || message.status || message;
      setSystemStatus(status);
      setIsRefreshing(false);
    });

    // Request initial status
    postMessage('getServiceStatus');

    return () => {
      unsubscribeStatus();
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    postMessage('getSystemStatus');
  };

  const handleTestDatabase = () => {
    postMessage('testDatabaseConnection');
  };

  const handleTestProvider = () => {
    postMessage('testProviderConnection');
  };

  const handleReindex = () => {
    postMessage('startReindexing');
  };

  const handleClearIndex = () => {
    postMessage('clearIndex');
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={800} weight="bold" className={styles.title}>
          <Shield24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
          System Diagnostics
        </Text>
        <Body1 className={styles.description}>
          Monitor system health and troubleshoot connection issues.
        </Body1>
      </div>

      {/* System Status */}
      <div className={styles.statusGrid}>
        {/* Database Status */}
        <Card className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <div className={styles.statusTitle}>
              <Database24Regular className={styles.statusIcon} />
              <Text size={500} weight="semibold">Database</Text>
            </div>
            {getStatusBadge(systemStatus.database)}
          </div>
          <div className={styles.statusDetails}>
            <div className={styles.statusItem}>
              <Caption1>Total Chunks:</Caption1>
              <Text size={300}>{systemStatus.totalChunks.toLocaleString()}</Text>
            </div>
            <div className={styles.statusItem}>
              <Caption1>Last Indexed:</Caption1>
              <Text size={300}>{formatDate(systemStatus.lastIndexed)}</Text>
            </div>
          </div>
          <Button
            appearance="secondary"
            size="small"
            onClick={handleTestDatabase}
            style={{ marginTop: tokens.spacingVerticalM }}
          >
            Test Connection
          </Button>
        </Card>

        {/* AI Provider Status */}
        <Card className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <div className={styles.statusTitle}>
              <Bot24Regular className={styles.statusIcon} />
              <Text size={500} weight="semibold">AI Provider</Text>
            </div>
            {getStatusBadge(systemStatus.provider)}
          </div>
          <div className={styles.statusDetails}>
            <div className={styles.statusItem}>
              <Caption1>Status:</Caption1>
              <Text size={300}>
                {systemStatus.provider === 'connected' ? 'Ready' : 'Not Available'}
              </Text>
            </div>
          </div>
          <Button
            appearance="secondary"
            size="small"
            onClick={handleTestProvider}
            style={{ marginTop: tokens.spacingVerticalM }}
          >
            Test Connection
          </Button>
        </Card>
      </div>

      {/* System Statistics */}
      <Card className={styles.statsCard}>
        <CardHeader
          header={
            <Text size={500} weight="semibold">
              <DocumentSearch24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
              System Statistics
            </Text>
          }
        />
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {systemStatus.totalChunks.toLocaleString()}
            </div>
            <div className={styles.statLabel}>
              Total Chunks
            </div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {systemStatus.database === 'connected' ? '✓' : '✗'}
            </div>
            <div className={styles.statLabel}>
              Database Status
            </div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {systemStatus.provider === 'connected' ? '✓' : '✗'}
            </div>
            <div className={styles.statLabel}>
              Provider Status
            </div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {systemStatus.lastIndexed ? '✓' : '✗'}
            </div>
            <div className={styles.statLabel}>
              Index Status
            </div>
          </div>
        </div>
      </Card>

      {/* Error Information */}
      {systemStatus.lastError && (
        <Card className={styles.statusCard} style={{ backgroundColor: tokens.colorPaletteRedBackground1 }}>
          <CardHeader
            header={
              <Text size={500} weight="semibold" style={{ color: tokens.colorPaletteRedForeground1 }}>
                <ErrorCircle24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
                Last Error
              </Text>
            }
          />
          <Text size={300} style={{ color: tokens.colorPaletteRedForeground1 }}>
            {systemStatus.lastError}
          </Text>
        </Card>
      )}

      {/* Troubleshooting Tools */}
      <Card className={styles.troubleshootCard}>
        <CardHeader
          header={
            <Text size={500} weight="semibold">
              Troubleshooting Tools
            </Text>
          }
        />
        
        <div className={styles.troubleshootItem}>
          <div>
            <Text size={400} weight="semibold">Refresh System Status</Text>
            <Caption1>Update all connection and system status information</Caption1>
          </div>
          <Button
            appearance="secondary"
            icon={<ArrowClockwise24Regular />}
            disabled={isRefreshing}
            onClick={handleRefresh}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className={styles.troubleshootItem}>
          <div>
            <Text size={400} weight="semibold">Reindex Workspace</Text>
            <Caption1>Rebuild the search index from scratch</Caption1>
          </div>
          <Button
            appearance="secondary"
            onClick={handleReindex}
          >
            Reindex
          </Button>
        </div>

        <div className={styles.troubleshootItem}>
          <div>
            <Text size={400} weight="semibold">Clear Index</Text>
            <Caption1>Remove all indexed data (requires reindexing)</Caption1>
          </div>
          <Button
            appearance="secondary"
            onClick={handleClearIndex}
          >
            Clear Index
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DiagnosticsView;
