import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import { Changelog } from './pages/Changelog';
createRoot(document.getElementById('root')!).render(<Changelog />);
