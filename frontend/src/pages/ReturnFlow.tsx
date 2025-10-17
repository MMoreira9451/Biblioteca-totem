import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, BookCheck, Loader2 } from 'lucide-react'
import BookCard, { Book } from '../components/BookCard'
import { api, handleApiError } from '../api/client'

interface Loan {
  id: number
  book: Book
  loan_date: string
  due_date: string
  return_date: string | null
  extensions_count: number
  is_overdue: boolean
  days_until_due: number
}

export default function ReturnFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const barcode = searchParams.get('barcode')

  const [loan, setLoan] = useState<Loan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isReturning, setIsReturning] = useState(false)

  useEffect(() => {
    if (barcode) {
      fetchLoanByBarcode(barcode)
    }
  }, [barcode])

  const fetchLoanByBarcode = async (bookBarcode: string) => {
    try {
      setIsLoading(true)
      // First get the book by barcode
      const bookResponse = await api.get(`/books/scan/${bookBarcode}`)
      const book = bookResponse.data.book

      // Then get active loans for this book
      const loansResponse = await api.get(`/loans/active`)
      const activeLoan = loansResponse.data.loans.find((l: Loan) => l.book.id === book.id)

      if (!activeLoan) {
        toast.error('Este libro no tiene un préstamo activo')
        setTimeout(() => navigate('/'), 2000)
        return
      }

      setLoan(activeLoan)
    } catch (error: any) {
      const message = handleApiError(error)
      toast.error(message)
      setTimeout(() => navigate('/'), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReturnBook = async () => {
    if (!loan) return

    try {
      setIsReturning(true)
      await api.post('/loans/return', { loan_id: loan.id })

      toast.success('¡Libro devuelto exitosamente!')

      setTimeout(() => navigate('/'), 1500)
    } catch (error: any) {
      const message = handleApiError(error)
      toast.error(message)
    } finally {
      setIsReturning(false)
    }
  }

  const goBack = () => {
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className="kiosk-container">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-xl text-gray-600">Buscando préstamo...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="kiosk-container">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={goBack}
            className="kiosk-button-secondary mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>

          <div className="flex items-center">
            <BookCheck className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Devolver Libro
            </h1>
          </div>
        </div>

        {loan ? (
          <div className="space-y-6">
            <BookCard
              book={loan.book}
              showActions={false}
            />

            <div className="kiosk-card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Información del Préstamo
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Fecha de préstamo:</span>
                  <span className="font-semibold">
                    {new Date(loan.loan_date).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Fecha de vencimiento:</span>
                  <span className="font-semibold">
                    {new Date(loan.due_date).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Extensiones usadas:</span>
                  <span className="font-semibold">
                    {loan.extensions_count} / 2
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`font-semibold ${loan.is_overdue ? 'text-red-600' : 'text-green-600'}`}>
                    {loan.is_overdue ? '⚠️ Vencido' : '✅ A tiempo'}
                  </span>
                </div>
              </div>

              {loan.is_overdue && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold">
                    ⚠️ Este préstamo está vencido por {Math.abs(loan.days_until_due)} días
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handleReturnBook}
                  disabled={isReturning}
                  className="flex-1 kiosk-button-primary bg-green-600 hover:bg-green-700"
                >
                  {isReturning ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <BookCheck className="h-5 w-5 mr-2" />
                      Confirmar Devolución
                    </>
                  )}
                </button>

                <button
                  onClick={goBack}
                  disabled={isReturning}
                  className="kiosk-button-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BookCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Préstamo no encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              No se encontró un préstamo activo para este libro.
            </p>
            <button
              onClick={goBack}
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
