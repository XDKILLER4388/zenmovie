import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';

// Register ad-blocking service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(() => console.log('Ad blocker active'))
    .catch(() => {});
}

// Kill popups globally
try { window.open = () => null; } catch (_) {}
try {
  Object.defineProperty(window, 'open', {
    value: () => null,
    writable: true,
    configurable: true
  });
} catch (_) {}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
