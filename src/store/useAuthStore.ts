import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  fetchProfile: (sessionUser: any) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  fetchProfile: async (sessionUser) => {
    if (!sessionUser) {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', sessionUser.id)
        .single()

      if (!error && data) {
        set({
          user: {
            id: sessionUser.id,
            email: sessionUser.email!,
            username: data.username || sessionUser.email!.split('@')[0],
            avatar_url: data.avatar_url,
          },
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        // Fallback if profile not found
        set({
          user: {
            id: sessionUser.id,
            email: sessionUser.email!,
            username: sessionUser.email!.split('@')[0],
          },
          isAuthenticated: true,
          isLoading: false,
        })
      }
    } catch {
      set({ isLoading: false })
    }
  },
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false })
  },
}))

// 初始化 Auth 狀態監聽
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    useAuthStore.getState().fetchProfile(session.user)
  } else {
    useAuthStore.getState().setUser(null)
  }
})

supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    useAuthStore.getState().fetchProfile(session.user)
  } else {
    useAuthStore.getState().setUser(null)
  }
})
