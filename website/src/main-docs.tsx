import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/styles/theme.css';
import { Docs } from './pages/Docs';

createRoot(document.getElementById('root')!).render(<Docs />);
