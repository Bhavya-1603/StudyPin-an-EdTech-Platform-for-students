import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function Login() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!window.google) return

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

      callback: async (response) => {
        try {
          const res = await axios.post(
            `${API}/auth/google`,
            {
              credential: response.credential,
            },
            {
              withCredentials: true,
            }
          )

          // IMPORTANT: backend may NOT return token (cookie-based auth)
          const user = res.data?.user

          if (user) {
            localStorage.setItem('user', JSON.stringify(user))
          }

          navigate('/dashboard')
        } catch (err) {
          console.error('Google login failed:', err)
        }
      },
    })

    window.google.accounts.id.renderButton(
      document.getElementById('googleBtn'),
      {
        theme: 'outline',
        size: 'large',
        width: '100%',
      }
    )
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="mb-6 text-xl font-semibold">Login to StudyPin</h1>
      <div id="googleBtn"></div>
    </div>
  )
}