import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { 
  Search, 
  BookOpen, 
  CheckCircle, 
  XCircle,
  Clock,
  Calendar,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { api, handleApiError } from '../../api/client'

interface Book {
  id: number
  title: string
  author: string
  isbn?: string
  barcode: string
  publisher?: string
  publication_year?: number
  subject?: string
  location?: string
  status: 'AVAILABLE' | 'LOANED' | 'RESERVED' | 'MAINTENANCE'
  is_available: boolean
  is_loaned: boolean
}

interface LoanData {
  id: number
  user: {
    id: number
    full_name: string
    email: string
  }
  loan_date: string
  due_date: string
  status: string
  is_overdue: boolean
  days_remaining: number
  days_overdue: number
}

interface BookWithAvailability extends Book {
  current_loan?: LoanData
  total_copies?: number
  available_copies?: number
  expected_return_date?: string
}

export default function BookSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [books, setBooks] = useState<BookWithAvailability[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchTerm.trim()) {
      toast.error('Por favor ingresa un término de búsqueda')
      return
    }

    try {
      setIsLoading(true)
      setHasSearched(true)
      
      // Search books
      const response = await api.get('/books', {
        search: searchTerm.trim(),
        per_page: 50
      })
      
      const booksData = response.data.books
      
      // Get active loans to determine availability
      const loansResponse = await api.get('/loans/active')
      const activeLoans = loansResponse.data.loans
      
      // Enhance books with loan information
      const enhancedBooks = booksData.map((book: Book) => {
        const bookLoans = activeLoans.filter((loan: any) => 
          loan.book?.id === book.id
        )
        
        const currentLoan = bookLoans[0] // For simplicity, assuming 1 copy per book
        
        // Calculate expected return date
        let expectedReturnDate = null
        if (currentLoan) {
          expectedReturnDate = currentLoan.due_date
        }
        
        return {
          ...book,
          current_loan: currentLoan,
          total_copies: 1,
          available_copies: book.is_available ? 1 : 0,
          expected_return_date: expectedReturnDate
        }
      })
      
      setBooks(enhancedBooks)
    } catch (error) {
      const message = handleApiError(error)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusInfo = (book: BookWithAvailability) => {
    if (book.is_available) {
      return {
        icon: <CheckCircle className="h-6 w-6" />,
        text: 'Disponible',
        color: 'text-green-600 bg-green-50 border-green-200'
      }
    } else if (book.status === 'LOANED') {
      return {
        icon: <XCircle className="h-6 w-6" />,
        text: 'Prestado',
        color: 'text-red-600 bg-red-50 border-red-200'
      }
    } else if (book.status === 'RESERVED') {
      return {
        icon: <Clock className="h-6 w-6" />,
        text: 'Reservado',
        color: 'text-amber-600 bg-amber-50 border-amber-200'
      }
    } else {
      return {
        icon: <AlertCircle className="h-6 w-6" />,
        text: 'En mantenimiento',
        color: 'text-gray-600 bg-gray-50 border-gray-200'
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Libros
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ingresa título, autor, ISBN o tema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className="kiosk-button-primary w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Buscar Libros
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Buscando libros...</p>
            </div>
          ) : books.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Resultados de búsqueda ({books.length})
              </h3>

              {books.map((book) => {
                const statusInfo = getStatusInfo(book)
                
                return (
                  <div
                    key={book.id}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Book Info */}
                        <div className="mb-3">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {book.title}
                          </h4>
                          <p className="text-gray-600">{book.author}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                            {book.publication_year && (
                              <span>📅 {book.publication_year}</span>
                            )}
                            {book.subject && (
                              <span>📚 {book.subject}</span>
                            )}
                            {book.location && (
                              <span>📍 {book.location}</span>
                            )}
                          </div>
                        </div>

                        {/* Availability Status */}
                        <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${statusInfo.color}`}>
                          {statusInfo.icon}
                          <span className="ml-2 font-semibold">{statusInfo.text}</span>
                        </div>

                        {/* Availability Details */}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center text-sm">
                            <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-gray-600">
                              Disponibles: <strong className="text-gray-900">{book.available_copies || 0}</strong> de <strong className="text-gray-900">{book.total_copies || 1}</strong>
                            </span>
                          </div>

                          {!book.is_available && book.expected_return_date && (
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-2 text-amber-500" />
                              <span className="text-gray-600">
                                Devolución esperada: <strong className="text-amber-600">
                                  {formatDate(book.expected_return_date)}
                                </strong>
                              </span>
                            </div>
                          )}

                          {book.current_loan && (
                            <div className="flex items-center text-sm">
                              <User className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="text-gray-600">
                                Prestado a: <strong className="text-blue-600">
                                  {book.current_loan.user.full_name}
                                </strong>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Overdue Warning */}
                        {book.current_loan?.is_overdue && (
                          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center text-red-700">
                              <AlertCircle className="h-5 w-5 mr-2" />
                              <span className="font-semibold">
                                Préstamo vencido hace {book.current_loan.days_overdue} días
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Book Code */}
                      <div className="ml-4 text-right">
                        <span className="text-xs text-gray-500 uppercase block mb-1">Código</span>
                        <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                          {book.barcode}
                        </span>
                        {book.isbn && (
                          <>
                            <span className="text-xs text-gray-500 uppercase block mt-2 mb-1">ISBN</span>
                            <span className="text-xs font-mono text-gray-600">
                              {book.isbn}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron libros
              </h3>
              <p className="text-gray-600">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Búsqueda de Libros
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Ingresa el título, autor, ISBN o tema de un libro para ver su disponibilidad
            y cuándo estará disponible si está prestado.
          </p>
        </div>
      )}
    </div>
  )
}