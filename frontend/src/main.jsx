import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider }         from './context/AuthContext'
import { LangProvider }         from './context/LangContext'
import { SubscriptionProvider } from './context/SubscriptionContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  fontFamily: 'IBM Plex Sans Arabic, system-ui, sans-serif',
                  fontSize: '0.9rem',
                  borderRadius: '10px',
                },
                success: { style: { background: '#0f4c35', color: '#fff' } },
                error:   { style: { background: '#c0392b', color: '#fff' } },
              }}
            />
          </SubscriptionProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>
)
