import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { MatchesProvider } from './lib/MatchesContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MatchesProvider>
          <App />
        </MatchesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
