/**
 * SettingsView Component
 * 
 * Provides a comprehensive settings interface for the Code Context Engine extension.
 * Includes privacy controls, telemetry settings, and other configuration options.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Button,
  Text,
  Body1,
  Switch,
  makeStyles,
  tokens,
  Divider,
  Field,
  Input,
  Dropdown,
  Option
} from '@fluentui/react-components';
import { Settings24Regular, Save24Regular, Shield24Regular } from '@fluentui/react-icons';
import { postMessage, onMessageCommand } from '../utils/vscodeApi';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXL,
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalXL
  },
  section: {
    marginBottom: tokens.spacingVerticalXL
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
    fontWeight: tokens.fontWeightSemibold
  },
  card: {
    padding: tokens.spacingVerticalL
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
    '&:last-child': {
      marginBottom: 0
    }
  },
  settingInfo: {
    flex: 1,
    marginRight: tokens.spacingHorizontalM
  },
  settingDescription: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalXS
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalXL
  },
  privacySection: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium
  }
});

interface SettingsConfig {
  enableTelemetry: boolean;
  maxResults: number;
  minSimilarity: number;
  indexingIntensity: 'low' | 'medium' | 'high';
  autoIndex: boolean;
  compactMode: boolean;
  showAdvancedOptions: boolean;
}

export const SettingsView: React.FC = () => {
  const styles = useStyles();
  const [settings, setSettings] = useState<SettingsConfig>({
    enableTelemetry: true, // Default to opt-out (true means enabled)
    maxResults: 20,
    minSimilarity: 0.5,
    indexingIntensity: 'medium',
    autoIndex: false,
    compactMode: false,
    showAdvancedOptions: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        postMessage({
          command: 'getSettings'
        });
      } catch (error) {
        console.error('Failed to load settings:', error);
        setIsLoading(false);
      }
    };

    loadSettings();

    // Listen for settings response
    const handleMessage = onMessageCommand('settingsLoaded', (data: SettingsConfig) => {
      setSettings(data);
      setIsLoading(false);
    });

    return () => {
      if (handleMessage) {
        handleMessage();
      }
    };
  }, []);

  const handleSettingChange = useCallback((key: keyof SettingsConfig, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleSaveSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      postMessage({
        command: 'updateSettings',
        data: settings
      });

      // Listen for save confirmation
      const handleSaveResponse = onMessageCommand('settingsSaved', () => {
        setIsSaving(false);
        // Show success notification could be added here
      });

      // Cleanup listener after a timeout
      setTimeout(() => {
        if (handleSaveResponse) {
          handleSaveResponse();
        }
        setIsSaving(false);
      }, 5000);

    } catch (error) {
      console.error('Failed to save settings:', error);
      setIsSaving(false);
    }
  }, [settings]);

  // Keyboard event handler for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Text>Loading settings...</Text>
      </div>
    );
  }

  return (
    <div className={styles.container} role="main" aria-label="Extension Settings">
      {/* Header */}
      <div className={styles.header}>
        <Settings24Regular aria-hidden="true" />
        <Text size={800} as="h1">Extension Settings</Text>
      </div>

      {/* Privacy & Telemetry Section */}
      <section className={styles.section} aria-labelledby="privacy-heading">
        <div className={styles.sectionTitle}>
          <Shield24Regular aria-hidden="true" />
          <Text size={600} as="h2" id="privacy-heading">Privacy & Telemetry</Text>
        </div>
        <Card className={`${styles.card} ${styles.privacySection}`} role="group" aria-labelledby="privacy-heading">
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Text weight="semibold" as="label" htmlFor="telemetry-switch">
                Enable Anonymous Usage Telemetry
              </Text>
              <div className={styles.settingDescription} id="telemetry-description">
                Help improve the extension by sharing anonymous usage data.
                No code content or personal information is collected.
              </div>
            </div>
            <Switch
              id="telemetry-switch"
              checked={settings.enableTelemetry}
              onChange={(_, data) => handleSettingChange('enableTelemetry', data.checked)}
              aria-describedby="telemetry-description"
              aria-label="Enable anonymous usage telemetry"
            />
          </div>
        </Card>
      </section>

      <Divider />

      {/* Search Settings */}
      <section className={styles.section} aria-labelledby="search-heading">
        <Text size={600} className={styles.sectionTitle} as="h2" id="search-heading">
          Search Settings
        </Text>
        <Card className={styles.card} role="group" aria-labelledby="search-heading">
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Text weight="semibold" as="label" htmlFor="max-results-input">
                Maximum Results
              </Text>
              <div className={styles.settingDescription} id="max-results-description">
                Maximum number of search results to display
              </div>
            </div>
            <Field>
              <Input
                id="max-results-input"
                type="number"
                value={settings.maxResults.toString()}
                onChange={(_, data) => handleSettingChange('maxResults', parseInt(data.value) || 20)}
                min={1}
                max={100}
                aria-describedby="max-results-description"
                aria-label="Maximum number of search results"
              />
            </Field>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Text weight="semibold">Minimum Similarity</Text>
              <div className={styles.settingDescription}>
                Minimum similarity threshold for search results (0.0 - 1.0)
              </div>
            </div>
            <Field>
              <Input
                type="number"
                value={settings.minSimilarity.toString()}
                onChange={(_, data) => handleSettingChange('minSimilarity', parseFloat(data.value) || 0.5)}
                min={0}
                max={1}
                step={0.1}
              />
            </Field>
          </div>
        </Card>
      </div>

      {/* Indexing Settings */}
      <div className={styles.section}>
        <Text size={600} className={styles.sectionTitle}>
          Indexing Settings
        </Text>
        <Card className={styles.card}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Text weight="semibold">Indexing Intensity</Text>
              <div className={styles.settingDescription}>
                Controls how thoroughly the codebase is indexed
              </div>
            </div>
            <Dropdown
              value={settings.indexingIntensity}
              selectedOptions={[settings.indexingIntensity]}
              onOptionSelect={(_, data) => handleSettingChange('indexingIntensity', data.optionValue)}
            >
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Dropdown>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Text weight="semibold">Auto-Index on File Changes</Text>
              <div className={styles.settingDescription}>
                Automatically re-index files when they are modified
              </div>
            </div>
            <Switch
              checked={settings.autoIndex}
              onChange={(_, data) => handleSettingChange('autoIndex', data.checked)}
            />
          </div>
        </Card>
      </div>

      {/* UI Settings */}
      <div className={styles.section}>
        <Text size={600} className={styles.sectionTitle}>
          Interface Settings
        </Text>
        <Card className={styles.card}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Text weight="semibold">Compact Mode</Text>
              <div className={styles.settingDescription}>
                Use a more compact layout to save space
              </div>
            </div>
            <Switch
              checked={settings.compactMode}
              onChange={(_, data) => handleSettingChange('compactMode', data.checked)}
            />
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Text weight="semibold">Show Advanced Options</Text>
              <div className={styles.settingDescription}>
                Display advanced configuration options in the interface
              </div>
            </div>
            <Switch
              checked={settings.showAdvancedOptions}
              onChange={(_, data) => handleSettingChange('showAdvancedOptions', data.checked)}
            />
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button
          appearance="primary"
          size="large"
          icon={<Save24Regular aria-hidden="true" />}
          disabled={isSaving}
          onClick={handleSaveSettings}
          aria-describedby="save-status"
          onKeyDown={(e) => handleKeyDown(e, handleSaveSettings)}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Live region for status updates */}
      <div
        id="save-status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
      >
        {isSaving ? 'Saving settings...' : ''}
      </div>
    </div>
  );
};

export default SettingsView;
