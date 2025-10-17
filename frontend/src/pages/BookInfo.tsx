import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Info } from 'lucide-react'

export default function BookInfo() {
  const navigate = useNavigate()

  return (
    <div className="kiosk-container">
      <div className="max-w-2xl mx-auto text-center">
        <button
          onClick={() => navigate('/')}
          className="kiosk-button-secondary mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver
        </button>
        
        <Info className="h-16 w-16 text-purple-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Información del Libro
        </h1>
        <p className="text-xl text-gray-600">
          Funcionalidad en desarrollo
        </p>
      </div>
    </div>
  )
}