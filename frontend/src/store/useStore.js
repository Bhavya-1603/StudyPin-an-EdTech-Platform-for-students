import { create } from 'zustand'
import { apiUrl } from '../utils/api'

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

  setAuth: (auth) => set({ auth }),
  setUser: (user) => set((state) => ({ auth: { ...state.auth, user } })),
  setToken: (token) => set((state) => ({ auth: { ...state.auth, token } })),
  setAuthStatus: (status) => set((state) => ({ auth: { ...state.auth, status } })),
  setAuthError: (error) => set((state) => ({ auth: { ...state.auth, error } })),
  clearAuth: () => set({ auth: { ...defaultAuthState }, savedNotes: [], myUploads: [] }),

  // 1. Session initialization
  initializeSession: async () => {
    set((state) => ({ auth: { ...state.auth, status: 'loading', error: null } }))
    try {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      const headers = {}
      if (storedToken) headers.Authorization = `Bearer ${storedToken}`

      const response = await fetch(apiUrl('/api/auth/refresh-token'), {
        method: 'POST',
        headers,
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok) {
        if (storedToken && storedUser) {
          const parsed = JSON.parse(storedUser)
          set({ auth: { user: parsed, token: storedToken, status: 'authenticated', error: null } })
          return { user: parsed, token: storedToken }
        }
        set((state) => ({ auth: { ...state.auth, status: 'unauthenticated', token: null, user: null } }))
        return null
      }

      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      set({ auth: { user: result.user, token: result.token, status: 'authenticated', error: null } })
      return result
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
      await fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // ignore
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ auth: { ...defaultAuthState }, savedNotes: [], myUploads: [] })
  },

  // 2. Load all notes with search and subject
  loadNotes: async (subject = '', query = '') => {
    set((state) => ({ resources: { ...state.resources, loading: true, error: null } }))
    try {
      const params = []
      if (query) params.push(`q=${encodeURIComponent(query)}`)
      if (subject && subject !== 'All') params.push(`subject=${encodeURIComponent(subject)}`)
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

  // 3. Load saved notes
  loadSavedNotes: async () => {
    try {
      const token = get().auth?.token || localStorage.getItem('token') || 'demo-user-token'
      const response = await fetch(apiUrl('/api/notes/saved'), {
        headers: { Authorization: `Bearer ${token}` },
      })
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
      const token = get().auth?.token || localStorage.getItem('token') || 'demo-user-token'
      const response = await fetch(apiUrl(`/api/notes/${note.id}/save`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
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
      // optimistic fallback
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
      const token = get().auth?.token || localStorage.getItem('token') || 'demo-user-token'
      await fetch(apiUrl(`/api/notes/${noteId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
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

  // 7. Load real student dashboard
  loadDashboardData: async () => {
    try {
      const token = get().auth?.token || localStorage.getItem('token') || 'demo-user-token'
      const response = await fetch(apiUrl('/api/users/dashboard'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok && data.stats) {
        set((state) => ({
          dashboard: {
            ...state.dashboard,
            stats: data.stats,
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
      const token = get().auth?.token || localStorage.getItem('token') || 'demo-user-token'
      const response = await fetch(apiUrl('/api/users/deadlines'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      const token = get().auth?.token || localStorage.getItem('token') || 'demo-user-token'
      await fetch(apiUrl(`/api/users/deadlines/${deadlineId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      const token = get().auth?.token || localStorage.getItem('token') || 'demo-user-token'
      const response = await fetch(apiUrl('/api/users/goals'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      const token = get().auth?.token || localStorage.getItem('token') || 'demo-user-token'
      await fetch(apiUrl(`/api/users/goals/${goalId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
