import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SearchView from '../../views/SearchView';

// Mock the VS Code API
const mockPostMessage = vi.fn();
const mockOnMessageCommand = vi.fn();

vi.mock('../../utils/vscodeApi', () => ({
  postMessage: mockPostMessage,
  onMessageCommand: mockOnMessageCommand,
}));

describe('Search and Filter Workflow', () => {
  const mockSearchResults = [
    {
      id: '1',
      filePath: '/src/components/Button.tsx',
      lineNumber: 15,
      content: 'export const Button = ({ children, onClick }) => {',
      score: 0.95
    },
    {
      id: '2',
      filePath: '/src/utils/helpers.js',
      lineNumber: 8,
      content: 'function handleButtonClick(event) {',
      score: 0.87
    },
    {
      id: '3',
      filePath: '/tests/Button.test.py',
      lineNumber: 22,
      content: 'def test_button_click():',
      score: 0.75
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockOnMessageCommand.mockImplementation((command, callback) => {
      if (command === 'searchResults') {
        setTimeout(() => callback({
          results: mockSearchResults,
          query: 'button',
          totalResults: 3
        }), 100);
      }
      return vi.fn();
    });
  });

  it('completes full search and filter workflow', async () => {
    const user = userEvent.setup();
    render(<SearchView />);

    // Step 1: Enter search query
    const searchInput = screen.getByPlaceholderText('Search your codebase');
    await user.type(searchInput, 'button');

    // Step 2: Execute search
    const searchButton = screen.getByText('Search');
    await user.click(searchButton);

    // Verify search is initiated
    expect(mockPostMessage).toHaveBeenCalledWith('search', {
      query: 'button',
      filters: {}
    });

    // Verify loading state
    expect(screen.getByText('Searching...')).toBeInTheDocument();

    // Step 3: Wait for results
    await waitFor(() => {
      expect(screen.getByText('/src/components/Button.tsx')).toBeInTheDocument();
      expect(screen.getByText('/src/utils/helpers.js')).toBeInTheDocument();
      expect(screen.getByText('/tests/Button.test.py')).toBeInTheDocument();
    });

    // Step 4: Apply file type filter
    const expandButton = screen.getByText('Expand');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByLabelText('File Type')).toBeInTheDocument();
    });

    const fileTypeSelect = screen.getByRole('combobox');
    await user.click(fileTypeSelect);

    await waitFor(() => {
      expect(screen.getByText('tsx')).toBeInTheDocument();
    });

    await user.click(screen.getByText('tsx'));

    // Verify filtered search is triggered
    expect(mockPostMessage).toHaveBeenCalledWith('search', {
      query: 'button',
      filters: { fileType: 'tsx' }
    });

    // Step 5: Open a result
    const firstResult = screen.getByText('/src/components/Button.tsx');
    await user.click(firstResult);

    expect(mockPostMessage).toHaveBeenCalledWith('openFile', {
      filePath: '/src/components/Button.tsx',
      lineNumber: 15
    });
  });

  it('handles search with keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(<SearchView />);

    const searchInput = screen.getByPlaceholderText('Search your codebase');
    await user.type(searchInput, 'function');
    
    // Press Enter to search
    await user.keyboard('{Enter}');

    expect(mockPostMessage).toHaveBeenCalledWith('search', {
      query: 'function',
      filters: {}
    });
  });

  it('handles date range filtering workflow', async () => {
    const user = userEvent.setup();
    render(<SearchView />);

    // First perform a search
    const searchInput = screen.getByPlaceholderText('Search your codebase');
    await user.type(searchInput, 'test');
    await user.click(screen.getByText('Search'));

    // Expand filters
    const expandButton = screen.getByText('Expand');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('From date')).toBeInTheDocument();
    });

    // Set date range
    const fromDateInput = screen.getByPlaceholderText('From date');
    const toDateInput = screen.getByPlaceholderText('To date');

    await user.type(fromDateInput, '2023-01-01');
    await user.type(toDateInput, '2023-12-31');

    // Verify search with date filters
    expect(mockPostMessage).toHaveBeenCalledWith('search', {
      query: 'test',
      filters: {
        dateRange: {
          from: '2023-01-01',
          to: '2023-12-31'
        }
      }
    });
  });

  it('handles filter clearing workflow', async () => {
    const user = userEvent.setup();
    render(<SearchView />);

    // Perform search and apply filters
    const searchInput = screen.getByPlaceholderText('Search your codebase');
    await user.type(searchInput, 'component');
    await user.click(screen.getByText('Search'));

    // Expand and apply file type filter
    const expandButton = screen.getByText('Expand');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByLabelText('File Type')).toBeInTheDocument();
    });

    const fileTypeSelect = screen.getByRole('combobox');
    await user.click(fileTypeSelect);

    await waitFor(() => {
      expect(screen.getByText('js')).toBeInTheDocument();
    });

    await user.click(screen.getByText('js'));

    // Verify filter is applied and clear button appears
    await waitFor(() => {
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    // Clear all filters
    await user.click(screen.getByText('Clear All'));

    // Verify search is re-executed without filters
    expect(mockPostMessage).toHaveBeenCalledWith('search', {
      query: 'component',
      filters: {}
    });
  });

  it('handles empty search results gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock empty results
    mockOnMessageCommand.mockImplementation((command, callback) => {
      if (command === 'searchResults') {
        setTimeout(() => callback({
          results: [],
          query: 'nonexistent',
          totalResults: 0
        }), 100);
      }
      return vi.fn();
    });

    render(<SearchView />);

    const searchInput = screen.getByPlaceholderText('Search your codebase');
    await user.type(searchInput, 'nonexistent');
    await user.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });
  });

  it('handles search errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock error response
    mockOnMessageCommand.mockImplementation((command, callback) => {
      if (command === 'searchError') {
        setTimeout(() => callback({
          error: 'Search service unavailable',
          query: 'test'
        }), 100);
      }
      return vi.fn();
    });

    render(<SearchView />);

    const searchInput = screen.getByPlaceholderText('Search your codebase');
    await user.type(searchInput, 'test');
    await user.click(screen.getByText('Search'));

    // Should handle error gracefully and show appropriate message
    await waitFor(() => {
      expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
    });
  });

  it('preserves search state when navigating between results', async () => {
    const user = userEvent.setup();
    render(<SearchView />);

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search your codebase');
    await user.type(searchInput, 'button');
    await user.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('/src/components/Button.tsx')).toBeInTheDocument();
    });

    // Apply filter
    const expandButton = screen.getByText('Expand');
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByLabelText('File Type')).toBeInTheDocument();
    });

    const fileTypeSelect = screen.getByRole('combobox');
    await user.click(fileTypeSelect);

    await waitFor(() => {
      expect(screen.getByText('tsx')).toBeInTheDocument();
    });

    await user.click(screen.getByText('tsx'));

    // Verify search input and filters are preserved
    expect(searchInput).toHaveValue('button');
    expect(screen.getByText('1')).toBeInTheDocument(); // Filter count badge
  });
});
