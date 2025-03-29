import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './pages/index';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
  </StrictMode>
);