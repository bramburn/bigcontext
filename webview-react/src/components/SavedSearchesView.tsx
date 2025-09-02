/**
 * SavedSearchesView Component
 * 
 * This component displays and manages saved searches:
 * - List of saved searches
 * - Execute saved searches
 * - Delete saved searches
 * - Save current query as new search
 */

import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  Input,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Field,
  MessageBar,
  MessageBarBody
} from '@fluentui/react-components';
import {
  Search20Regular,
  Delete20Regular,
  Add20Regular,
  Play20Regular
} from '@fluentui/react-icons';
import { useAppStore } from '../stores/appStore';
import { postMessage } from '../utils/vscodeApi';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
  },
  searchList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    flex: 1,
    overflow: 'auto',
  },
  searchCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    }
  },
  searchCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchQuery: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusSmall,
    marginTop: tokens.spacingVerticalXS,
  },
  searchMeta: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground2,
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  }
});

export default function SavedSearchesView() {
  const styles = useStyles();
  const { 
    savedSearches, 
    query, 
    addSavedSearch, 
    removeSavedSearch, 
    setQuery,
    setSelectedSearchTab 
  } = useAppStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [saveQuery, setSaveQuery] = useState('');

  const handleSaveSearch = () => {
    if (searchName.trim() && saveQuery.trim()) {
      addSavedSearch(searchName.trim(), saveQuery.trim());
      setSearchName('');
      setSaveQuery('');
      setIsDialogOpen(false);
    }
  };

  const handleExecuteSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setSelectedSearchTab('query');
    // Trigger search
    postMessage('search', { query: searchQuery });
  };

  const handleDeleteSearch = (searchId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeSavedSearch(searchId);
  };

  const openSaveDialog = () => {
    setSaveQuery(query);
    setIsDialogOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Text size={400} weight="semibold">Saved Searches</Text>
          <Text size={200} style={{ display: 'block', color: tokens.colorNeutralForeground2 }}>
            {savedSearches.length} saved search{savedSearches.length !== 1 ? 'es' : ''}
          </Text>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
          <DialogTrigger disableButtonEnhancement>
            <Button
              appearance="primary"
              icon={<Add20Regular />}
              onClick={openSaveDialog}
              disabled={!query.trim()}
            >
              Save Current Search
            </Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogTitle>Save Search</DialogTitle>
            <DialogContent>
              <DialogBody className={styles.dialogContent}>
                <Field label="Search Name" required>
                  <Input
                    value={searchName}
                    onChange={(_, data) => setSearchName(data.value)}
                    placeholder="Enter a name for this search..."
                  />
                </Field>
                <Field label="Query">
                  <Input
                    value={saveQuery}
                    onChange={(_, data) => setSaveQuery(data.value)}
                    placeholder="Search query..."
                  />
                </Field>
              </DialogBody>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary">Cancel</Button>
                </DialogTrigger>
                <Button 
                  appearance="primary" 
                  onClick={handleSaveSearch}
                  disabled={!searchName.trim() || !saveQuery.trim()}
                >
                  Save Search
                </Button>
              </DialogActions>
            </DialogContent>
          </DialogSurface>
        </Dialog>
      </div>

      {!query.trim() && (
        <MessageBar>
          <MessageBarBody>
            Enter a search query in the Quick Search tab to save it here.
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.searchList}>
        {savedSearches.length === 0 ? (
          <div className={styles.emptyState}>
            <Search20Regular style={{ fontSize: '48px', marginBottom: tokens.spacingVerticalM }} />
            <Text size={300} weight="semibold">No saved searches yet</Text>
            <Text size={200} style={{ marginTop: tokens.spacingVerticalXS }}>
              Save frequently used searches for quick access
            </Text>
          </div>
        ) : (
          savedSearches.map((search) => (
            <Card 
              key={search.id} 
              className={styles.searchCard}
              onClick={() => handleExecuteSearch(search.query)}
            >
              <CardHeader
                header={
                  <div className={styles.searchCardHeader}>
                    <Text weight="semibold">{search.name}</Text>
                    <div className={styles.actionButtons}>
                      <Button
                        appearance="subtle"
                        icon={<Play20Regular />}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecuteSearch(search.query);
                        }}
                        title="Execute search"
                      />
                      <Button
                        appearance="subtle"
                        icon={<Delete20Regular />}
                        size="small"
                        onClick={(e) => handleDeleteSearch(search.id, e)}
                        title="Delete search"
                      />
                    </div>
                  </div>
                }
              />
              <CardPreview>
                <div className={styles.searchQuery}>
                  {search.query}
                </div>
                <div className={styles.searchMeta}>
                  Saved on {formatDate(search.timestamp)}
                </div>
              </CardPreview>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
