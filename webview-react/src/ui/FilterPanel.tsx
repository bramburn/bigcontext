import { useState, useCallback } from 'react';

export interface FilterOptions {
  fileType?: string;
  dateRange?: { from?: string; to?: string };
}

export default function FilterPanel({
  availableFileTypes,
  currentFilters,
  onFilterChange,
}: {
  availableFileTypes: string[];
  currentFilters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount =
    (currentFilters.fileType ? 1 : 0) +
    (currentFilters.dateRange?.from || currentFilters.dateRange?.to ? 1 : 0);

  const handleFileTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...currentFilters,
      fileType: e.target.value === 'all' ? undefined : e.target.value,
    });
  }, [currentFilters, onFilterChange]);

  const handleDateChange = useCallback((key: 'from'|'to', value: string) => {
    onFilterChange({
      ...currentFilters,
      dateRange: { ...(currentFilters.dateRange || {}), [key]: value || undefined },
    });
  }, [currentFilters, onFilterChange]);

  const clearFilters = () => onFilterChange({});

  return (
    <div className="rounded border p-3">
      <div className="flex items-center gap-2">
        <div className="font-medium">Filters</div>
        {activeFiltersCount > 0 && (
          <span className="ml-2 rounded-full bg-[var(--vscode-focusBorder,#007acc)] px-2 text-xs text-white">
            {activeFiltersCount}
          </span>
        )}
        <div className="ml-auto flex gap-2">
          {activeFiltersCount > 0 && (
            <button className="rounded border px-2 py-1 text-xs hover:bg-white/5" onClick={clearFilters}>
              Clear All
            </button>
          )}
          <button
            className="rounded border px-2 py-1 text-xs hover:bg-white/5"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block">File Type</span>
            <select
              className="w-full rounded border bg-transparent px-2 py-1"
              value={currentFilters.fileType || 'all'}
              onChange={handleFileTypeChange}
            >
              <option value="all">All file types</option>
              {availableFileTypes.map((t) => (
                <option key={t} value={t}>{t || 'No extension'}</option>
              ))}
            </select>
          </label>

          <div className="text-sm">
            <div className="mb-1">Date Range</div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="w-full rounded border bg-transparent px-2 py-1"
                value={currentFilters.dateRange?.from || ''}
                onChange={(e)=>handleDateChange('from', e.target.value)}
              />
              <div className="opacity-70">to</div>
              <input
                type="date"
                className="w-full rounded border bg-transparent px-2 py-1"
                value={currentFilters.dateRange?.to || ''}
                onChange={(e)=>handleDateChange('to', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

