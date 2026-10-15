import { create } from 'zustand'
import { apiUrl, fetchWithAuth } from '../utils/api'

const defaultAuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
}

export const useStore = create((set, get) => ({
  auth: { ...defaultAuthState },
  notes: [],
  savedNotes: [],
  myUploads: [],
  subjects: [],
  dashboard: {
    stats: {
      streak: '1 Day',
      streakTrend: 'Active study consistency',
      studyHours: '0.0 hrs',
      studyHoursTrend: 'Log revision sessions',
      resourcesCount: '0 Notes',
      resourcesTrend: 'Upload or bookmark notes',
      goalsCompleted: '0%',
      goalsTrend: 'Set your first goal',
    },
    activities: [],
    deadlines: [],
    goals: [],
    loading: false,
  },
  resources: {
    notes: [],
    subjects: [],
    loading: false,
    error: null,
  },
  categories: [],

  setAuth: (auth) => set({ auth }),
  setUser: (user) => set((state) => ({ auth: { ...state.auth, user } })),
  setToken: (token) => set((state) => ({ auth: { ...state.auth, token } })),
  setAuthStatus: (status) => set((state) => ({ auth: { ...state.auth, status } })),
  setAuthError: (error) => set((state) => ({ auth: { ...state.auth, error } })),
  clearAuth: () => set({ auth: { ...defaultAuthState }, savedNotes: [], myUploads: [] }),

  // 1. Categories list with counts
  loadCategories: async () => {
    try {
      const response = await fetch(apiUrl('/api/notes/categories'))
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        set({ categories: data })
        return data
      }
    } catch {
      // ignore
    }
  },

  dismissNewUserWelcome: async () => {
    try {
      await fetchWithAuth('/api/auth/complete-onboarding', { method: 'POST' })
    } catch {
      // ignore
    }
    const currentUser = get().auth?.user
    if (currentUser) {
      const updatedUser = { ...currentUser, isNewUser: false, isReturningUser: true }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      set((state) => ({ auth: { ...state.auth, user: updatedUser } }))
    }
  },

  // 1. Session initialization and verification using JWT
  initializeSession: async () => {
    set((state) => ({ auth: { ...state.auth, status: 'loading', error: null } }))
    try {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (!storedToken) {
        set((state) => ({ auth: { ...state.auth, status: 'unauthenticated', token: null, user: null } }))
        return null
      }

      // Verify active session via JWT
      const response = await fetchWithAuth('/api/auth/session')
      const result = await response.json()

      if (response.ok && result.authenticated && result.token) {
        let finalUser = result.user
        if (storedUser) {
          try {
            const parsedStored = JSON.parse(storedUser)
            if (parsedStored.isNewUser !== undefined && result.user.isNewUser === undefined) {
              finalUser = { ...result.user, isNewUser: parsedStored.isNewUser }
            }
          } catch {
            // ignore
          }
        }

        localStorage.setItem('token', result.token)
        localStorage.setItem('user', JSON.stringify(finalUser))
        set({ auth: { user: finalUser, token: result.token, status: 'authenticated', error: null } })
        return { user: finalUser, token: result.token }
      }

      // Session token invalid or expired
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set((state) => ({ auth: { ...state.auth, status: 'unauthenticated', token: null, user: null } }))
      return null
    } catch {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      if (storedToken && storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          set({ auth: { user: parsed, token: storedToken, status: 'authenticated', error: null } })
          return { user: parsed, token: storedToken }
        } catch {
          // invalid json
        }
      }
      set((state) => ({ auth: { ...state.auth, status: 'unauthenticated', token: null, user: null } }))
      return null
    }
  },

  logout: async () => {
    try {
      await fetchWithAuth('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ auth: { ...defaultAuthState }, savedNotes: [], myUploads: [] })
  },

  // 2. Load all notes with search, subject, and category
  loadNotes: async (subject = '', query = '', category = '') => {
    set((state) => ({ resources: { ...state.resources, loading: true, error: null } }))
    try {
      const params = []
      if (query) params.push(`q=${encodeURIComponent(query)}`)
      if (subject && subject !== 'All') params.push(`subject=${encodeURIComponent(subject)}`)
      if (category && category !== 'All') params.push(`category=${encodeURIComponent(category)}`)
      const url = apiUrl(`/api/notes${params.length ? `?${params.join('&')}` : ''}`)
      const response = await fetch(url)
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        set((state) => ({ notes: data, resources: { ...state.resources, notes: data, loading: false } }))
        return data
      }
      set((state) => ({ notes: [], resources: { ...state.resources, notes: [], loading: false } }))
      return []
    } catch (error) {
      set((state) => ({ notes: [], resources: { ...state.resources, error: error.message, loading: false } }))
      return []
    }
  },

  // 3. Load saved notes with authenticated session
  loadSavedNotes: async () => {
    try {
      const response = await fetchWithAuth('/api/notes/saved')
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        set({ savedNotes: data })
        return data
      }
      return []
    } catch {
      return []
    }
  },

  // 4. Save or bookmark note
  saveNote: async (note, shouldSave = true) => {
    try {
      const response = await fetchWithAuth(`/api/notes/${note.id}/save`, { method: 'POST' })
      const result = await response.json()

      const currentSaved = get().savedNotes
      if (shouldSave) {
        if (!currentSaved.some((n) => n.id === note.id)) {
          set({ savedNotes: [note, ...currentSaved] })
        }
      } else {
        set({ savedNotes: currentSaved.filter((n) => n.id !== note.id) })
      }
      return result
    } catch {
      const currentSaved = get().savedNotes
      if (shouldSave) {
        set({ savedNotes: [note, ...currentSaved] })
      } else {
        set({ savedNotes: currentSaved.filter((n) => n.id !== note.id) })
      }
    }
  },

  // 5. Delete note
  deleteNote: async (noteId) => {
    try {
      await fetchWithAuth(`/api/notes/${noteId}`, { method: 'DELETE' })
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== noteId),
        savedNotes: state.savedNotes.filter((n) => n.id !== noteId),
        myUploads: state.myUploads.filter((n) => n.id !== noteId),
      }))
    } catch {
      // ignore
    }
  },

  // 6. Add newly uploaded note
  addNote: (note) =>
    set((state) => ({
      notes: [note, ...state.notes],
      myUploads: [note, ...state.myUploads],
      resources: { ...state.resources, notes: [note, ...state.resources.notes] },
    })),

  // 7. Load real student dashboard with JWT verification
  loadDashboardData: async () => {
    try {
      const response = await fetchWithAuth('/api/users/dashboard')
      const data = await response.json()
      if (response.ok && data.stats) {
        set((state) => ({
          dashboard: {
            ...state.dashboard,
            stats: data.stats,
            isNewUser: data.isNewUser,
            activities: data.activities || [],
            deadlines: data.deadlines || [],
            goals: data.goals || [],
          },
        }))
        return data
      }
    } catch {
      // ignore
    }
  },

  // 8. Add deadline
  addDeadline: async (deadline) => {
    try {
      const response = await fetchWithAuth('/api/users/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deadline),
      })
      const saved = await response.json()
      set((state) => ({
        dashboard: {
          ...state.dashboard,
          deadlines: [saved, ...state.dashboard.deadlines],
        },
      }))
      return saved
    } catch {
      const item = { ...deadline, id: 'dl-' + Date.now(), completed: false }
      set((state) => ({
        dashboard: { ...state.dashboard, deadlines: [item, ...state.dashboard.deadlines] },
      }))
    }
  },

  // 9. Toggle deadline
  toggleDeadline: async (deadlineId, completed) => {
    try {
      await fetchWithAuth(`/api/users/deadlines/${deadlineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })
    } catch {
      // ignore
    }
    set((state) => ({
      dashboard: {
        ...state.dashboard,
        deadlines: state.dashboard.deadlines.map((d) =>
          d.id === deadlineId ? { ...d, completed } : d
        ),
      },
    }))
  },

  // 10. Add goal
  addGoal: async (goal) => {
    try {
      const response = await fetchWithAuth('/api/users/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      })
      const saved = await response.json()
      set((state) => ({
        dashboard: {
          ...state.dashboard,
          goals: [saved, ...state.dashboard.goals],
        },
      }))
      return saved
    } catch {
      const item = { ...goal, id: 'goal-' + Date.now(), current: 0 }
      set((state) => ({
        dashboard: { ...state.dashboard, goals: [item, ...state.dashboard.goals] },
      }))
    }
  },

  // 11. Update goal progress
  updateGoalProgress: async (goalId, current) => {
    try {
      await fetchWithAuth(`/api/users/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current }),
      })
    } catch {
      // ignore
    }
    set((state) => ({
      dashboard: {
        ...state.dashboard,
        goals: state.dashboard.goals.map((g) =>
          g.id === goalId ? { ...g, current } : g
        ),
      },
    }))
  },
}))

export const useAuthStore = (selector) => useStore(selector)
export const useNotesStore = (selector) => useStore(selector)
