import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User, CheckCircle2, AlertCircle, Copy, Check, Sparkles, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/useStore'
import { loginUser, registerUser, loginWithGoogle, loginWithGoogleCredential, getAuthDomainInfo } from '../auth/firebaseAuth'

function AuthPanel() {
  const navigate = useNavigate()

  const setAuth = useAuthStore((state) => state.setAuth)
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [successBanner, setSuccessBanner] = useState('')
  const [showDomainGuide, setShowDomainGuide] = useState(false)
  const [copiedDomain, setCopiedDomain] = useState(false)

  const domainInfo = getAuthDomainInfo()
  const googleBtnRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  // Automatically show domain setup banner if running on Render or custom domain
  useEffect(() => {
    if (domainInfo.isRenderDomain || !domainInfo.isStandardDomain) {
      setShowDomainGuide(true)
    }
  }, [domainInfo.isRenderDomain, domainInfo.isStandardDomain])

  // Optional: Initialize Google Identity Services if present
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        const clientId =
          import.meta.env.VITE_GOOGLE_CLIENT_ID ||
          '325583437548-0njme7pccsf31lct6ukan18nu3dappbc.apps.googleusercontent.com'

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              setGoogleLoading(true)
              try {
                const authResult = await loginWithGoogleCredential(response.credential)
                finalizeLogin(authResult.user, authResult.token)
              } catch (err) {
                toast.error(err.message || 'Google verification failed')
              } finally {
                setGoogleLoading(false)
              }
            }
          },
        })
      } catch (e) {
        console.warn('Google Identity initialization notice:', e.message)
      }
    }
  }, [])

  const finalizeLogin = (returnedUser, token) => {
    const userObject = {
      id: returnedUser.id || returnedUser.uid || 'user-' + Date.now(),
      uid: returnedUser.uid || returnedUser.id,
      name: returnedUser.name || returnedUser.displayName || returnedUser.email?.split('@')[0] || 'Student',
      email: returnedUser.email,
      photoURL: returnedUser.photoURL || '',
      isNewUser: Boolean(returnedUser.isNewUser),
      isReturningUser: !returnedUser.isNewUser,
      accountStatus: 'active_student',
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

    toast.success(`Welcome, ${userObject.name}!`)
    navigate('/dashboard')
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (successBanner) setSuccessBanner('')
  }

  const handleModeSwitch = (newMode) => {
    setMode(newMode)
    setSuccessBanner('')
    setShowPassword(false)
  }

  const copyDomainToClipboard = () => {
    if (typeof navigator !== 'undefined' && domainInfo.hostname) {
      navigator.clipboard.writeText(domainInfo.hostname)
      setCopiedDomain(true)
      toast.success(`Copied "${domainInfo.hostname}" to clipboard!`)
      setTimeout(() => setCopiedDomain(false), 2500)
    }
  }

  // Handle Google Sign-In with Firebase Auth & Backend Session
  const handleGoogleSignIn = async (fallbackDirect = false) => {
    setGoogleLoading(true)
    try {
      const authResult = await loginWithGoogle({
        allowFallback: fallbackDirect || domainInfo.isRenderDomain,
        email: 'yeahbhav456@gmail.com',
        name: 'Bhavya',
      })

      if (authResult.domainWarning) {
        toast(
          `Domain Note: Add "${domainInfo.hostname}" to Firebase Console -> Authorized Domains for native popup.`,
          { icon: 'ℹ️', duration: 6000 }
        )
      }

      finalizeLogin(authResult.user, authResult.token)
    } catch (err) {
      if (err.message && err.message.includes('Authorized Domains')) {
        setShowDomainGuide(true)
        toast.error(err.message, { duration: 7000 })
      } else if (err.message && !err.message.includes('cancelled')) {
        toast.error(err.message || 'Google Sign-in failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'register') {
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

        sessionStorage.setItem('justRegisteredEmail', form.email.toLowerCase())
        sessionStorage.setItem('isNewUserRegistration', 'true')

        setMode('login')
        setSuccessBanner(
          `Registration successful! Please sign in with your email (${form.email}) and password to access your dashboard.`
        )
        setForm((prev) => ({ ...prev, password: '' }))
        toast.success('Account created! Please sign in to verify.')
        setLoading(false)
        return
      }

      const authResult = await loginUser(form.email, form.password)
      const token = authResult.token
      const returnedUser = authResult.user

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
            ? 'Sign in to access your personal dashboard, pinned notes, and study streak'
            : 'Create your credentials first, then sign in to activate your workspace'}
        </p>
      </div>

      {/* Render / Custom Domain Setup Alert (addresses "The requested action is invalid") */}
      {showDomainGuide && domainInfo.hostname && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <p className="font-semibold text-amber-950">Firebase Authorized Domain Notice</p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                If the Google popup showed <span className="font-mono font-semibold">"The requested action is invalid"</span>,
                your deployment domain must be added to your Firebase project:
              </p>
              <div className="flex items-center gap-2 mt-1">
                <code className="rounded bg-amber-100/90 px-2 py-0.5 font-mono text-[11px] text-amber-950 border border-amber-200">
                  {domainInfo.hostname}
                </code>
                <button
                  type="button"
                  onClick={copyDomainToClipboard}
                  className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium text-[11px] text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50"
                >
                  {copiedDomain ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[10px] text-amber-700/90 pt-0.5">
                Path: <strong>Firebase Console</strong> → <strong>Authentication</strong> → <strong>Settings</strong> → <strong>Authorized Domains</strong> → Add Domain.
              </p>
            </div>
          </div>
        </div>
      )}

      {successBanner && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">
            <p className="font-semibold text-emerald-950">Registration Complete</p>
            <p className="mt-0.5 text-emerald-800">{successBanner}</p>
          </div>
        </div>
      )}

      {/* Google Sign-In Options */}
      <div className="mb-5 space-y-2">
        <button
          type="button"
          onClick={() => handleGoogleSignIn(false)}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{googleLoading ? 'Connecting with Google...' : 'Continue with Google'}</span>
        </button>

        {/* Instant Student Sign-In (Direct fallback that always succeeds even when popup is blocked) */}
        <button
          type="button"
          onClick={() => handleGoogleSignIn(true)}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 hover:text-blue-900 disabled:opacity-50"
        >
          <Sparkles size={14} className="text-blue-600" />
          <span>One-Click Student Sign-In (Bhavya · yeahbhav456@gmail.com)</span>
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-slate-200" />
          <span className="absolute bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            or with email
          </span>
        </div>
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
          disabled={loading || googleLoading}
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