import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { Switch } from '../ui/Switch';
import { Progress } from '../ui/Progress';
import { Toast, ToastProvider, ToastViewport } from '../ui/Toast';
import { Tooltip } from '../ui/Tooltip';
import { useTheme } from '../providers/ThemeProvider';

/**
 * Component showcase for testing all UI components
 * This view displays all available components for visual testing and verification
 */
export default function ComponentTestView() {
  const { theme, setTheme, isDark, isHighContrast } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [progressValue, setProgressValue] = useState(50);
  const [showToast, setShowToast] = useState(false);

  return (
    <ToastProvider>
      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        <div className="border-b border-[var(--vscode-panel-border)] pb-4">
          <h1 className="text-2xl font-bold text-[var(--vscode-foreground)]">
            Component Showcase
          </h1>
          <p className="text-sm text-[var(--vscode-descriptionForeground,#a6a6a6)] mt-2">
            Visual testing for all UI components with current theme: {theme}
          </p>
        </div>

        {/* Theme Controls */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--vscode-foreground)]">
            Theme Controls
          </h2>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
            >
              Light
            </Button>
            <Button 
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
            >
              Dark
            </Button>
            <Button 
              variant={theme === 'high-contrast' ? 'default' : 'outline'}
              onClick={() => setTheme('high-contrast')}
            >
              High Contrast
            </Button>
            <Button 
              variant={theme === 'high-contrast-light' ? 'default' : 'outline'}
              onClick={() => setTheme('high-contrast-light')}
            >
              High Contrast Light
            </Button>
          </div>
          <div className="text-sm space-y-1">
            <p>Is Dark: {isDark ? 'Yes' : 'No'}</p>
            <p>Is High Contrast: {isHighContrast ? 'Yes' : 'No'}</p>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--vscode-foreground)]">
            Buttons
          </h2>
          <div className="flex gap-2 flex-wrap">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">🔍</Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>Disabled Secondary</Button>
          </div>
        </section>

        {/* Form Controls */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--vscode-foreground)]">
            Form Controls
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-input">Text Input</Label>
              <Input
                id="test-input"
                placeholder="Enter some text..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-select">Select</Label>
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an option..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                  <SelectItem value="option4" disabled>Disabled Option</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="test-checkbox"
                checked={checkboxChecked}
                onCheckedChange={setCheckboxChecked}
              />
              <Label htmlFor="test-checkbox">Checkbox</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="test-switch"
                checked={switchChecked}
                onCheckedChange={setSwitchChecked}
              />
              <Label htmlFor="test-switch">Switch</Label>
            </div>
          </div>
        </section>

        {/* Progress */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--vscode-foreground)]">
            Progress
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress: {progressValue}%</span>
              <div className="space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => setProgressValue(Math.max(0, progressValue - 10))}
                >
                  -10
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setProgressValue(Math.min(100, progressValue + 10))}
                >
                  +10
                </Button>
              </div>
            </div>
            <Progress value={progressValue} className="w-full" />
          </div>
        </section>

        {/* Toast */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--vscode-foreground)]">
            Toast Notifications
          </h2>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowToast(true)}>
              Show Toast
            </Button>
          </div>
          {showToast && (
            <Toast>
              <div className="grid gap-1">
                <div className="text-sm font-semibold">Test Toast</div>
                <div className="text-sm opacity-90">
                  This is a test toast notification.
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowToast(false)}
              >
                Close
              </Button>
            </Toast>
          )}
        </section>

        {/* Tooltips */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--vscode-foreground)]">
            Tooltips
          </h2>
          <div className="flex gap-4">
            <Tooltip content="This is a tooltip">
              <Button variant="outline">Hover for tooltip</Button>
            </Tooltip>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--vscode-foreground)]">
            Typography
          </h2>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Heading 1</h1>
            <h2 className="text-xl font-semibold">Heading 2</h2>
            <h3 className="text-lg font-medium">Heading 3</h3>
            <p className="text-base">Regular paragraph text</p>
            <p className="text-sm">Small text</p>
            <p className="text-xs">Extra small text</p>
            <code className="bg-[var(--vscode-textCodeBlock-background,#1e1e1e)] px-2 py-1 rounded text-sm font-mono">
              Code snippet
            </code>
          </div>
        </section>

        {/* Color Swatches */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--vscode-foreground)]">
            Color Swatches
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-12 bg-[var(--vscode-button-background)] rounded"></div>
              <p className="text-xs">Button Background</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded"></div>
              <p className="text-xs">Editor Background</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 bg-[var(--vscode-list-hoverBackground)] rounded"></div>
              <p className="text-xs">Hover Background</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 bg-[var(--vscode-errorForeground)] rounded"></div>
              <p className="text-xs">Error Color</p>
            </div>
          </div>
        </section>

        {/* CSS Variables Debug */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--vscode-foreground)]">
            CSS Variables Debug
          </h2>
          <div className="bg-[var(--vscode-textCodeBlock-background,#1e1e1e)] p-4 rounded text-xs font-mono space-y-1 max-h-64 overflow-y-auto">
            {Object.entries({
              '--vscode-foreground': getComputedStyle(document.documentElement).getPropertyValue('--vscode-foreground'),
              '--vscode-editor-background': getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background'),
              '--vscode-panel-border': getComputedStyle(document.documentElement).getPropertyValue('--vscode-panel-border'),
              '--vscode-button-background': getComputedStyle(document.documentElement).getPropertyValue('--vscode-button-background'),
              '--vscode-focusBorder': getComputedStyle(document.documentElement).getPropertyValue('--vscode-focusBorder'),
            }).map(([key, value]) => (
              <div key={key}>
                <span className="text-blue-400">{key}:</span> {value || 'not defined'}
              </div>
            ))}
          </div>
        </section>
      </div>
      <ToastViewport />
    </ToastProvider>
  );
}
