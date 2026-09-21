import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/styles/theme.css';
import { Support } from './pages/Support';

createRoot(document.getElementById('root')!).render(<Support />);
