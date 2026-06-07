import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function Login() {
  const navigate = useNavigate()

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) {
        console.error('Google script not loaded')
        return
      }

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          console.log('Google credential received:', response.credential)

          try {
            const res = await axios.post(
              `${API}/auth/google`,
              { credential: response.credential },
              { withCredentials: true }
            )

            console.log('Backend response:', res.data)

            navigate('/dashboard')
          } catch (err) {
            console.error('Login failed:', err)
          }
        },
      })

      const btn = document.getElementById('googleBtn')

      if (btn) {
        window.google.accounts.id.renderButton(btn, {
          theme: 'outline',
          size: 'large',
          width: '100%',
        })
      } else {
        console.error('googleBtn div not found')
      }
    }

    // wait for script load
    const timer = setInterval(() => {
      if (window.google) {
        clearInterval(timer)
        initGoogle()
      }
    }, 100)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="mb-6 text-xl font-semibold">Login to StudyPin</h1>

      <div id="googleBtn"></div>
    </div>
  )
}