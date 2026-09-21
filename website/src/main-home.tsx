import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/styles/theme.css';
import { Home } from './pages/Home';

createRoot(document.getElementById('root')!).render(<Home />);
