import { api } from './client'
import { User } from '../store/authStore'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  message: string
  access_token: string
  token_type: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  logout: () =>
    api.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post<RefreshTokenResponse>('/auth/refresh', { refresh_token: refreshToken }),

  getCurrentUser: () =>
    api.get<{ user: User }>('/auth/me'),

  changePassword: (data: ChangePasswordRequest) =>
    api.post('/auth/change-password', data),
}