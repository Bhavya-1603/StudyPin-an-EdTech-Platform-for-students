import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/useStore'
import { loginUser, registerUser } from '../auth/firebaseAuth'

function AuthPanel() {
  const navigate = useNavigate()

  const setAuth = useAuthStore((state) => state.setAuth)
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)

  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  })

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const resetForm = () => {
    setForm({ name: '', email: '', password: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let userCred

      if (mode === 'register') {
        userCred = await registerUser(form.email, form.password)
      } else {
        userCred = await loginUser(form.email, form.password)
      }

      const user = userCred.user
      const token = await user.getIdToken()

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      setToken(token)
      setUser(user)
      setAuth({
        user,
        token,
        status: 'authenticated',
        error: null
      })

      toast.success('Login successful')
      navigate('/dashboard')

    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl">

      <div className="mb-6">
        <p className="text-sky-300 text-sm uppercase">{mode}</p>
        <h2 className="text-white text-2xl font-bold">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {mode === 'register' && (
          <input
            placeholder="Name"
            value={form.name}
            onChange={handleChange('name')}
            className="input"
          />
        )}

        <input
          placeholder="Email"
          value={form.email}
          onChange={handleChange('email')}
          className="input"
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={handleChange('password')}
            className="input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-3"
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>

        <button
          disabled={loading}
          className="w-full bg-sky-500 text-white py-3 rounded-xl"
        >
          {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-400">
        {mode === 'login' ? (
          <button onClick={() => setMode('register')}>
            Create account
          </button>
        ) : (
          <button onClick={() => setMode('login')}>
            Back to login
          </button>
        )}
      </div>
    </div>
  )
}

export default AuthPanel