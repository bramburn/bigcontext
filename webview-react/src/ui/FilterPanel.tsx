import { useState, useCallback, memo } from 'react';
import { Button } from './Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Input } from './Input';
import { Label } from './Label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './Collapsible';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { usePerformanceMonitor } from '../utils/lazyLoad';

export interface FilterOptions {
  fileType?: string;
  dateRange?: { from?: string; to?: string };
}

interface FilterPanelProps {
  availableFileTypes: string[];
  currentFilters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

function FilterPanel({
  availableFileTypes,
  currentFilters,
  onFilterChange,
}: FilterPanelProps) {
  usePerformanceMonitor('FilterPanel');
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
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="rounded border border-[var(--vscode-panel-border,#3c3c3c)] p-3">
        <div className="flex items-center gap-2">
          <div className="font-medium">Filters</div>
          {activeFiltersCount > 0 && (
            <span className="ml-2 rounded-full bg-[var(--vscode-focusBorder,#007acc)] px-2 text-xs text-white">
              {activeFiltersCount}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                {isExpanded ? (
                  <>
                    <ChevronUpIcon className="h-4 w-4 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="h-4 w-4 mr-1" />
                    Expand
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent className="mt-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="file-type-select">File Type</Label>
              <Select
                value={currentFilters.fileType || 'all'}
                onValueChange={(value) => handleFileTypeChange({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}
              >
                <SelectTrigger id="file-type-select">
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All file types</SelectItem>
                  {availableFileTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t || 'No extension'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={currentFilters.dateRange?.from || ''}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  placeholder="From date"
                />
                <div className="opacity-70 text-sm">to</div>
                <Input
                  type="date"
                  value={currentFilters.dateRange?.to || ''}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  placeholder="To date"
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(FilterPanel, (prevProps, nextProps) => {
  return (
    prevProps.availableFileTypes.length === nextProps.availableFileTypes.length &&
    prevProps.availableFileTypes.every((type, index) => type === nextProps.availableFileTypes[index]) &&
    prevProps.currentFilters.fileType === nextProps.currentFilters.fileType &&
    JSON.stringify(prevProps.currentFilters.dateRange) === JSON.stringify(nextProps.currentFilters.dateRange)
  );
});

