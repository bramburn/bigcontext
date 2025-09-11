import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';

describe('Select Component', () => {
  const SelectExample = ({ onValueChange = vi.fn(), defaultValue = '' }) => (
    <Select defaultValue={defaultValue} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  );

  it('renders with placeholder text', () => {
    render(<SelectExample />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('opens dropdown when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<SelectExample />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });
  });

  it('selects an option when clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SelectExample onValueChange={onValueChange} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Option 2'));
    
    expect(onValueChange).toHaveBeenCalledWith('option2');
  });

  it('displays selected value', () => {
    render(<SelectExample defaultValue="option1" />);
    expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<SelectExample />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    // Test arrow key navigation
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument();
    });
  });

  it('closes dropdown when escape is pressed', async () => {
    const user = userEvent.setup();
    render(<SelectExample />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });
    
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    });
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(<SelectExample />);
    const trigger = screen.getByRole('combobox');
    
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('supports disabled state', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });
});
