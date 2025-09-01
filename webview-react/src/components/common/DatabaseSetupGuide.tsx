/**
 * Database Setup Guide Component
 * 
 * Provides collapsible setup instructions for different database providers
 */

import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { QuestionCircle24Regular } from '@fluentui/react-icons';
import { SetupInstructions, SetupStep } from './SetupInstructions';

const useStyles = makeStyles({
  guideContainer: {
    marginBottom: tokens.spacingVerticalM,
  },
  accordionHeader: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  helpIcon: {
    marginRight: tokens.spacingHorizontalXS,
    color: tokens.colorBrandForeground1,
  },
});

interface DatabaseSetupGuideProps {
  databaseType: 'qdrant' | 'pinecone' | 'chroma';
}

const SETUP_GUIDES = {
  qdrant: {
    title: 'How to set up Qdrant',
    steps: [
      {
        title: 'Install Docker',
        description: 'Qdrant runs best in Docker. Make sure Docker is installed and running on your system.',
        link: {
          url: 'https://docs.docker.com/get-docker/',
          text: 'Download Docker'
        }
      },
      {
        title: 'Run Qdrant with Docker',
        description: 'Start a Qdrant instance on port 6333:',
        command: 'docker run -p 6333:6333 qdrant/qdrant',
        note: 'This will download and start Qdrant. The service will be available at http://localhost:6333'
      },
      {
        title: 'Run Qdrant with persistence (Recommended)',
        description: 'To keep your data between restarts, use a volume:',
        command: 'docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant',
        note: 'This creates a local directory to store your vector data permanently'
      },
      {
        title: 'Verify installation',
        description: 'Check if Qdrant is running by visiting the web UI:',
        link: {
          url: 'http://localhost:6333/dashboard',
          text: 'Open Qdrant Dashboard'
        }
      },
      {
        title: 'Optional: Set up authentication',
        description: 'For production use, you can set up API key authentication:',
        command: 'docker run -p 6333:6333 -e QDRANT__SERVICE__API_KEY=your-secret-key qdrant/qdrant',
        note: 'Replace "your-secret-key" with a secure API key'
      }
    ] as SetupStep[]
  },
  
  pinecone: {
    title: 'How to set up Pinecone',
    steps: [
      {
        title: 'Create a Pinecone account',
        description: 'Sign up for a free Pinecone account:',
        link: {
          url: 'https://app.pinecone.io/',
          text: 'Sign up for Pinecone'
        }
      },
      {
        title: 'Get your API key',
        description: 'After logging in, go to the API Keys section and create a new API key.',
        note: 'Keep this key secure - you\'ll need it for configuration'
      },
      {
        title: 'Note your environment',
        description: 'Find your environment name in the Pinecone console (e.g., "us-west1-gcp-free").',
        note: 'The environment determines where your data is stored geographically'
      },
      {
        title: 'Create an index',
        description: 'Create a new index for your embeddings with these settings:',
        note: 'Dimension: 1536 (for OpenAI embeddings) or 768 (for most other models), Metric: cosine'
      },
      {
        title: 'Configure the extension',
        description: 'Enter your API key, environment, and index name in the form above.',
        warning: 'Never share your API key or commit it to version control'
      }
    ] as SetupStep[]
  },
  
  chroma: {
    title: 'How to set up ChromaDB',
    steps: [
      {
        title: 'Install Docker',
        description: 'ChromaDB can run in Docker for easy setup:',
        link: {
          url: 'https://docs.docker.com/get-docker/',
          text: 'Download Docker'
        }
      },
      {
        title: 'Run ChromaDB with Docker',
        description: 'Start a ChromaDB instance on port 8000:',
        command: 'docker run -p 8000:8000 chromadb/chroma',
        note: 'This will start ChromaDB and make it available at http://localhost:8000'
      },
      {
        title: 'Run with persistence (Recommended)',
        description: 'To keep your data between restarts:',
        command: 'docker run -p 8000:8000 -v $(pwd)/chroma_data:/chroma/chroma chromadb/chroma',
        note: 'This creates a local directory to store your vector data permanently'
      },
      {
        title: 'Alternative: Install with pip',
        description: 'You can also install ChromaDB directly with Python:',
        command: 'pip install chromadb && chroma run --host 0.0.0.0 --port 8000',
        note: 'This requires Python 3.7+ and pip'
      },
      {
        title: 'Verify installation',
        description: 'Test the connection by visiting:',
        link: {
          url: 'http://localhost:8000/api/v1/heartbeat',
          text: 'Test ChromaDB connection'
        }
      }
    ] as SetupStep[]
  }
};

export const DatabaseSetupGuide: React.FC<DatabaseSetupGuideProps> = ({
  databaseType
}) => {
  const styles = useStyles();
  const guide = SETUP_GUIDES[databaseType];

  if (!guide) {
    return null;
  }

  return (
    <div className={styles.guideContainer}>
      <Accordion collapsible>
        <AccordionItem value="setup-guide">
          <AccordionHeader className={styles.accordionHeader}>
            <QuestionCircle24Regular className={styles.helpIcon} />
            <Text size={300} weight="semibold">
              {guide.title}
            </Text>
          </AccordionHeader>
          <AccordionPanel>
            <SetupInstructions steps={guide.steps} />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default DatabaseSetupGuide;
