/**
 * AI Provider Setup Guide Component
 * 
 * Provides collapsible setup instructions for different AI providers
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

interface ProviderSetupGuideProps {
  providerType: 'ollama' | 'openai';
}

const SETUP_GUIDES = {
  ollama: {
    title: 'How to set up Ollama',
    steps: [
      {
        title: 'Install Ollama',
        description: 'Download and install Ollama for your operating system:',
        link: {
          url: 'https://ollama.ai/',
          text: 'Download Ollama'
        }
      },
      {
        title: 'Start Ollama service',
        description: 'On most systems, Ollama starts automatically. You can also start it manually:',
        command: 'ollama serve',
        note: 'This starts the Ollama server on http://localhost:11434'
      },
      {
        title: 'Install an embedding model',
        description: 'Download a recommended embedding model:',
        command: 'ollama pull nomic-embed-text',
        note: 'This is a high-quality embedding model optimized for code and text'
      },
      {
        title: 'Alternative embedding models',
        description: 'You can also try these other embedding models:',
        command: 'ollama pull all-minilm\n# or\nollama pull mxbai-embed-large',
        note: 'all-minilm is smaller and faster, mxbai-embed-large is more accurate but slower'
      },
      {
        title: 'Verify installation',
        description: 'Check that Ollama is running and models are available:',
        command: 'ollama list',
        note: 'This should show your installed models'
      },
      {
        title: 'Test embedding generation',
        description: 'Test that embeddings work:',
        command: 'curl http://localhost:11434/api/embeddings -d \'{"model": "nomic-embed-text", "prompt": "hello world"}\'',
        note: 'This should return a JSON response with embedding vectors'
      }
    ] as SetupStep[]
  },
  
  openai: {
    title: 'How to set up OpenAI',
    steps: [
      {
        title: 'Create an OpenAI account',
        description: 'Sign up for an OpenAI account if you don\'t have one:',
        link: {
          url: 'https://platform.openai.com/signup',
          text: 'Sign up for OpenAI'
        }
      },
      {
        title: 'Add billing information',
        description: 'Add a payment method to your account:',
        link: {
          url: 'https://platform.openai.com/account/billing',
          text: 'Set up billing'
        },
        note: 'OpenAI requires a payment method even for small usage amounts'
      },
      {
        title: 'Create an API key',
        description: 'Generate a new API key in your OpenAI dashboard:',
        link: {
          url: 'https://platform.openai.com/api-keys',
          text: 'Create API key'
        },
        warning: 'Keep your API key secure and never share it publicly'
      },
      {
        title: 'Choose an embedding model',
        description: 'OpenAI offers several embedding models:',
        note: 'text-embedding-3-small: Cost-effective, good performance\ntext-embedding-3-large: Higher accuracy, more expensive\ntext-embedding-ada-002: Legacy model, still supported'
      },
      {
        title: 'Set usage limits (Recommended)',
        description: 'Set monthly spending limits to control costs:',
        link: {
          url: 'https://platform.openai.com/account/billing/limits',
          text: 'Set usage limits'
        },
        note: 'This helps prevent unexpected charges'
      },
      {
        title: 'Test your setup',
        description: 'Verify your API key works:',
        command: 'curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_API_KEY"',
        note: 'Replace YOUR_API_KEY with your actual API key'
      }
    ] as SetupStep[]
  }
};

export const ProviderSetupGuide: React.FC<ProviderSetupGuideProps> = ({
  providerType
}) => {
  const styles = useStyles();
  const guide = SETUP_GUIDES[providerType];

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

export default ProviderSetupGuide;
