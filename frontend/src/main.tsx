import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialise theme systems on window mount
const theme = localStorage.getItem('samvad-theme') || 'cosmic';
document.documentElement.className = '';
document.documentElement.classList.add(`theme-${theme}`);

const density = localStorage.getItem('samvad-density') || 'comfortable';
document.documentElement.setAttribute('data-density', density);

const scale = localStorage.getItem('samvad-font-scale') || 'medium';
document.documentElement.setAttribute('data-font-scale', scale);

const anim = localStorage.getItem('samvad-animations') || 'true';
document.documentElement.setAttribute('data-animations', anim);

const glass = localStorage.getItem('samvad-glass') || 'true';
document.documentElement.setAttribute('data-glass', glass);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
