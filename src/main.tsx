import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/Auth'
import { CartProvider } from './context/Cart'
import { CatalogProvider } from './context/Catalog'
import { LangProvider } from './context/Lang'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <CatalogProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </CatalogProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
)
