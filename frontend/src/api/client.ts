import axios, { AxiosResponse, AxiosError } from 'axios'
import { useAuthStore } from '../store/authStore'

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    // If error is 401 and we haven't already tried to refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      useAuthStore.getState().isAuthenticated
    ) {
      originalRequest._retry = true

      try {
        await useAuthStore.getState().refreshAccessToken()
        
        // Retry original request with new token
        const token = useAuthStore.getState().accessToken
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// API response types
export interface ApiResponse<T = any> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  message: string
  status_code: number
}

export interface PaginationParams {
  page?: number
  per_page?: number
}

export interface PaginationResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}

// Generic API methods
export const api = {
  get: <T = any>(url: string, params?: any): Promise<AxiosResponse<T>> =>
    apiClient.get(url, { params }),
    
  post: <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> =>
    apiClient.post(url, data),
    
  put: <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> =>
    apiClient.put(url, data),
    
  delete: <T = any>(url: string): Promise<AxiosResponse<T>> =>
    apiClient.delete(url),
    
  patch: <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> =>
    apiClient.patch(url, data),
}

// Error handler utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  
  if (error.message) {
    return error.message
  }
  
  return 'Ha ocurrido un error inesperado'
}

export default apiClient