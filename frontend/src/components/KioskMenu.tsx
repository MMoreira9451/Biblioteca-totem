import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  BookCheck, 
  Clock, 
  Info, 
  Settings,
  LogOut,
  QrCode
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

interface MenuOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  action: () => void
  requiresBarcode?: boolean
}

interface KioskMenuProps {
  onBarcodeAction: (action: string) => void
}

export default function KioskMenu({ onBarcodeAction }: KioskMenuProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const menuOptions: MenuOption[] = [
    {
      id: 'rent',
      title: 'Rentar Libro',
      description: 'Escanea un código para rentar un libro disponible',
      icon: <BookOpen className="h-8 w-8" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      requiresBarcode: true,
      action: () => onBarcodeAction('rent')
    },
    {
      id: 'return',
      title: 'Devolver Libro',
      description: 'Escanea el código del libro que deseas devolver',
      icon: <BookCheck className="h-8 w-8" />,
      color: 'bg-green-600 hover:bg-green-700',
      requiresBarcode: true,
      action: () => onBarcodeAction('return')
    },
    {
      id: 'extend',
      title: 'Extender Préstamo',
      description: 'Extiende el tiempo de préstamo de un libro',
      icon: <Clock className="h-8 w-8" />,
      color: 'bg-amber-600 hover:bg-amber-700',
      requiresBarcode: true,
      action: () => onBarcodeAction('extend')
    },
    {
      id: 'info',
      title: 'Ver Información',
      description: 'Consulta los detalles de un libro',
      icon: <Info className="h-8 w-8" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      requiresBarcode: true,
      action: () => onBarcodeAction('info')
    }
  ]

  // Add admin option if user is admin
  if (user?.role === 'ADMIN') {
    menuOptions.push({
      id: 'admin',
      title: 'Panel Administrativo',
      description: 'Acceso a funciones de administración',
      icon: <Settings className="h-8 w-8" />,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => navigate('/admin')
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="kiosk-container">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Biblioteca UAI
          </h1>
          <p className="text-xl text-gray-600">
            Sistema de Autoservicio
          </p>
          
          {/* User welcome */}
          <div className="mt-6 flex items-center justify-between bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {user?.first_name.charAt(0)}{user?.last_name.charAt(0)}
                </span>
              </div>
              <div className="ml-3 text-left">
                <p className="text-lg font-semibold text-gray-900">
                  ¡Bienvenido, {user?.first_name}!
                </p>
                <p className="text-sm text-gray-500">
                  {user?.role === 'ADMIN' ? 'Administrador' : 'Estudiante'} • {user?.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="kiosk-button-secondary flex items-center"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Salir
            </button>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          {menuOptions.map((option) => (
            <div
              key={option.id}
              className="kiosk-card group cursor-pointer transform transition-all duration-200 hover:scale-105"
              onClick={option.action}
            >
              <div className="flex items-start space-x-4">
                <div className={`${option.color} text-white p-4 rounded-xl flex-shrink-0 transition-colors duration-200`}>
                  {option.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    {option.description}
                  </p>
                  
                  {option.requiresBarcode && (
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <QrCode className="h-4 w-4 mr-1" />
                      Requiere escaneo de código
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Acceso Rápido
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onBarcodeAction('rent')}
              className="kiosk-button-primary"
            >
              Rentar
            </button>
            
            <button
              onClick={() => onBarcodeAction('return')}
              className="kiosk-button-success"
            >
              Devolver
            </button>
            
            <button
              onClick={() => onBarcodeAction('extend')}
              className="kiosk-button-warning"
            >
              Extender
            </button>
            
            <button
              onClick={() => onBarcodeAction('info')}
              className="kiosk-button-secondary"
            >
              Información
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              ¿Cómo usar el sistema?
            </h3>
            <div className="text-blue-800 text-sm space-y-1">
              <p>1. Selecciona la acción que deseas realizar</p>
              <p>2. Escanea el código de barras del libro con la cámara</p>
              <p>3. Sigue las instrucciones en pantalla</p>
              <p>4. ¡Listo! Tu operación ha sido completada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}