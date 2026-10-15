import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function Root() {
  const content = (
    <React.StrictMode>
      <App />
      <Toaster position="top-right" />
    </React.StrictMode>
  )

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>
  }

  return content
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
