import { useState } from 'react';
import SetupInstructions, { SetupStep } from './SetupInstructions';

const SETUP_GUIDES = {
  ollama: {
    title: 'How to set up Ollama',
    steps: [
      {
        title: 'Install Ollama',
        description: 'Download and install Ollama for your operating system:',
        link: { url: 'https://ollama.ai/', text: 'Download Ollama' }
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
        link: { url: 'https://platform.openai.com/signup', text: 'Sign up for OpenAI' }
      },
      {
        title: 'Add billing information',
        description: 'Add a payment method to your account:',
        link: { url: 'https://platform.openai.com/account/billing', text: 'Set up billing' },
        note: 'OpenAI requires a payment method even for small usage amounts'
      },
      {
        title: 'Create an API key',
        description: 'Generate a new API key in your OpenAI dashboard:',
        link: { url: 'https://platform.openai.com/api-keys', text: 'Create API key' },
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
        link: { url: 'https://platform.openai.com/account/billing/limits', text: 'Set usage limits' },
        note: 'This helps prevent unexpected charges'
      },
      {
        title: 'Test your setup',
        description: 'Verify your API key works:',
        command: 'curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_API_KEY"',
        note: 'Replace YOUR_API_KEY with your actual API key'
      }
    ] as SetupStep[]
  },

  qdrant: {
    title: 'How to set up Qdrant',
    steps: [
      {
        title: 'Install Docker',
        description: 'Qdrant runs best in Docker. Make sure Docker is installed and running on your system.',
        link: { url: 'https://docs.docker.com/get-docker/', text: 'Download Docker' }
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
        link: { url: 'http://localhost:6333/dashboard', text: 'Open Qdrant Dashboard' }
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
        link: { url: 'https://app.pinecone.io/', text: 'Sign up for Pinecone' }
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
        link: { url: 'https://docs.docker.com/get-docker/', text: 'Download Docker' }
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
        link: { url: 'http://localhost:8000/api/v1/heartbeat', text: 'Test ChromaDB connection' }
      }
    ] as SetupStep[]
  }
};

interface SetupGuideProps {
  type: 'ollama' | 'openai' | 'qdrant' | 'pinecone' | 'chroma';
}

export default function SetupGuide({ type }: SetupGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const guide = SETUP_GUIDES[type];

  if (!guide) return null;

  return (
    <div className="mb-3">
      <button
        className="flex w-full items-center gap-2 rounded border p-2 text-left hover:bg-white/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-[var(--vscode-focusBorder,#007acc)]">❓</span>
        <span className="font-medium">{guide.title}</span>
        <span className="ml-auto">{isExpanded ? '▼' : '▶'}</span>
      </button>
      
      {isExpanded && (
        <div className="mt-2 rounded border p-3">
          <SetupInstructions steps={guide.steps} />
        </div>
      )}
    </div>
  );
}
