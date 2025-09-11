import { postMessage } from '../utils/vscodeApi';

export default function NoWorkspaceView() {
  const handleOpenFolder = () => {
    console.log('NoWorkspaceView: Open folder button clicked');
    try {
      postMessage('requestOpenFolder');
      console.log('NoWorkspaceView: requestOpenFolder message sent');
    } catch (error) {
      console.error('NoWorkspaceView: Failed to send requestOpenFolder message:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenFolder();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-8 text-center">
      <div className="max-w-md p-8 rounded border">
        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-2">No Workspace Open</h1>
        </div>
        
        <div>
          <p className="mb-8 opacity-80">
            No workspace is open. Please open a folder to use the Code Context Engine.
          </p>
          
          <button
            className="min-w-[140px] flex items-center gap-2 rounded bg-[var(--vscode-button-background,#0e639c)] px-4 py-2 text-white hover:bg-[var(--vscode-button-hoverBackground,#1177bb)]"
            onClick={handleOpenFolder}
            onKeyDown={handleKeyDown}
          >
            <span className="text-lg">📁</span>
            Open Folder
          </button>
        </div>
      </div>
    </div>
  );
}
