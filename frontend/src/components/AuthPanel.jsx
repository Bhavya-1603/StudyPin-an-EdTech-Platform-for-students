import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import { apiUrl } from '../utils/api'
import { useAuthStore } from '../store/useStore'

function AuthPanel() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)

  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', otp: '', newPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', otp: '', newPassword: '' })
  }

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error('Google login failed')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(apiUrl('/api/auth/google'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })
      const result = await response.json()
      if (!response.ok) {
        toast.error(result.error || 'Google sign-in failed')
        return
      }

      setToken(result.token)
      setUser(result.user)
      setAuth({ user: result.user, token: result.token, status: 'authenticated', error: null })
      toast.success('Signed in successfully')
      navigate('/dashboard')
    } catch (error) {
      toast.error('Unable to sign in. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (mode === 'register' && !form.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!form.email.trim()) {
      toast.error('Email is required')
      return
    }
    if (!isValidEmail(form.email)) {
      toast.error('Please enter a valid email address')
      return
    }
    if (!form.password.trim()) {
      toast.error('Password is required')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
    const payload = {
      email: form.email,
      password: form.password,
      ...(mode === 'register' ? { name: form.name } : {}),
    }

    setLoading(true)

    try {
      const response = await fetch(apiUrl(endpoint), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Authentication failed')
        return
      }

      setToken(result.token)
      setUser(result.user)
      setAuth({ user: result.user, token: result.token, status: 'authenticated', error: null })
      toast.success('Success! Redirecting...')
      navigate('/dashboard')
    } catch (error) {
      toast.error('Unable to connect to StudyPin backend.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (event) => {
    event.preventDefault()

    if (!form.email.trim()) {
      toast.error('Email is required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })
      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Unable to send reset code.')
        return
      }

      toast.success('If that email exists, a reset code has been sent.')
      setMode('reset')
    } catch (error) {
      toast.error('Unable to send reset code. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (event) => {
    event.preventDefault()

    if (!form.email.trim()) {
      toast.error('Email is required')
      return
    }
    if (!form.otp.trim()) {
      toast.error('OTP code is required')
      return
    }
    if (!form.newPassword.trim()) {
      toast.error('New password is required')
      return
    }
    if (form.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: form.otp, newPassword: form.newPassword }),
      })
      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Unable to reset password.')
        return
      }

      setToken(result.token)
      setUser(result.user)
      setAuth({ user: result.user, token: result.token, status: 'authenticated', error: null })
      toast.success('Password reset successfully. Redirecting...')
      navigate('/dashboard')
    } catch (error) {
      toast.error('Unable to reset password. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const setPanelMode = (newMode) => {
    resetForm()
    setMode(newMode)
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            {mode === 'register'
              ? 'Create Account'
              : mode === 'forgot'
              ? 'Reset Password'
              : mode === 'reset'
              ? 'Verify OTP'
              : 'Welcome Back'}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {mode === 'register'
              ? 'Start learning with AI'
              : mode === 'login'
              ? 'Sign in to personalize'
              : mode === 'forgot'
              ? 'Send a reset code to your email'
              : 'Enter the code and choose a new password'}
          </h3>
        </div>
        {mode !== 'reset' && (
          <button
            type="button"
            onClick={() => setPanelMode(mode === 'login' ? 'register' : 'login')}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-sky-400"
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        )}
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={mode === 'forgot' ? handleForgot : mode === 'reset' ? handleReset : handleSubmit}
      >
        {mode === 'register' && (
          <label className="block text-sm text-slate-300">
            Name
            <input
              value={form.name}
              onChange={handleChange('name')}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-sky-400"
              placeholder="Your name"
            />
          </label>
        )}

        <label className="block text-sm text-slate-300">
          Email
          <input
            value={form.email}
            onChange={handleChange('email')}
            type="email"
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-sky-400"
            placeholder="you@example.com"
          />
        </label>

        {(mode === 'login' || mode === 'register') && (
          <label className="block text-sm text-slate-300">
            Password
            <div className="relative mt-2">
              <input
                value={form.password}
                onChange={handleChange('password')}
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 pr-12 text-white outline-none focus:border-sky-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-sky-400"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        )}

        {mode === 'reset' && (
          <>
            <label className="block text-sm text-slate-300">
              OTP Code
              <input
                value={form.otp}
                onChange={handleChange('otp')}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-sky-400"
                placeholder="Enter the code from email"
              />
            </label>
            <label className="block text-sm text-slate-300">
              New Password
              <input
                value={form.newPassword}
                onChange={handleChange('newPassword')}
                type={showPassword ? 'text' : 'password'}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 pr-12 text-white outline-none focus:border-sky-400"
                placeholder="New password"
              />
            </label>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-3xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? 'Processing...'
            : mode === 'register'
            ? 'Create account'
            : mode === 'login'
            ? 'Sign in'
            : mode === 'forgot'
            ? 'Send reset code'
            : 'Reset password'}
        </button>
      </form>

      {mode === 'login' && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <button
            type="button"
            onClick={() => setPanelMode('forgot')}
            className="text-sky-300 hover:text-sky-200"
          >
            Forgot password?
          </button>
          <button
            type="button"
            onClick={() => setPanelMode('register')}
            className="text-slate-300 hover:text-slate-100"
          >
            Create account
          </button>
        </div>
      )}

      {mode !== 'login' && mode !== 'register' && (
        <div className="mt-4 text-sm text-slate-400">
          <button
            type="button"
            onClick={() => setPanelMode('login')}
            className="text-sky-300 hover:text-sky-200"
          >
            Back to login
          </button>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-800" />
        <span className="text-xs uppercase tracking-[0.3em] text-slate-500">or</span>
        <span className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="mt-6">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => toast.error('Google sign-in failed')}
        />
      </div>
    </div>
  )
}

export default AuthPanel
