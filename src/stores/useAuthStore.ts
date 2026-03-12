import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  role: string | null
  loading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setRole: (role: string | null) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
  clearAuth: () =>
    set({ user: null, session: null, role: null, loading: false }),
}))
