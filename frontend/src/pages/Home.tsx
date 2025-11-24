import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ScanLine, Info, BookOpen, RefreshCw, ArrowRight, LogOut, BarChart3 } from 'lucide-react'
import BarcodeInput from '../components/BarcodeInput'
import { api, handleApiError } from '../api/client'
import { useAuthStore } from '../store/authStore'

interface LoanInfo {
  id: number
  due_date: string
  status: string
  user?: {
    id: number
    full_name: string
  }
}

interface ScannedBook {
  id: number
  title: string
  author: string
  barcode: string
  status: string
  is_available: boolean
  is_loaned: boolean
  current_loan?: LoanInfo
}

export default function Home() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const [scannerActive, setScannerActive] = useState(false)
  const [scannedBook, setScannedBook] = useState<ScannedBook | null>(null)
  const [isFetchingBook, setIsFetchingBook] = useState(false)

  const openScanner = () => {
    setScannedBook(null)
    setScannerActive(true)
  }

  const handleBarcodeScan = async (barcode: string) => {
    setScannerActive(false)
    await fetchBook(barcode)
  }

  const fetchBook = async (barcode: string) => {
    try {
      setIsFetchingBook(true)
      const response = await api.get(`/books/scan/${encodeURIComponent(barcode)}`)
      setScannedBook(response.data.book)
      toast.success('Libro reconocido correctamente')
    } catch (error) {
      toast.error(handleApiError(error))
      setScannedBook(null)
    } finally {
      setIsFetchingBook(false)
    }
  }

  const handleScannerClose = () => {
    setScannerActive(false)
  }

  const goToRent = () => {
    if (scannedBook) {
      navigate(`/rent?barcode=${encodeURIComponent(scannedBook.barcode)}`)
    }
  }

  const goToReturn = () => {
    if (scannedBook) {
      navigate(`/return?barcode=${encodeURIComponent(scannedBook.barcode)}`)
    }
  }

  const goToExtend = () => {
    if (scannedBook) {
      navigate(`/extend?barcode=${encodeURIComponent(scannedBook.barcode)}`)
    }
  }

  const goToInfo = () => {
    if (scannedBook) {
      navigate(`/book/${encodeURIComponent(scannedBook.barcode)}`)
    }
  }

  const isAdmin = user?.role === 'ADMIN'
  const canRent = scannedBook?.is_available
  const isOwnedByUser =
    scannedBook?.current_loan?.user?.id && user?.id
      ? scannedBook.current_loan.user.id === user.id
      : false
  const canReturnOrExtend = scannedBook?.is_loaned && isOwnedByUser

  return (
    <div className="kiosk-container">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500">Bienvenido</p>
            <h1 className="text-2xl font-semibold text-gray-900">
              {user?.first_name} {user?.last_name}
            </h1>
            <p className="text-gray-600">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="kiosk-button-primary flex items-center"
              >
                <ScanLine className="h-5 w-5 mr-2" />
                Panel administrativo
              </button>
            )}
            <button
              onClick={logout}
              className="kiosk-button-secondary flex items-center"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Salir
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <ScanLine className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Escanea un libro
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Presiona el botón para escanear el código de barras. Según el estado del libro,
            se habilitarán las acciones disponibles para rentarlo, devolverlo, extender el préstamo o ver sus detalles.
          </p>

          <button
            onClick={openScanner}
            className="kiosk-button-primary text-lg px-10 py-4 inline-flex items-center justify-center"
          >
            <ScanLine className="h-6 w-6 mr-2" />
            Escanear libro
          </button>

          {isFetchingBook && (
            <div className="mt-6 flex items-center justify-center text-blue-600">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Buscando información del libro...
            </div>
          )}

          {scannedBook && (
            <div className="mt-10 text-left">
              <div className="border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase text-gray-500 tracking-wide">
                      Libro detectado
                    </p>
                    <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                      {scannedBook.title}
                    </h3>
                    <p className="text-gray-600 text-lg">{scannedBook.author}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Código: {scannedBook.barcode}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-1 rounded-full text-sm font-medium ${
                      scannedBook.is_available
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {scannedBook.is_available ? 'Disponible' : 'No disponible'}
                  </span>
                </div>

                {scannedBook.current_loan && (
                  <div className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
                    <p className="font-medium text-gray-900 mb-1">
                      Estado del préstamo
                    </p>
                    <p>
                      {scannedBook.current_loan.user?.full_name
                        ? `Prestado a ${scannedBook.current_loan.user.full_name}.`
                        : 'Prestado actualmente.'}{' '}
                      Vence el{' '}
                      {new Date(scannedBook.current_loan.due_date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                      .
                    </p>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {canRent && (
                    <>
                      <button
                        onClick={goToRent}
                        className="kiosk-button-primary flex items-center justify-center"
                      >
                        <BookOpen className="h-5 w-5 mr-2" />
                        Rentar libro
                      </button>
                      <button
                        onClick={goToInfo}
                        className="kiosk-button-secondary flex items-center justify-center"
                      >
                        <Info className="h-5 w-5 mr-2" />
                        Ver información
                      </button>
                    </>
                  )}

                  {canReturnOrExtend && (
                    <>
                      <button
                        onClick={goToReturn}
                        className="kiosk-button-success flex items-center justify-center"
                      >
                        <ArrowRight className="h-5 w-5 mr-2" />
                        Devolver libro
                      </button>
                      <button
                        onClick={goToExtend}
                        className="kiosk-button-warning flex items-center justify-center"
                      >
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Extender préstamo
                      </button>
                    </>
                  )}

                  {!canRent && !canReturnOrExtend && (
                    <div className="text-center text-sm text-gray-500 col-span-2">
                      No hay acciones disponibles para este libro.
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={openScanner}
                className="mt-6 kiosk-button-secondary flex items-center justify-center w-full"
              >
                <ScanLine className="h-5 w-5 mr-2" />
                Escanear otro libro
              </button>
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
                  Panel administrativo
                </p>
                <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                  Estadísticas y gestión de biblioteca
                </h3>
                <p className="text-gray-600 mt-2 max-w-2xl">
                  Accede al tablero completo con métricas de préstamos, usuarios activos, libros disponibles y seguimiento detallado de cada ejemplar.
                </p>
              </div>
              <button
                onClick={() => navigate('/admin')}
                className="kiosk-button-primary flex items-center px-6 py-3"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Abrir panel
              </button>
            </div>
          </div>
        )}
      </div>

      <BarcodeInput
        isActive={scannerActive}
        onScan={handleBarcodeScan}
        onClose={handleScannerClose}
      />
    </div>
  )
}
