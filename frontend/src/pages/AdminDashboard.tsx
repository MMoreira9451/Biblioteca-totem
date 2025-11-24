import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Search, TrendingUp } from 'lucide-react'
import UserManagement from '../components/admin/UserManagement'
import BookSearch from '../components/admin/BookSearch'
import Statistics from '../components/admin/Statistics'

type TabType = 'users' | 'books' | 'stats'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('stats')

  const tabs = [
    {
      id: 'stats' as TabType,
      label: 'Estadísticas',
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'Métricas y reportes del sistema'
    },
    {
      id: 'users' as TabType,
      label: 'Usuarios',
      icon: <Users className="h-5 w-5" />,
      description: 'Gestión de estudiantes y préstamos'
    },
    {
      id: 'books' as TabType,
      label: 'Búsqueda de Libros',
      icon: <Search className="h-5 w-5" />,
      description: 'Buscar libros y ver disponibilidad'
    }
  ]

  return (
    <div className="kiosk-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="kiosk-button-secondary mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver
            </button>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel Administrativo
              </h1>
              <p className="text-gray-600 mt-1">
                Gestión del sistema de biblioteca
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-2">
            <p className="text-sm text-gray-500 px-4 py-2">
              {tabs.find(t => t.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'stats' && <Statistics />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'books' && <BookSearch />}
        </div>
      </div>
    </div>
  )
}