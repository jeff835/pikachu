import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  username: string
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (username: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (username) => set({ user: { username }, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'pikachu-auth-storage', // localStorage key
    }
  )
)
