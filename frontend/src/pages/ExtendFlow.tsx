import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Clock, Loader2 } from 'lucide-react'
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

export default function ExtendFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const barcode = searchParams.get('barcode')

  const [loan, setLoan] = useState<Loan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExtending, setIsExtending] = useState(false)

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

  const handleExtendLoan = async () => {
    if (!loan) return

    try {
      setIsExtending(true)
      await api.post('/loans/extend', { loan_id: loan.id })

      toast.success('¡Préstamo extendido exitosamente!')

      setTimeout(() => navigate('/'), 1500)
    } catch (error: any) {
      const message = handleApiError(error)
      toast.error(message)
    } finally {
      setIsExtending(false)
    }
  }

  const goBack = () => {
    navigate('/')
  }

  const calculateNewDueDate = () => {
    if (!loan) return ''
    const currentDue = new Date(loan.due_date)
    currentDue.setDate(currentDue.getDate() + 7)
    return currentDue.toLocaleDateString('es-ES')
  }

  const canExtend = loan && loan.extensions_count < 2 && !loan.is_overdue

  if (isLoading) {
    return (
      <div className="kiosk-container">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-amber-600" />
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
            <Clock className="h-8 w-8 text-amber-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Extender Préstamo
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
                  <span className="text-gray-600">Vencimiento actual:</span>
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
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Días hasta vencimiento:</span>
                  <span className={`font-semibold ${loan.days_until_due < 0 ? 'text-red-600' : loan.days_until_due <= 3 ? 'text-amber-600' : 'text-green-600'}`}>
                    {loan.days_until_due < 0 ? `Vencido hace ${Math.abs(loan.days_until_due)} días` : `${loan.days_until_due} días`}
                  </span>
                </div>
              </div>

              {canExtend ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-green-800 font-semibold mb-2">
                      ✅ Puede extender este préstamo
                    </h3>
                    <div className="text-green-700 text-sm space-y-1">
                      <p>• Extensión: 7 días adicionales</p>
                      <p>• Nueva fecha de vencimiento: {calculateNewDueDate()}</p>
                      <p>• Extensiones restantes: {2 - loan.extensions_count}</p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleExtendLoan}
                      disabled={isExtending}
                      className="flex-1 kiosk-button-primary bg-amber-600 hover:bg-amber-700"
                    >
                      {isExtending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Clock className="h-5 w-5 mr-2" />
                          Confirmar Extensión
                        </>
                      )}
                    </button>

                    <button
                      onClick={goBack}
                      disabled={isExtending}
                      className="kiosk-button-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-red-800 font-semibold mb-2">
                    ❌ No se puede extender este préstamo
                  </h3>
                  <div className="text-red-700 text-sm space-y-1 mb-4">
                    {loan.is_overdue && (
                      <p>• El préstamo está vencido. Por favor devuelva el libro primero.</p>
                    )}
                    {loan.extensions_count >= 2 && (
                      <p>• Ha alcanzado el límite de 2 extensiones para este préstamo.</p>
                    )}
                  </div>

                  <button
                    onClick={goBack}
                    className="kiosk-button-secondary"
                  >
                    Volver al Inicio
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
