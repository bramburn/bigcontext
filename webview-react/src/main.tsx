import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoot from './AppRoot.tsx';
import './index.css';

// Log CSS import for debugging
console.log('Tailwind CSS imported successfully');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);
