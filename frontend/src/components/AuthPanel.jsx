import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiUrl } from '../utils/api'
import { useAuthStore } from '../store/useStore'

function AuthPanel() {
  const navigate = useNavigate()

  const setAuth = useAuthStore((state) => state.setAuth)
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)

  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    otp: '',
    newPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      otp: '',
      newPassword: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.email || !form.password) {
      return toast.error('Email and password required')
    }

    if (!isValidEmail(form.email)) {
      return toast.error('Invalid email')
    }

    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters')
    }

    const endpoint =
      mode === 'register'
        ? '/api/auth/register'
        : '/api/auth/login'

    const payload =
      mode === 'register'
        ? {
            name: form.name,
            email: form.email,
            password: form.password
          }
        : {
            email: form.email,
            password: form.password
          }

    setLoading(true)

    try {
      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        return toast.error(data.error || 'Auth failed')
      }

      setToken(data.token)
      setUser(data.user)
      setAuth({
        user: data.user,
        token: data.token,
        status: 'authenticated',
        error: null
      })

      toast.success('Success!')
      navigate('/dashboard')
    } catch (err) {
      toast.error('Server error')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()

    if (!form.email) return toast.error('Email required')

    setLoading(true)

    try {
      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      })

      const data = await res.json()

      if (!res.ok) {
        return toast.error(data.error || 'Failed')
      }

      toast.success('Reset code sent')
      setMode('reset')
    } catch {
      toast.error('Server error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()

    if (!form.otp || !form.newPassword) {
      return toast.error('All fields required')
    }

    setLoading(true)

    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          otp: form.otp,
          newPassword: form.newPassword
        })
      })

      const data = await res.json()

      if (!res.ok) {
        return toast.error(data.error || 'Reset failed')
      }

      setToken(data.token)
      setUser(data.user)
      setAuth({
        user: data.user,
        token: data.token,
        status: 'authenticated',
        error: null
      })

      toast.success('Password reset successful')
      navigate('/dashboard')
    } catch {
      toast.error('Server error')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode) => {
    resetForm()
    setMode(newMode)
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl">

      {/* HEADER */}
      <div className="mb-6">
        <p className="text-sky-300 text-sm uppercase tracking-widest">
          {mode}
        </p>
        <h2 className="text-white text-2xl font-bold mt-2">
          {mode === 'login'
            ? 'Welcome back'
            : mode === 'register'
            ? 'Create account'
            : mode === 'forgot'
            ? 'Reset password'
            : 'Enter OTP'}
        </h2>
      </div>

      {/* FORM */}
      <form
        onSubmit={
          mode === 'forgot'
            ? handleForgot
            : mode === 'reset'
            ? handleReset
            : handleSubmit
        }
        className="space-y-4"
      >

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

        {(mode === 'login' || mode === 'register') && (
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
              className="absolute right-3 top-3 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        )}

        {mode === 'reset' && (
          <>
            <input
              placeholder="OTP"
              value={form.otp}
              onChange={handleChange('otp')}
              className="input"
            />
            <input
              placeholder="New Password"
              type="password"
              value={form.newPassword}
              onChange={handleChange('newPassword')}
              className="input"
            />
          </>
        )}

        <button
          disabled={loading}
          className="w-full bg-sky-500 text-white py-3 rounded-xl"
        >
          {loading ? 'Loading...' : 'Continue'}
        </button>
      </form>

      {/* SWITCH MODE */}
      <div className="mt-4 text-center text-sm text-gray-400">
        {mode === 'login' && (
          <>
            <button onClick={() => switchMode('forgot')}>
              Forgot password?
            </button>
            {' · '}
            <button onClick={() => switchMode('register')}>
              Create account
            </button>
          </>
        )}

        {mode !== 'login' && (
          <button onClick={() => switchMode('login')}>
            Back to login
          </button>
        )}
      </div>
    </div>
  )
}

export default AuthPanel