/**
 * HelpView Component
 * 
 * This component provides comprehensive help and documentation:
 * - Getting started guide
 * - Feature explanations
 * - Troubleshooting tips
 * - FAQ section
 */

import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Text,
  Link,
  Card,
  CardHeader,

  Button,
  MessageBar,
  MessageBarBody
} from '@fluentui/react-components';
import {

  Settings20Regular,
  Search20Regular,
  DatabaseSearch20Regular,
  Info20Regular,
  ChevronRight20Regular
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    height: '100%',
    overflow: 'auto',
  },
  header: {
    marginBottom: tokens.spacingVerticalM,
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
  },
  section: {
    marginBottom: tokens.spacingVerticalL,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalS,
  },
  quickStartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
  quickStartCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    }
  },
  codeBlock: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    margin: `${tokens.spacingVerticalS} 0`,
  },
  stepList: {
    paddingLeft: tokens.spacingHorizontalM,
    '& li': {
      marginBottom: tokens.spacingVerticalXS,
    }
  }
});

export default function HelpView() {
  const styles = useStyles();
  const [openItems, setOpenItems] = useState<string[]>(['getting-started']);

  const quickStartItems = [
    {
      id: 'setup',
      title: 'Setup & Configuration',
      description: 'Configure your database and embedding provider',
      icon: <Settings20Regular />,
      action: 'Go to Setup'
    },
    {
      id: 'indexing',
      title: 'Index Your Code',
      description: 'Start indexing your codebase for search',
      icon: <DatabaseSearch20Regular />,
      action: 'Start Indexing'
    },
    {
      id: 'search',
      title: 'Search Your Code',
      description: 'Use AI-powered semantic search',
      icon: <Search20Regular />,
      action: 'Try Search'
    },
    {
      id: 'diagnostics',
      title: 'Check Status',
      description: 'Monitor system health and performance',
      icon: <Info20Regular />,
      action: 'View Diagnostics'
    }
  ];

  const faqItems = [
    {
      question: "How do I get started with the Code Context Engine?",
      answer: "Start by configuring your database (Qdrant) and embedding provider (Ollama or OpenAI) in the Setup section. Then index your codebase and start searching!"
    },
    {
      question: "What embedding providers are supported?",
      answer: "We support Ollama (local, free) and OpenAI (cloud-based). Ollama is recommended for privacy and cost-effectiveness."
    },
    {
      question: "How long does indexing take?",
      answer: "Indexing time depends on your codebase size and hardware. A typical project with 10,000 files takes 5-15 minutes on modern hardware."
    },
    {
      question: "Can I use this with remote development?",
      answer: "Yes! The extension works with VS Code Remote Development, including SSH, containers, and WSL."
    },
    {
      question: "What programming languages are supported?",
      answer: "Currently supports TypeScript, JavaScript, Python, and C#. More languages will be added in future updates."
    },
    {
      question: "How do I troubleshoot connection issues?",
      answer: "Check the Diagnostics section for system health. Ensure Qdrant is running on the correct port and your embedding provider is accessible."
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Help & Documentation</h2>
        <p className={styles.subtitle}>
          Learn how to use the Code Context Engine effectively
        </p>
      </div>

      <MessageBar>
        <MessageBarBody>
          <strong>New to Code Context Engine?</strong> Start with the Quick Start guide below to get up and running in minutes.
        </MessageBarBody>
      </MessageBar>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Quick Start</h3>
        <div className={styles.quickStartGrid}>
          {quickStartItems.map((item) => (
            <Card key={item.id} className={styles.quickStartCard}>
              <CardHeader
                image={item.icon}
                header={<Text weight="semibold">{item.title}</Text>}
                description={<Text size={200}>{item.description}</Text>}
                action={
                  <Button appearance="subtle" icon={<ChevronRight20Regular />}>
                    {item.action}
                  </Button>
                }
              />
            </Card>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Getting Started Guide</h3>
        <Accordion
          openItems={openItems}
          onToggle={(_, data) => setOpenItems(Array.from(data.openItems) as string[])}
          multiple
          collapsible
        >
          <AccordionItem value="getting-started">
            <AccordionHeader>Step-by-Step Setup</AccordionHeader>
            <AccordionPanel>
              <ol className={styles.stepList}>
                <li><strong>Install Dependencies:</strong> Ensure you have Qdrant running locally or accessible remotely.</li>
                <li><strong>Configure Database:</strong> Go to Setup → Database and enter your Qdrant connection details.</li>
                <li><strong>Choose Embedding Provider:</strong> Select Ollama (free, local) or OpenAI (requires API key).</li>
                <li><strong>Test Connections:</strong> Use the test buttons to verify your configuration.</li>
                <li><strong>Start Indexing:</strong> Navigate to Indexing Status and click "Start Indexing".</li>
                <li><strong>Search Your Code:</strong> Once indexing completes, use the Search tab to find code.</li>
              </ol>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem value="search-tips">
            <AccordionHeader>Search Tips & Best Practices</AccordionHeader>
            <AccordionPanel>
              <Text>Use natural language queries for best results:</Text>
              <div className={styles.codeBlock}>
                • "function that handles user authentication"<br/>
                • "error handling for database connections"<br/>
                • "React component for file upload"<br/>
                • "algorithm for sorting arrays"
              </div>
              <Text>You can also save frequently used searches for quick access.</Text>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem value="troubleshooting">
            <AccordionHeader>Troubleshooting Common Issues</AccordionHeader>
            <AccordionPanel>
              <Text><strong>Connection Issues:</strong></Text>
              <ul className={styles.stepList}>
                <li>Verify Qdrant is running: <code>docker ps</code> or check service status</li>
                <li>Check firewall settings and port accessibility</li>
                <li>Ensure correct URL format (http://localhost:6333)</li>
              </ul>
              
              <Text><strong>Indexing Problems:</strong></Text>
              <ul className={styles.stepList}>
                <li>Check available disk space and memory</li>
                <li>Verify file permissions in workspace</li>
                <li>Review excluded patterns in settings</li>
              </ul>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Frequently Asked Questions</h3>
        <Accordion collapsible>
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionHeader>{item.question}</AccordionHeader>
              <AccordionPanel>
                <Text>{item.answer}</Text>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Additional Resources</h3>
        <Text>
          • <Link href="https://github.com/bramburn/bigcontext" target="_blank">GitHub Repository</Link><br/>
          • <Link href="https://qdrant.tech/documentation/" target="_blank">Qdrant Documentation</Link><br/>
          • <Link href="https://ollama.ai/" target="_blank">Ollama Documentation</Link>
        </Text>
      </div>
    </div>
  );
}
