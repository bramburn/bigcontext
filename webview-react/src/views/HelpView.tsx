import { useState } from 'react';

export default function HelpView() {
  const [openItems, setOpenItems] = useState<string[]>(['getting-started']);

  const quickStartItems = [
    {
      id: 'setup',
      title: 'Setup & Configuration',
      description: 'Configure your database and embedding provider',
      icon: '⚙️',
      action: 'Go to Setup'
    },
    {
      id: 'indexing',
      title: 'Index Your Code',
      description: 'Start indexing your codebase for search',
      icon: '🗄️',
      action: 'Start Indexing'
    },
    {
      id: 'search',
      title: 'Search Your Code',
      description: 'Use AI-powered semantic search',
      icon: '🔍',
      action: 'Try Search'
    },
    {
      id: 'diagnostics',
      title: 'Check Status',
      description: 'Monitor system health and performance',
      icon: 'ℹ️',
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

  const toggleItem = (item: string) => {
    setOpenItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-auto p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Help & Documentation</h2>
        <p className="text-base opacity-80 mt-2">
          Learn how to use the Code Context Engine effectively
        </p>
      </div>

      <div className="rounded border border-blue-600/40 bg-blue-500/10 p-3 mb-6">
        <strong>New to Code Context Engine?</strong> Start with the Quick Start guide below to get up and running in minutes.
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Quick Start</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStartItems.map((item) => (
            <div key={item.id} className="rounded border p-4 cursor-pointer transition-all duration-200 hover:bg-white/5">
              <div className="pb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{item.icon}</span>
                  <h4 className="text-lg font-medium">{item.title}</h4>
                </div>
                <p className="text-sm opacity-80">{item.description}</p>
              </div>
              <div>
                <button className="w-full rounded border px-3 py-1.5 text-sm hover:bg-white/5 flex justify-between items-center">
                  {item.action}
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Getting Started Guide</h3>
        <div className="space-y-2">
          <div className="rounded border">
            <button
              className="w-full p-3 text-left flex justify-between items-center hover:bg-white/5"
              onClick={() => toggleItem('getting-started')}
            >
              <span className="font-medium">Step-by-Step Setup</span>
              <span className={`transform transition-transform ${openItems.includes('getting-started') ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>
            {openItems.includes('getting-started') && (
              <div className="p-3 border-t">
                <ol className="pl-6 list-decimal space-y-2">
                  <li><strong>Install Dependencies:</strong> Ensure you have Qdrant running locally or accessible remotely.</li>
                  <li><strong>Configure Database:</strong> Go to Setup → Database and enter your Qdrant connection details.</li>
                  <li><strong>Choose Embedding Provider:</strong> Select Ollama (free, local) or OpenAI (requires API key).</li>
                  <li><strong>Test Connections:</strong> Use the test buttons to verify your configuration.</li>
                  <li><strong>Start Indexing:</strong> Navigate to Indexing Status and click "Start Indexing".</li>
                  <li><strong>Search Your Code:</strong> Once indexing completes, use the Search tab to find code.</li>
                </ol>
              </div>
            )}
          </div>

          <div className="rounded border">
            <button
              className="w-full p-3 text-left flex justify-between items-center hover:bg-white/5"
              onClick={() => toggleItem('search-tips')}
            >
              <span className="font-medium">Search Tips & Best Practices</span>
              <span className={`transform transition-transform ${openItems.includes('search-tips') ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>
            {openItems.includes('search-tips') && (
              <div className="p-3 border-t">
                <p className="mb-3">Use natural language queries for best results:</p>
                <div className="font-mono text-sm bg-black/20 p-3 rounded border my-3">
                  • "function that handles user authentication"<br/>
                  • "error handling for database connections"<br/>
                  • "React component for file upload"<br/>
                  • "algorithm for sorting arrays"
                </div>
                <p>You can also save frequently used searches for quick access.</p>
              </div>
            )}
          </div>

          <div className="rounded border">
            <button
              className="w-full p-3 text-left flex justify-between items-center hover:bg-white/5"
              onClick={() => toggleItem('troubleshooting')}
            >
              <span className="font-medium">Troubleshooting Common Issues</span>
              <span className={`transform transition-transform ${openItems.includes('troubleshooting') ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>
            {openItems.includes('troubleshooting') && (
              <div className="p-3 border-t space-y-4">
                <div>
                  <p className="font-semibold">Connection Issues:</p>
                  <ul className="pl-6 list-disc space-y-1 mt-2">
                    <li>Verify Qdrant is running: <code className="bg-black/20 px-1 py-0.5 rounded text-sm">docker ps</code> or check service status</li>
                    <li>Check firewall settings and port accessibility</li>
                    <li>Ensure correct URL format (http://localhost:6333)</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold">Indexing Problems:</p>
                  <ul className="pl-6 list-disc space-y-1 mt-2">
                    <li>Check available disk space and memory</li>
                    <li>Verify file permissions in workspace</li>
                    <li>Review excluded patterns in settings</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {faqItems.map((item, index) => (
            <div key={index} className="rounded border">
              <button
                className="w-full p-3 text-left flex justify-between items-center hover:bg-white/5"
                onClick={() => toggleItem(`faq-${index}`)}
              >
                <span className="font-medium">{item.question}</span>
                <span className={`transform transition-transform ${openItems.includes(`faq-${index}`) ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </button>
              {openItems.includes(`faq-${index}`) && (
                <div className="p-3 border-t">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Additional Resources</h3>
        <div className="space-y-2">
          <div>
            <a href="https://github.com/bramburn/bigcontext" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
              GitHub Repository
            </a>
          </div>
          <div>
            <a href="https://qdrant.tech/documentation/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
              Qdrant Documentation
            </a>
          </div>
          <div>
            <a href="https://ollama.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
              Ollama Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
