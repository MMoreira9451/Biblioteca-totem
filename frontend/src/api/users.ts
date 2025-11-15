import { api, PaginationParams } from './client'

export interface User {
  id: number
  email: string
  student_id?: string
  first_name: string
  last_name: string
  full_name: string
  role: string
  is_active: boolean
}

export const usersApi = {
  list: (params?: PaginationParams & {
    search?: string
    role?: string
    is_active?: boolean
  }) =>
    api.get<{ users: User[] }>('/users', params),

  getById: (userId: number) =>
    api.get<{ user: User }>(`/users/${userId}`),

  update: (userId: number, data: Partial<User>) =>
    api.put<{ message: string; user: User }>(`/users/${userId}`, data),

  deactivate: (userId: number) =>
    api.delete<{ message: string }>(`/users/${userId}`),

  activate: (userId: number) =>
    api.post<{ message: string; user: User }>(`/users/${userId}/activate`),

  resetPassword: (userId: number, newPassword: string) =>
    api.post<{ message: string }>(`/users/${userId}/reset-password`, {
      new_password: newPassword
    }),

  getStats: () =>
    api.get<{
      total_users: number
      active_users: number
      inactive_users: number
      students: number
      admins: number
    }>('/users/stats')
}