import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface User {
  id: string
  email: string
  username: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false })
  },
}))

// 初始化 Auth 狀態監聽
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    useAuthStore.getState().setUser({
      id: session.user.id,
      email: session.user.email!,
      username: session.user.email!.split('@')[0],
    })
  } else {
    useAuthStore.getState().setUser(null)
  }
})

supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    useAuthStore.getState().setUser({
      id: session.user.id,
      email: session.user.email!,
      username: session.user.email!.split('@')[0],
    })
  } else {
    useAuthStore.getState().setUser(null)
  }
})
