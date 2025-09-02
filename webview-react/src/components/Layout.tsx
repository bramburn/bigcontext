/**
 * Main Layout Component for Code Context Engine
 * 
 * This component provides the primary navigation structure with:
 * - Sidebar navigation tree
 * - Content area for rendering selected views
 * - Responsive design for VS Code webview
 */


import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Tree,
  TreeItem,
  TreeItemLayout,
  TreeOpenChangeData,
  TreeOpenChangeEvent,
  Divider
} from '@fluentui/react-components';
import {
  Search20Regular,
  DatabaseSearch20Regular,
  Settings20Regular,
  Info20Regular,
  QuestionCircle20Regular,
  ChevronRight20Regular,
  ChevronDown20Regular
} from '@fluentui/react-icons';
import { useAppStore } from '../stores/appStore';
import SetupView from './SetupView';
import IndexingView from './IndexingView';
import DiagnosticsView from './DiagnosticsView';
import SearchContainer from './SearchContainer';
import HelpView from './HelpView';
import SettingsView from './SettingsView';
import IndexingDashboard from './IndexingDashboard';

const useStyles = makeStyles({
  layout: {
    display: 'flex',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  sidebar: {
    width: '250px',
    minWidth: '200px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingVerticalS,
    overflowY: 'auto',
  },
  content: {
    flex: 1,
    padding: tokens.spacingVerticalM,
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  sidebarHeader: {
    padding: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalM,
    textAlign: 'center',
  },
  navTree: {
    width: '100%',
  },
  treeItem: {
    marginBottom: tokens.spacingVerticalXS,
  },
  expandIcon: {
    marginRight: tokens.spacingHorizontalXS,
  }
});

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'search',
    label: 'Search',
    icon: <Search20Regular />,
    children: [
      { id: 'search.query', label: 'Quick Search', icon: <Search20Regular /> },
      { id: 'search.saved', label: 'Saved Searches', icon: <DatabaseSearch20Regular /> }
    ]
  },
  {
    id: 'indexing',
    label: 'Indexing Status',
    icon: <DatabaseSearch20Regular />,
    children: [
      { id: 'indexing.status', label: 'Status Overview', icon: <DatabaseSearch20Regular /> },
      { id: 'indexing.dashboard', label: 'Enhanced Dashboard', icon: <DatabaseSearch20Regular /> }
    ]
  },
  {
    id: 'setup',
    label: 'Setup & Configuration',
    icon: <Settings20Regular />,
    children: [
      { id: 'setup.basic', label: 'Basic Setup', icon: <Settings20Regular /> },
      { id: 'setup.advanced', label: 'Advanced Settings', icon: <Settings20Regular /> }
    ]
  },
  {
    id: 'settings',
    label: 'Extension Settings',
    icon: <Settings20Regular />
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    icon: <Info20Regular />
  },
  {
    id: 'help',
    label: 'Help & Documentation',
    icon: <QuestionCircle20Regular />
  }
];

export default function Layout() {
  const styles = useStyles();
  const { selectedNavItem, setSelectedNavItem, setSelectedSearchTab } = useAppStore();
  const [openItems, setOpenItems] = useState<string[]>(['search']);

  const handleTreeOpenChange = (_: TreeOpenChangeEvent, data: TreeOpenChangeData) => {
    setOpenItems(Array.from(data.openItems) as string[]);
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedNavItem(itemId);
    
    // Handle search sub-items
    if (itemId === 'search.query') {
      setSelectedSearchTab('query');
      setSelectedNavItem('search');
    } else if (itemId === 'search.saved') {
      setSelectedSearchTab('saved');
      setSelectedNavItem('search');
    }
  };

  const renderTreeItem = (item: NavigationItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems.includes(item.id);
    const isSelected = selectedNavItem === item.id || 
      (item.id === 'search' && selectedNavItem === 'search');

    return (
      <TreeItem
        key={item.id}
        itemType={hasChildren ? "branch" : "leaf"}
        value={item.id}
        className={styles.treeItem}
      >
        <TreeItemLayout
          iconBefore={item.icon}
          expandIcon={hasChildren ? (isOpen ? <ChevronDown20Regular /> : <ChevronRight20Regular />) : undefined}
          onClick={() => handleItemSelect(item.id)}
          style={{
            backgroundColor: isSelected ? tokens.colorBrandBackground2 : 'transparent',
            color: isSelected ? tokens.colorBrandForeground2 : tokens.colorNeutralForeground1,
            borderRadius: tokens.borderRadiusSmall,
            padding: tokens.spacingVerticalXS,
            cursor: 'pointer',
            fontWeight: isSelected ? tokens.fontWeightSemibold : tokens.fontWeightRegular
          }}
        >
          {item.label}
        </TreeItemLayout>
        {hasChildren && item.children?.map(child => renderTreeItem(child, level + 1))}
      </TreeItem>
    );
  };

  const renderContent = () => {
    switch (selectedNavItem) {
      case 'search':
      case 'search.query':
      case 'search.saved':
        return <SearchContainer />;
      case 'indexing':
      case 'indexing.status':
        return <IndexingView />;
      case 'indexing.dashboard':
        return <IndexingDashboard />;
      case 'setup':
      case 'setup.basic':
        return <SetupView />;
<<<<<<< HEAD
      case 'setup.advanced':
        return <SettingsView />;
      case 'settings':
        return <SettingsView />;
      case 'diagnostics':
        return <DiagnosticsView />;
      case 'help':
        return <HelpView />;
      default:
        return <SearchContainer />;
    }
  };

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3 style={{ 
            margin: 0, 
            color: tokens.colorNeutralForeground1,
            fontSize: tokens.fontSizeBase300,
            fontWeight: tokens.fontWeightSemibold
          }}>
            Code Context
          </h3>
        </div>
        <Divider />
        <Tree
          className={styles.navTree}
          openItems={openItems}
          onOpenChange={handleTreeOpenChange}
          aria-label="Navigation tree"
        >
          {navigationItems.map(item => renderTreeItem(item))}
        </Tree>
      </div>
      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
}
