import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/useStore'
import { loginUser, registerUser } from '../auth/firebaseAuth'

function AuthPanel() {
  const navigate = useNavigate()

  const setAuth = useAuthStore((state) => state.setAuth)
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successBanner, setSuccessBanner] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (successBanner) setSuccessBanner('')
  }

  const handleModeSwitch = (newMode) => {
    setMode(newMode)
    setSuccessBanner('')
    setShowPassword(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'register') {
        // 1. User must register themselves first
        if (!form.name.trim()) {
          toast.error('Please enter your full name')
          setLoading(false)
          return
        }
        if (!form.email.trim() || !form.password.trim()) {
          toast.error('Email and password are required')
          setLoading(false)
          return
        }

        await registerUser(form.name, form.email, form.password)

        // Store flag indicating this user is registering fresh
        sessionStorage.setItem('justRegisteredEmail', form.email.toLowerCase())
        sessionStorage.setItem('isNewUserRegistration', 'true')

        // Do NOT automatically log in: prompt user to authenticate back
        setMode('login')
        setSuccessBanner(
          `Registration successful! Please sign in with your email (${form.email}) and password to access your dashboard.`
        )
        setForm((prev) => ({ ...prev, password: '' }))
        toast.success('Account created! Please sign in to verify.')
        setLoading(false)
        return
      }

      // 2. User authenticates with credentials: generates signed JWT token
      const authResult = await loginUser(form.email, form.password)
      const token = authResult.token
      const returnedUser = authResult.user

      // Check if user just registered or is logging in for first time
      const wasJustRegistered =
        returnedUser.isNewUser ||
        sessionStorage.getItem('justRegisteredEmail') === form.email.toLowerCase() ||
        sessionStorage.getItem('isNewUserRegistration') === 'true'
      sessionStorage.removeItem('isNewUserRegistration')

      const userObject = {
        id: returnedUser.id || returnedUser.uid || 'user-' + Date.now(),
        uid: returnedUser.uid || returnedUser.id,
        name: returnedUser.name || returnedUser.displayName || form.name || form.email.split('@')[0],
        email: returnedUser.email,
        isNewUser: wasJustRegistered,
        isReturningUser: !wasJustRegistered,
        accountStatus: wasJustRegistered ? 'first_time_student' : 'active_student',
      }

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userObject))

      setToken(token)
      setUser(userObject)
      setAuth({
        user: userObject,
        token,
        status: 'authenticated',
        error: null,
      })

      toast.success(wasJustRegistered ? 'Welcome to StudyPin!' : 'Signed in successfully!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm text-slate-900">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
          {mode === 'login' ? 'Authentication' : 'New Student Registration'}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          {mode === 'login' ? 'Sign in to StudyPin' : 'Register your account'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {mode === 'login'
            ? 'Enter your credentials to access your personal dashboard and notes'
            : 'Create your credentials first, then sign in to activate your workspace'}
        </p>
      </div>

      {successBanner && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">
            <p className="font-semibold text-emerald-950">Registration Complete</p>
            <p className="mt-0.5 text-emerald-800">{successBanner}</p>
          </div>
        </div>
      )}

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
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account & Proceed to Login'}
        </button>
      </form>

      <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
        {mode === 'login' ? (
          <p>
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => handleModeSwitch('register')}
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Register here first
            </button>
          </p>
        ) : (
          <p>
            Already registered?{' '}
            <button
              type="button"
              onClick={() => handleModeSwitch('login')}
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Back to Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  )
}

export default AuthPanel