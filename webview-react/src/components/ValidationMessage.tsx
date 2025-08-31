/**
 * ValidationMessage Component
 * 
 * Displays validation messages with appropriate styling and icons.
 * Supports error, warning, and success message types.
 */

import React from 'react';
import {
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { 
  ErrorCircle16Regular, 
  Warning16Regular, 
  CheckmarkCircle16Regular,
  Info16Regular
} from '@fluentui/react-icons';

export type MessageType = 'error' | 'warning' | 'success' | 'info';

interface ValidationMessageProps {
  message: string;
  type: MessageType;
  suggestions?: string[];
  className?: string;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusSmall
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    backgroundColor: tokens.colorPaletteRedBackground1
  },
  warning: {
    color: tokens.colorPaletteYellowForeground1,
    backgroundColor: tokens.colorPaletteYellowBackground1
  },
  success: {
    color: tokens.colorPaletteGreenForeground1,
    backgroundColor: tokens.colorPaletteGreenBackground1
  },
  info: {
    color: tokens.colorPaletteBlueForeground2,
    backgroundColor: tokens.colorPaletteBlueBackground2
  },
  icon: {
    marginTop: '2px', // Align with text baseline
    flexShrink: 0
  },
  content: {
    flex: 1
  },
  message: {
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200
  },
  suggestions: {
    marginTop: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM
  },
  suggestion: {
    fontSize: tokens.fontSizeBase100,
    lineHeight: tokens.lineHeightBase100,
    marginBottom: tokens.spacingVerticalXXS,
    '&:before': {
      content: '"• "',
      marginRight: tokens.spacingHorizontalXS
    }
  }
});

const getIcon = (type: MessageType) => {
  switch (type) {
    case 'error':
      return <ErrorCircle16Regular />;
    case 'warning':
      return <Warning16Regular />;
    case 'success':
      return <CheckmarkCircle16Regular />;
    case 'info':
      return <Info16Regular />;
    default:
      return <Info16Regular />;
  }
};

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  message,
  type,
  suggestions = [],
  className
}) => {
  const styles = useStyles();

  const containerClass = `${styles.container} ${styles[type]} ${className || ''}`;

  return (
    <div className={containerClass} role="alert" aria-live="polite">
      <div className={styles.icon}>
        {getIcon(type)}
      </div>
      <div className={styles.content}>
        <Text className={styles.message}>
          {message}
        </Text>
        {suggestions.length > 0 && (
          <div className={styles.suggestions}>
            {suggestions.map((suggestion, index) => (
              <div key={index} className={styles.suggestion}>
                <Text size={200}>
                  {suggestion}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationMessage;
