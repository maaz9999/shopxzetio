import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { BrowserRouter } from 'react-router-dom';
import '../css/style.css';
import '../css/admin.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
