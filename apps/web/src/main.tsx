import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './AppRouter.tsx';
import './index.css';

document.documentElement.classList.add('dark')

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
)
