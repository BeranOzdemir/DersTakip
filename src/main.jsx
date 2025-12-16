import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider, InstitutionProvider } from './contexts'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <InstitutionProvider>
        <App />
      </InstitutionProvider>
    </AuthProvider>
  </StrictMode>,
)
