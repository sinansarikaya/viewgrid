import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/styles/theme.css';
import { Privacy } from './pages/Privacy';

createRoot(document.getElementById('root')!).render(<Privacy />);
