import { create } from 'zustand'
import { apiUrl } from '../utils/api'

const defaultAuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
}

export const useStore = create((set) => ({
  auth: { ...defaultAuthState },
  notes: [],
  subjects: [],
  recommendations: [],
  resources: {
    notes: [],
    subjects: [],
    recommendations: [],
    stats: {},
    loading: false,
    error: null,
  },

  setAuth: (auth) => set({ auth }),
  setUser: (user) => set((state) => ({ auth: { ...state.auth, user } })),
  setToken: (token) => set((state) => ({ auth: { ...state.auth, token } })),
  setAuthStatus: (status) => set((state) => ({ auth: { ...state.auth, status } })),
  setAuthError: (error) => set((state) => ({ auth: { ...state.auth, error } })),
  clearAuth: () => set({ auth: { ...defaultAuthState } }),

  initializeSession: async () => {
    set((state) => ({ auth: { ...state.auth, status: 'loading', error: null } }))
    try {
      const response = await fetch(apiUrl('/api/auth/refresh-token'), {
        method: 'POST',
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok) {
        set((state) => ({ auth: { ...state.auth, status: 'unauthenticated', token: null, user: null } }))
        return null
      }
      set({ auth: { user: result.user, token: result.token, status: 'authenticated', error: null } })
      return result
    } catch (error) {
      set((state) => ({ auth: { ...state.auth, status: 'unauthenticated', token: null, user: null, error: error.message } }))
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
      // ignore network errors while logging out
    }
    set({ auth: { ...defaultAuthState } })
  },

  setResources: (resources) => set({ resources, notes: resources.notes || [], subjects: resources.subjects || [], recommendations: resources.recommendations || [] }),
  setNotes: (notes) => set((state) => ({ notes, resources: { ...state.resources, notes } })),
  setSubjects: (subjects) => set((state) => ({ subjects, resources: { ...state.resources, subjects } })),
  setRecommendations: (recommendations) => set((state) => ({ recommendations, resources: { ...state.resources, recommendations } })),
  setStats: (stats) => set((state) => ({ resources: { ...state.resources, stats } })),
  setResourcesLoading: (loading) => set((state) => ({ resources: { ...state.resources, loading } })),
  setResourcesError: (error) => set((state) => ({ resources: { ...state.resources, error } })),

  loadNotes: async (subject = '', query = '') => {
    set((state) => ({ resources: { ...state.resources, loading: true, error: null } }))
    try {
      const params = []
      if (query) params.push(`q=${encodeURIComponent(query)}`)
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
      const url = apiUrl(`/api/notes${params.length ? `?${params.join('&')}` : ''}`)
      const response = await fetch(url)
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        set((state) => ({ notes: data, resources: { ...state.resources, notes: data, loading: false } }))
        return data
      }
      set((state) => ({ resources: { ...state.resources, error: data.error || 'Unable to load notes', loading: false } }))
      return []
    } catch (error) {
      set((state) => ({ resources: { ...state.resources, error: error.message || 'Network error', loading: false } }))
      return []
    }
  },

  loadSubjects: async () => {
    try {
      const response = await fetch(apiUrl('/api/notes/subjects'))
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        set((state) => ({ subjects: data, resources: { ...state.resources, subjects: data } }))
        return data
      }
      return []
    } catch {
      return []
    }
  },

  addNote: (note) => set((state) => ({ resources: { ...state.resources, notes: [note, ...(state.resources.notes || [])] } })),
}))

export const useAuthStore = (selector) => useStore(selector)
export const useNotesStore = (selector) => useStore(selector)
