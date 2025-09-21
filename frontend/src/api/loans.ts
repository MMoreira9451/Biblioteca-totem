import { api, PaginationParams } from './client'
import { Loan } from '../components/BookCard'

export interface RentBookRequest {
  book_id: number
  user_id?: number
  notes?: string
}

export interface ReturnBookRequest {
  loan_id: number
  notes?: string
}

export interface ExtendLoanRequest {
  loan_id: number
  extension_days?: number
}

export interface LoansListResponse {
  loans: Loan[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}

export interface OverdueLoansResponse {
  overdue_loans: Loan[]
  total_overdue: number
}

export const loansApi = {
  rent: (data: RentBookRequest) =>
    api.post<{ message: string; loan: Loan }>('/loans/rent', data),

  return: (data: ReturnBookRequest) =>
    api.post<{ message: string; loan: Loan }>('/loans/return', data),

  extend: (data: ExtendLoanRequest) =>
    api.post<{ message: string; loan: Loan }>('/loans/extend', data),

  getUserLoans: (userId: number, params?: PaginationParams & {
    status?: string
  }) =>
    api.get<LoansListResponse>(`/loans/user/${userId}`, params),

  listAll: (params?: PaginationParams & {
    status?: string
    user_email?: string
    book_barcode?: string
  }) =>
    api.get<LoansListResponse>('/loans', params),

  getOverdue: () =>
    api.get<OverdueLoansResponse>('/loans/overdue'),

  getById: (loanId: number) =>
    api.get<{ loan: Loan }>(`/loans/${loanId}`),
}