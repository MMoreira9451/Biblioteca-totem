import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Info, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import BookCard, { Book, Loan } from '../components/BookCard'
import { api, handleApiError } from '../api/client'

const actionLabels: Record<string, { label: string; icon: JSX.Element; color: string }> = {
  rent: {
    label: 'Rentar',
    icon: <CheckCircle className="h-4 w-4 mr-1" />,
    color: 'bg-green-50 text-green-700 border border-green-200'
  },
  return: {
    label: 'Devolver',
    icon: <XCircle className="h-4 w-4 mr-1" />,
    color: 'bg-blue-50 text-blue-700 border border-blue-200'
  },
  extend: {
    label: 'Extender',
    icon: <Clock className="h-4 w-4 mr-1" />,
    color: 'bg-amber-50 text-amber-700 border border-amber-200'
  },
  info: {
    label: 'Información',
    icon: <Info className="h-4 w-4 mr-1" />,
    color: 'bg-purple-50 text-purple-700 border border-purple-200'
  }
}

export default function BookInfo() {
  const { barcode } = useParams<{ barcode: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [currentLoan, setCurrentLoan] = useState<Loan | undefined>()
  const [availableActions, setAvailableActions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!barcode) {
      toast.error('Código inválido')
      navigate('/')
      return
    }
    fetchBookDetails(barcode)
  }, [barcode])

  const fetchBookDetails = async (code: string) => {
    try {
      setIsLoading(true)
      const response = await api.get(`/books/scan/${code}`)
      const bookData = response.data.book as Book & { current_loan?: Loan }
      setBook(bookData)
      setCurrentLoan(bookData.current_loan)
      setAvailableActions(response.data.available_actions || [])
    } catch (error: any) {
      const message = handleApiError(error)
      toast.error(message)
      setTimeout(() => navigate('/'), 1500)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    if (!book) return
    const encoded = encodeURIComponent(book.barcode)
    const routes: Record<string, string> = {
      rent: `/rent?barcode=${encoded}`,
      return: `/return?barcode=${encoded}`,
      extend: `/extend?barcode=${encoded}`
    }
    if (routes[action]) {
      navigate(routes[action])
    }
  }

  if (isLoading) {
    return (
      <div className="kiosk-container">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-xl text-gray-600">Cargando información del libro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="kiosk-container">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="kiosk-button-secondary mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>

          <div className="flex items-center">
            <Info className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Información del Libro
            </h1>
          </div>
        </div>

        {book ? (
          <div className="space-y-6">
            <BookCard
              book={book}
              currentLoan={currentLoan}
              showActions={false}
            />

            <div className="kiosk-card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Estado y Acciones Disponibles
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 uppercase tracking-wide">
                    Estado actual
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {book.status === 'AVAILABLE' ? 'Disponible' : book.status === 'LOANED' ? 'Prestado' : book.status === 'RESERVED' ? 'Reservado' : 'En mantenimiento'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 uppercase tracking-wide">
                    Ubicación
                  </p>
                  <p className="text-lg font-medium text-gray-900 mt-1">
                    {book.location || 'Sin ubicación asignada'}
                  </p>
                </div>
              </div>

              {currentLoan && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-purple-800 font-semibold mb-1">
                    Prestado actualmente
                  </p>
                  <p className="text-purple-700 text-sm">
                    Vence el {new Date(currentLoan.due_date).toLocaleDateString('es-ES')} ·{' '}
                    {currentLoan.is_overdue
                      ? `Vencido hace ${currentLoan.days_overdue} día${currentLoan.days_overdue !== 1 ? 's' : ''}`
                      : `${currentLoan.days_remaining} día${currentLoan.days_remaining !== 1 ? 's' : ''} restantes`}
                  </p>
                </div>
              )}

              {availableActions.length > 0 && (
                <div>
                  <p className="text-gray-700 font-medium mb-2">
                    Acciones rápidas:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableActions.map((action) => {
                      const config = actionLabels[action] || {
                        label: action,
                        icon: <Info className="h-4 w-4 mr-1" />,
                        color: 'bg-gray-100 text-gray-700 border border-gray-200'
                      }
                      return (
                        <button
                          key={action}
                          onClick={() => handleQuickAction(action)}
                          className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${config.color}`}
                        >
                          {config.icon}
                          {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Info className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Libro no encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              No se encontró un libro con el código proporcionado.
            </p>
            <button
              onClick={() => navigate('/')}
              className="kiosk-button-primary"
            >
              Volver al Inicio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
