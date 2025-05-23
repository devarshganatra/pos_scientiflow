import React from 'react';
import ReactDOM from 'react-dom/client';  // ✅ updated import
import './index.css';                     // ✅ your global styles
import App from './App';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const root = ReactDOM.createRoot(document.getElementById('root'));  // ✅ updated
root.render(
  <React.StrictMode>
    <DndProvider backend={HTML5Backend}>
      <App />
    </DndProvider>
  </React.StrictMode>
);
