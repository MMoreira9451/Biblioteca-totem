import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth'

export interface User {
  id: number
  email: string
  student_id?: string
  first_name: string
  last_name: string
  full_name: string
  role: 'STUDENT' | 'ADMIN'
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
  updateUser: (user: User) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null })

          const response = await authApi.login(email, password)
          const { access_token, refresh_token, user } = response.data

          set({
            isAuthenticated: true,
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Error al iniciar sesión'
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      logout: () => {
        // Call logout API if needed
        authApi.logout().catch(() => {
          // Ignore errors on logout
        })

        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          error: null,
        })
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get()
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          const response = await authApi.refreshToken(refreshToken)
          const { access_token } = response.data

          set({ accessToken: access_token })
        } catch (error) {
          // If refresh fails, logout user
          get().logout()
          throw error
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      updateUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)