/**
 * NoWorkspaceView Component
 * 
 * Displays when no workspace is open in VS Code.
 * Provides a button to open a folder.
 */

import React from 'react';
import {
  Card,
  CardHeader,
  Button,
  Text,
  Body1,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { FolderOpen24Regular } from '@fluentui/react-icons';
import { postMessage } from '../utils/vscodeApi';

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
    maxWidth: '400px',
    padding: tokens.spacingVerticalXL
  },
  header: {
    marginBottom: tokens.spacingVerticalL
  },
  description: {
    marginBottom: tokens.spacingVerticalXL,
    color: tokens.colorNeutralForeground2
  },
  button: {
    minWidth: '140px'
  }
});

export const NoWorkspaceView: React.FC = () => {
  const styles = useStyles();

  const handleOpenFolder = () => {
    postMessage('requestOpenFolder');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenFolder();
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text size={600} weight="semibold" className={styles.header}>
              No Workspace Open
            </Text>
          }
        />
        
        <Body1 className={styles.description}>
          No workspace is open. Please open a folder to use the Code Context Engine.
        </Body1>
        
        <Button
          appearance="primary"
          size="large"
          icon={<FolderOpen24Regular />}
          className={styles.button}
          onClick={handleOpenFolder}
          onKeyDown={handleKeyDown}
        >
          Open Folder
        </Button>
      </Card>
    </div>
  );
};

export default NoWorkspaceView;
