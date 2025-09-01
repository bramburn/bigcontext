/**
 * Setup Instructions Component
 * 
 * Reusable component for displaying formatted setup instructions with copy functionality
 */

import React, { useState } from 'react';
import {
  Text,
  Button,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { Copy24Regular, CheckmarkCircle24Regular, Link24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  instructionStep: {
    marginBottom: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  stepNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    marginRight: tokens.spacingHorizontalS,
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalXS,
  },
  stepContent: {
    marginLeft: '32px', // Align with step number
  },
  codeBlock: {
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalS,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    margin: `${tokens.spacingVerticalXS} 0`,
    position: 'relative',
    overflow: 'auto',
  },
  copyButton: {
    position: 'absolute',
    top: tokens.spacingVerticalXS,
    right: tokens.spacingVerticalXS,
    minWidth: 'auto',
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
  },
  linkButton: {
    marginTop: tokens.spacingVerticalXS,
    minWidth: 'auto',
  },
  note: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorPaletteYellowBackground1,
    border: `1px solid ${tokens.colorPaletteYellowBorder1}`,
    borderRadius: tokens.borderRadiusSmall,
    marginTop: tokens.spacingVerticalS,
  },
  warning: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorPaletteRedBackground1,
    border: `1px solid ${tokens.colorPaletteRedBorder1}`,
    borderRadius: tokens.borderRadiusSmall,
    marginTop: tokens.spacingVerticalS,
  },
});

export interface SetupStep {
  title: string;
  description?: string;
  command?: string;
  note?: string;
  warning?: string;
  link?: {
    url: string;
    text: string;
  };
}

interface SetupInstructionsProps {
  steps: SetupStep[];
  title?: string;
}

export const SetupInstructions: React.FC<SetupInstructionsProps> = ({
  steps,
  title
}) => {
  const styles = useStyles();
  const [copiedCommands, setCopiedCommands] = useState<Set<number>>(new Set());

  const copyToClipboard = async (text: string, stepIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommands(prev => new Set(prev).add(stepIndex));
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedCommands(prev => {
          const newSet = new Set(prev);
          newSet.delete(stepIndex);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const openLink = (url: string) => {
    // In VS Code webview, we need to post a message to open external links
    if (window.acquireVsCodeApi) {
      const vscode = window.acquireVsCodeApi();
      vscode.postMessage({
        command: 'openExternalLink',
        url: url
      });
    } else {
      // Fallback for development
      window.open(url, '_blank');
    }
  };

  return (
    <div>
      {title && (
        <Text size={500} weight="semibold" style={{ marginBottom: tokens.spacingVerticalM }}>
          {title}
        </Text>
      )}
      
      {steps.map((step, index) => (
        <div key={index} className={styles.instructionStep}>
          <div className={styles.stepHeader}>
            <div className={styles.stepNumber}>{index + 1}</div>
            <Text weight="semibold">{step.title}</Text>
          </div>
          
          <div className={styles.stepContent}>
            {step.description && (
              <Text size={300} style={{ marginBottom: tokens.spacingVerticalXS }}>
                {step.description}
              </Text>
            )}
            
            {step.command && (
              <div className={styles.codeBlock}>
                <code>{step.command}</code>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={copiedCommands.has(index) ? <CheckmarkCircle24Regular /> : <Copy24Regular />}
                  onClick={() => copyToClipboard(step.command!, index)}
                  className={styles.copyButton}
                  title="Copy command"
                />
              </div>
            )}
            
            {step.link && (
              <Button
                appearance="subtle"
                size="small"
                icon={<Link24Regular />}
                onClick={() => openLink(step.link!.url)}
                className={styles.linkButton}
              >
                {step.link.text}
              </Button>
            )}
            
            {step.note && (
              <div className={styles.note}>
                <Text size={200}>
                  <strong>Note:</strong> {step.note}
                </Text>
              </div>
            )}
            
            {step.warning && (
              <div className={styles.warning}>
                <Text size={200}>
                  <strong>Warning:</strong> {step.warning}
                </Text>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SetupInstructions;
