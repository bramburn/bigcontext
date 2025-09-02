/**
 * SearchContainer Component
 * 
 * This component provides a tabbed interface for search functionality:
 * - Quick Search tab (QueryView)
 * - Saved Searches tab (SavedSearchesView)
 */


import {
  makeStyles,
  tokens,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData
} from '@fluentui/react-components';
import {
  Search20Regular,
  BookmarkMultiple20Regular
} from '@fluentui/react-icons';
import { useAppStore } from '../stores/appStore';
import QueryView from './QueryView';
import SavedSearchesView from './SavedSearchesView';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: tokens.spacingVerticalM,
  },
  tabList: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  tabContent: {
    flex: 1,
    overflow: 'auto',
  },
  header: {
    marginBottom: tokens.spacingVerticalS,
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    margin: `${tokens.spacingVerticalXS} 0 0 0`,
  }
});

export default function SearchContainer() {
  const styles = useStyles();
  const { selectedSearchTab, setSelectedSearchTab } = useAppStore();

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedSearchTab(data.value as 'query' | 'saved');
  };

  const renderTabContent = () => {
    switch (selectedSearchTab) {
      case 'query':
        return <QueryView />;
      case 'saved':
        return <SavedSearchesView />;
      default:
        return <QueryView />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Search</h2>
        <p className={styles.subtitle}>
          Search through your codebase using AI-powered semantic search
        </p>
      </div>
      
      <TabList
        className={styles.tabList}
        selectedValue={selectedSearchTab}
        onTabSelect={handleTabSelect}
        size="medium"
      >
        <Tab
          value="query"
          icon={<Search20Regular />}
        >
          Quick Search
        </Tab>
        <Tab
          value="saved"
          icon={<BookmarkMultiple20Regular />}
        >
          Saved Searches
        </Tab>
      </TabList>

      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>
    </div>
  );
}
