/**
 * FilterPanel Component
 * 
 * Provides filtering options for search results including file type and date range filters.
 */

import React, { useState, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  Dropdown,
  Option,
  Input,
  makeStyles,
  tokens,
  Body1
} from '@fluentui/react-components';
import {
  Filter24Regular,
  Dismiss24Regular,
  Calendar24Regular
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  filterPanel: {
    marginBottom: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalS,
  },
  filterRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    minWidth: '150px',
  },
  filterLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground2,
  },
  clearButton: {
    marginLeft: 'auto',
  },
  dateInputs: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  activeFiltersCount: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    borderRadius: tokens.borderRadiusCircular,
    padding: '2px 6px',
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightMedium,
  }
});

export interface FilterOptions {
  fileType?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

interface FilterPanelProps {
  availableFileTypes: string[];
  onFilterChange: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  availableFileTypes,
  onFilterChange,
  currentFilters
}) => {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileTypeChange = useCallback((_event: any, data: any) => {
    const newFilters = {
      ...currentFilters,
      fileType: data.optionValue === 'all' ? undefined : data.optionValue
    };
    onFilterChange(newFilters);
  }, [currentFilters, onFilterChange]);

  const handleDateFromChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = {
      ...currentFilters,
      dateRange: {
        ...currentFilters.dateRange,
        from: event.target.value || undefined
      }
    };
    onFilterChange(newFilters);
  }, [currentFilters, onFilterChange]);

  const handleDateToChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = {
      ...currentFilters,
      dateRange: {
        ...currentFilters.dateRange,
        to: event.target.value || undefined
      }
    };
    onFilterChange(newFilters);
  }, [currentFilters, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    onFilterChange({});
  }, [onFilterChange]);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (currentFilters.fileType) count++;
    if (currentFilters.dateRange?.from || currentFilters.dateRange?.to) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className={styles.filterPanel}>
      <CardHeader
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
            <Filter24Regular />
            <Text weight="semibold">Filters</Text>
            {activeFiltersCount > 0 && (
              <span className={styles.activeFiltersCount}>
                {activeFiltersCount}
              </span>
            )}
          </div>
        }
        action={
          <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
            {activeFiltersCount > 0 && (
              <Button
                appearance="subtle"
                size="small"
                onClick={handleClearFilters}
                className={styles.clearButton}
              >
                Clear All
              </Button>
            )}
            <Button
              appearance="subtle"
              size="small"
              icon={isExpanded ? <Dismiss24Regular /> : undefined}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        }
      />
      
      {isExpanded && (
        <CardPreview>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <Text className={styles.filterLabel}>File Type</Text>
              <Dropdown
                placeholder="All file types"
                value={currentFilters.fileType || 'all'}
                onOptionSelect={handleFileTypeChange}
              >
                <Option key="all" value="all">All file types</Option>
                {availableFileTypes.map((type) => (
                  <Option key={type} value={type}>
                    {type || 'No extension'}
                  </Option>
                ))}
              </Dropdown>
            </div>

            <div className={styles.filterGroup}>
              <Text className={styles.filterLabel}>
                <Calendar24Regular style={{ marginRight: tokens.spacingHorizontalXS }} />
                Date Range
              </Text>
              <div className={styles.dateInputs}>
                <Input
                  type="date"
                  placeholder="From"
                  value={currentFilters.dateRange?.from || ''}
                  onChange={handleDateFromChange}
                  size="small"
                />
                <Body1>to</Body1>
                <Input
                  type="date"
                  placeholder="To"
                  value={currentFilters.dateRange?.to || ''}
                  onChange={handleDateToChange}
                  size="small"
                />
              </div>
            </div>
          </div>
        </CardPreview>
      )}
    </Card>
  );
};

export default FilterPanel;
