import { api, PaginationParams } from './client'
import { Book } from '../components/BookCard'

export interface BookScanResponse {
  book: Book
  available_actions: string[]
}

export interface BookListResponse {
  books: Book[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}

export interface CreateBookRequest {
  title: string
  author: string
  barcode: string
  isbn?: string
  publisher?: string
  publication_year?: number
  edition?: string
  pages?: number
  language?: string
  subject?: string
  description?: string
  location?: string
}

export const booksApi = {
  scanByBarcode: (barcode: string) =>
    api.get<BookScanResponse>(`/books/scan/${encodeURIComponent(barcode)}`),

  getById: (bookId: number) =>
    api.get<{ book: Book }>(`/books/${bookId}`),

  list: (params?: PaginationParams & {
    search?: string
    status?: string
  }) =>
    api.get<BookListResponse>('/books', params),

  create: (data: CreateBookRequest) =>
    api.post<{ message: string; book: Book }>('/books', data),

  update: (bookId: number, data: Partial<CreateBookRequest>) =>
    api.put<{ message: string; book: Book }>(`/books/${bookId}`, data),

  delete: (bookId: number) =>
    api.delete<{ message: string }>(`/books/${bookId}`),
}