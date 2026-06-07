import { useGoogleAuth } from '../auth/useGoogleAuth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  useGoogleAuth((user, token) => {
    // store access token (optional if using cookies)
    localStorage.setItem('token', token)

    // optional: store user
    localStorage.setItem('user', JSON.stringify(user))

    navigate('/dashboard')
  })

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="mb-6 text-xl font-semibold">Login to StudyPin</h1>

      <div id="googleBtn"></div>
    </div>
  )
}