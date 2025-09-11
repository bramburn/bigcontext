import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoot from './AppRoot.tsx';
import './index.css';

// Enhanced CSS diagnostic logging
console.log('Tailwind CSS imported successfully');

// Check if CSS is properly loaded by testing computed styles
const checkCSSLoading = () => {
  // Create a test element to verify Tailwind classes
  const testElement = document.createElement('div');
  testElement.className = 'flex p-4 bg-red-500';
  testElement.style.position = 'absolute';
  testElement.style.top = '-9999px';
  testElement.style.left = '-9999px';
  document.body.appendChild(testElement);

  const computedStyle = window.getComputedStyle(testElement);
  const diagnostics = {
    display: computedStyle.display,
    padding: computedStyle.padding,
    backgroundColor: computedStyle.backgroundColor,
    timestamp: new Date().toISOString()
  };

  console.log('CSS Loading Diagnostics:', diagnostics);

  // Check if Tailwind classes are working
  const isTailwindWorking = computedStyle.display === 'flex' &&
                           computedStyle.padding !== '0px' &&
                           computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';

  console.log('Tailwind CSS Status:', isTailwindWorking ? 'Working' : 'Not Working');

  // Clean up test element
  document.body.removeChild(testElement);

  return { diagnostics, isTailwindWorking };
};

// Check CSS loading after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(checkCSSLoading, 100);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);
