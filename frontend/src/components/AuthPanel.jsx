import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
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
    password: '',
  })

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
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
        error: null,
      })

      toast.success(mode === 'login' ? 'Signed in successfully' : 'Account created successfully')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm text-slate-900">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
          {mode === 'login' ? 'Welcome Back' : 'Get Started'}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          {mode === 'login' ? 'Sign in to StudyPin' : 'Create your student account'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {mode === 'login'
            ? 'Access your saved notes, deadlines, and dashboard'
            : 'Join thousands of students building intelligent study workflows'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="e.g. Alex Sharma"
                value={form.name}
                onChange={handleChange('name')}
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              placeholder="student@example.com"
              value={form.email}
              onChange={handleChange('email')}
              className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange('password')}
              className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
        {mode === 'login' ? (
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('register')}
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Create one now
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('login')}
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  )
}

export default AuthPanel