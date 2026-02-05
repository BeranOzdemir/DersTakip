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

// Service Worker Registration with Env Vars
if ('serviceWorker' in navigator) {
  const firebaseConfigParams = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });

  navigator.serviceWorker.register(`/firebase-messaging-sw.js?${firebaseConfigParams.toString()}`)
    .then((registration) => {
      console.log('Service Worker registered successfully:', registration.scope);
    })
    .catch((err) => {
      console.error('Service Worker registration failed:', err);
    });
}
