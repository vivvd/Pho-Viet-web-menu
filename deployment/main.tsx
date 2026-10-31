import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import Menu from '../app/menu';
import '../app/globals.css';

createRoot(document.getElementById('root')!).render(
  <>
    <Menu />
    <Analytics />
  </>,
);
