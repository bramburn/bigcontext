import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FilterPanel, { FilterOptions } from '../../ui/FilterPanel';

describe('FilterPanel Component', () => {
  const defaultProps = {
    availableFileTypes: ['js', 'ts', 'py', 'java'],
    currentFilters: {} as FilterOptions,
    onFilterChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with filters collapsed by default', () => {
    render(<FilterPanel {...defaultProps} />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Expand')).toBeInTheDocument();
    expect(screen.queryByLabelText('File Type')).not.toBeInTheDocument();
  });

  it('shows active filter count when filters are applied', () => {
    const filtersWithFileType = { fileType: 'js' };
    render(<FilterPanel {...defaultProps} currentFilters={filtersWithFileType} />);
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Filter count badge
  });

  it('expands and collapses when expand button is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterPanel {...defaultProps} />);
    
    const expandButton = screen.getByText('Expand');
    await user.click(expandButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText('File Type')).toBeInTheDocument();
      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });
    
    const collapseButton = screen.getByText('Collapse');
    await user.click(collapseButton);
    
    await waitFor(() => {
      expect(screen.queryByLabelText('File Type')).not.toBeInTheDocument();
      expect(screen.getByText('Expand')).toBeInTheDocument();
    });
  });

  it('shows clear all button when filters are active', () => {
    const filtersWithFileType = { fileType: 'js' };
    render(<FilterPanel {...defaultProps} currentFilters={filtersWithFileType} />);
    
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('calls onFilterChange when file type is selected', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(<FilterPanel {...defaultProps} onFilterChange={onFilterChange} />);
    
    // Expand the panel
    await user.click(screen.getByText('Expand'));
    
    await waitFor(() => {
      expect(screen.getByLabelText('File Type')).toBeInTheDocument();
    });
    
    // Open the select dropdown
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);
    
    await waitFor(() => {
      expect(screen.getByText('js')).toBeInTheDocument();
    });
    
    // Select an option
    await user.click(screen.getByText('js'));
    
    expect(onFilterChange).toHaveBeenCalledWith({
      fileType: 'js',
    });
  });

  it('calls onFilterChange when date range is modified', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(<FilterPanel {...defaultProps} onFilterChange={onFilterChange} />);
    
    // Expand the panel
    await user.click(screen.getByText('Expand'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('From date')).toBeInTheDocument();
    });
    
    const fromDateInput = screen.getByPlaceholderText('From date');
    await user.type(fromDateInput, '2023-01-01');
    
    expect(onFilterChange).toHaveBeenCalledWith({
      dateRange: { from: '2023-01-01' },
    });
  });

  it('clears all filters when clear all button is clicked', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const filtersWithData = { 
      fileType: 'js', 
      dateRange: { from: '2023-01-01', to: '2023-12-31' } 
    };
    
    render(<FilterPanel {...defaultProps} currentFilters={filtersWithData} onFilterChange={onFilterChange} />);
    
    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);
    
    expect(onFilterChange).toHaveBeenCalledWith({});
  });

  it('displays current filter values correctly', async () => {
    const user = userEvent.setup();
    const currentFilters = {
      fileType: 'ts',
      dateRange: { from: '2023-01-01', to: '2023-12-31' }
    };
    
    render(<FilterPanel {...defaultProps} currentFilters={currentFilters} />);
    
    // Expand to see the values
    await user.click(screen.getByText('Expand'));
    
    await waitFor(() => {
      const fromInput = screen.getByPlaceholderText('From date') as HTMLInputElement;
      const toInput = screen.getByPlaceholderText('To date') as HTMLInputElement;
      
      expect(fromInput.value).toBe('2023-01-01');
      expect(toInput.value).toBe('2023-12-31');
    });
  });

  it('handles keyboard navigation for accessibility', async () => {
    const user = userEvent.setup();
    render(<FilterPanel {...defaultProps} />);
    
    // Tab to expand button and activate with Enter
    await user.tab();
    await user.tab(); // Skip clear all button if present
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByLabelText('File Type')).toBeInTheDocument();
    });
  });

  it('shows correct filter count for multiple active filters', () => {
    const multipleFilters = {
      fileType: 'js',
      dateRange: { from: '2023-01-01' }
    };
    
    render(<FilterPanel {...defaultProps} currentFilters={multipleFilters} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Two active filters
  });
});
