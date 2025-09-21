import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react'
import BookCard, { Book } from '../components/BookCard'
import { api, handleApiError } from '../api/client'

export default function RentFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const barcode = searchParams.get('barcode')
  
  const [book, setBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRenting, setIsRenting] = useState(false)

  useEffect(() => {
    if (barcode) {
      fetchBookByBarcode(barcode)
    }
  }, [barcode])

  const fetchBookByBarcode = async (bookBarcode: string) => {
    try {
      setIsLoading(true)
      const response = await api.get(`/books/scan/${bookBarcode}`)
      setBook(response.data.book)
    } catch (error: any) {
      const message = handleApiError(error)
      toast.error(message)
      
      // If book not found, go back to home
      if (error.response?.status === 404) {
        setTimeout(() => navigate('/'), 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRentBook = async () => {
    if (!book) return

    try {
      setIsRenting(true)
      await api.post('/loans/rent', { book_id: book.id })
      
      toast.success('¡Libro rentado exitosamente!')
      
      // Navigate back to home after short delay
      setTimeout(() => navigate('/'), 1500)
    } catch (error: any) {
      const message = handleApiError(error)
      toast.error(message)
    } finally {
      setIsRenting(false)
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
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-xl text-gray-600">Buscando libro...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="kiosk-container">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={goBack}
            className="kiosk-button-secondary mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Rentar Libro
            </h1>
          </div>
        </div>

        {book ? (
          <div className="space-y-6">
            {/* Book Information */}
            <BookCard
              book={book}
              showActions={false}
            />

            {/* Rental Actions */}
            <div className="kiosk-card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Confirmar Préstamo
              </h2>

              {book.is_available ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-green-800 font-semibold mb-2">
                      ✅ Libro disponible para préstamo
                    </h3>
                    <div className="text-green-700 text-sm space-y-1">
                      <p>• Duración del préstamo: 14 días</p>
                      <p>• Extensiones permitidas: 2</p>
                      <p>• Fecha de vencimiento: {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleRentBook}
                      disabled={isRenting}
                      className="flex-1 kiosk-button-primary"
                    >
                      {isRenting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-5 w-5 mr-2" />
                          Confirmar Préstamo
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={goBack}
                      disabled={isRenting}
                      className="kiosk-button-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-red-800 font-semibold mb-2">
                    ❌ Libro no disponible
                  </h3>
                  <p className="text-red-700 text-sm mb-4">
                    Este libro actualmente está {book.status.toLowerCase()} y no puede ser rentado.
                  </p>
                  
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
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Libro no encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              No se pudo encontrar un libro con el código escaneado.
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