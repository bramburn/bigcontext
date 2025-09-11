import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';
import { Checkbox } from '../../ui/Checkbox';
import { Switch } from '../../ui/Switch';

expect.extend(toHaveNoViolations);

describe('Radix Components Accessibility', () => {
  it('Button component has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Button>Default Button</Button>
        <Button variant="outline">Outline Button</Button>
        <Button disabled>Disabled Button</Button>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Input with Label has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="test-input">Test Input</Label>
        <Input id="test-input" placeholder="Enter text" />
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Select component has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="test-select">Choose option</Label>
        <Select>
          <SelectTrigger id="test-select">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Checkbox with Label has no accessibility violations', async () => {
    const { container } = render(
      <div className="flex items-center space-x-2">
        <Checkbox id="test-checkbox" />
        <Label htmlFor="test-checkbox">Accept terms</Label>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Switch with Label has no accessibility violations', async () => {
    const { container } = render(
      <div className="flex items-center space-x-2">
        <Switch id="test-switch" />
        <Label htmlFor="test-switch">Enable notifications</Label>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Button supports keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Test Button</Button>);
    
    const button = screen.getByRole('button');
    
    // Focus the button
    await user.tab();
    expect(button).toHaveFocus();
    
    // Activate with Enter
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Activate with Space
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('Select supports keyboard navigation', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    
    // Focus and open with Enter
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    
    // Navigate with arrow keys and select with Enter
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    
    expect(onValueChange).toHaveBeenCalledWith('option1');
  });

  it('Input has proper ARIA attributes', () => {
    render(
      <div>
        <Label htmlFor="aria-input">Input with description</Label>
        <Input 
          id="aria-input" 
          aria-describedby="input-description"
          aria-invalid="false"
        />
        <div id="input-description">This is a helpful description</div>
      </div>
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'input-description');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('Checkbox has proper ARIA attributes and states', async () => {
    const user = userEvent.setup();
    
    render(
      <div className="flex items-center space-x-2">
        <Checkbox id="aria-checkbox" />
        <Label htmlFor="aria-checkbox">Checkbox label</Label>
      </div>
    );
    
    const checkbox = screen.getByRole('checkbox');
    
    // Initial state
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox).not.toBeChecked();
    
    // After clicking
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(checkbox).toBeChecked();
  });

  it('Switch has proper ARIA attributes and states', async () => {
    const user = userEvent.setup();
    
    render(
      <div className="flex items-center space-x-2">
        <Switch id="aria-switch" />
        <Label htmlFor="aria-switch">Switch label</Label>
      </div>
    );
    
    const switchElement = screen.getByRole('switch');
    
    // Initial state
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
    
    // After clicking
    await user.click(switchElement);
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
  });

  it('Components support high contrast mode', () => {
    // Simulate high contrast mode by adding class to body
    document.body.classList.add('vscode-high-contrast');
    
    const { container } = render(
      <div>
        <Button>High Contrast Button</Button>
        <Input placeholder="High contrast input" />
        <Checkbox />
        <Switch />
      </div>
    );
    
    // Verify components render without errors in high contrast mode
    expect(container).toBeInTheDocument();
    
    // Cleanup
    document.body.classList.remove('vscode-high-contrast');
  });

  it('Components have proper focus indicators', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <Button>Focus test</Button>
        <Input placeholder="Focus test" />
        <Checkbox />
        <Switch />
      </div>
    );
    
    // Tab through all focusable elements
    await user.tab(); // Button
    expect(screen.getByRole('button')).toHaveFocus();
    
    await user.tab(); // Input
    expect(screen.getByRole('textbox')).toHaveFocus();
    
    await user.tab(); // Checkbox
    expect(screen.getByRole('checkbox')).toHaveFocus();
    
    await user.tab(); // Switch
    expect(screen.getByRole('switch')).toHaveFocus();
  });

  it('Error states are properly announced to screen readers', () => {
    render(
      <div>
        <Label htmlFor="error-input">Input with error</Label>
        <Input 
          id="error-input"
          aria-invalid="true"
          aria-describedby="error-message"
        />
        <div id="error-message" role="alert">
          This field is required
        </div>
      </div>
    );
    
    const input = screen.getByRole('textbox');
    const errorMessage = screen.getByRole('alert');
    
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'error-message');
    expect(errorMessage).toHaveTextContent('This field is required');
  });

  it('Components work with screen reader announcements', () => {
    render(
      <div>
        <div role="status" aria-live="polite">
          Settings saved successfully
        </div>
        <div role="alert" aria-live="assertive">
          Error: Connection failed
        </div>
      </div>
    );
    
    expect(screen.getByRole('status')).toHaveTextContent('Settings saved successfully');
    expect(screen.getByRole('alert')).toHaveTextContent('Error: Connection failed');
  });
});
