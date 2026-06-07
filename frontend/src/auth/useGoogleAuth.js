import { useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export function useGoogleAuth(onSuccess) {
  useEffect(() => {
    if (!window.google) return

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const res = await axios.post(
            `${API}/auth/google`,
            {
              credential: response.credential
            },
            { withCredentials: true }
          )

          onSuccess(res.data.user, res.data.token)
        } catch (err) {
          console.error('Google login failed:', err)
        }
      }
    })

    window.google.accounts.id.renderButton(
      document.getElementById('googleBtn'),
      {
        theme: 'outline',
        size: 'large',
        width: '100%'
      }
    )
  }, [])
}