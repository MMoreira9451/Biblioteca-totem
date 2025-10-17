import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <div className="kiosk-container">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="kiosk-button-secondary mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver
        </button>
        
        <div className="text-center mb-8">
          <Settings className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Panel Administrativo
          </h1>
          <p className="text-xl text-gray-600">
            Funcionalidad en desarrollo
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="kiosk-card">
            <h3 className="text-lg font-semibold mb-2">Gestión de Libros</h3>
            <p className="text-gray-600">Crear, editar y administrar el catálogo de libros</p>
          </div>
          
          <div className="kiosk-card">
            <h3 className="text-lg font-semibold mb-2">Gestión de Usuarios</h3>
            <p className="text-gray-600">Administrar estudiantes y permisos</p>
          </div>
          
          <div className="kiosk-card">
            <h3 className="text-lg font-semibold mb-2">Préstamos Activos</h3>
            <p className="text-gray-600">Ver y gestionar préstamos en curso</p>
          </div>
          
          <div className="kiosk-card">
            <h3 className="text-lg font-semibold mb-2">Reportes</h3>
            <p className="text-gray-600">Estadísticas y métricas del sistema</p>
          </div>
        </div>
      </div>
    </div>
  )
}