import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  User, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  BookOpen
} from 'lucide-react'
import { api, handleApiError } from '../../api/client'

interface UserData {
  id: number
  email: string
  student_id?: string
  first_name: string
  last_name: string
  full_name: string
  role: string
  is_active: boolean
}

interface LoanData {
  id: number
  book: {
    id: number
    title: string
    author: string
    barcode: string
  }
  loan_date: string
  due_date: string
  return_date?: string
  status: string
  extensions_count: number
  is_overdue: boolean
  days_remaining: number
  days_overdue: number
}

interface UserWithLoans extends UserData {
  active_loans: LoanData[]
  total_loans: number
  overdue_loans: number
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithLoans[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      
      // Get all users
      const usersResponse = await api.get('/users')
      const usersData = usersResponse.data.users
      
      // Get active loans for all users
      const loansResponse = await api.get('/loans/active')
      const activeLoans = loansResponse.data.loans
      
      // Combine data
      const usersWithLoans = usersData.map((user: UserData) => {
        const userLoans = activeLoans.filter((loan: LoanData) => loan.user?.id === user.id)
        const overdueCount = userLoans.filter((loan: LoanData) => loan.is_overdue).length
        
        return {
          ...user,
          active_loans: userLoans,
          total_loans: userLoans.length,
          overdue_loans: overdueCount
        }
      })
      
      setUsers(usersWithLoans)
    } catch (error) {
      const message = handleApiError(error)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUserDetails = (userId: number) => {
    setExpandedUser(expandedUser === userId ? null : userId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, email o ID de estudiante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
            </div>
            <User className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Préstamos Activos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {users.reduce((sum, user) => sum + user.total_loans, 0)}
              </p>
            </div>
            <BookOpen className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Préstamos Vencidos</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {users.reduce((sum, user) => sum + user.overdue_loans, 0)}
              </p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* User Header */}
            <button
              onClick={() => toggleUserDetails(user.id)}
              className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.full_name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {user.email}
                      </span>
                      {user.student_id && (
                        <span>ID: {user.student_id}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Loan Stats */}
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {user.total_loans}
                      </p>
                      <p className="text-xs text-gray-500">Activos</p>
                    </div>
                    
                    {user.overdue_loans > 0 && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {user.overdue_loans}
                        </p>
                        <p className="text-xs text-red-500">Vencidos</p>
                      </div>
                    )}
                  </div>

                  {/* Expand Icon */}
                  {expandedUser === user.id ? (
                    <ChevronUp className="h-6 w-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedUser === user.id && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                {user.active_loans.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Préstamos Activos ({user.active_loans.length})
                    </h4>
                    
                    {user.active_loans.map((loan) => (
                      <div
                        key={loan.id}
                        className={`bg-white rounded-lg p-4 border-l-4 ${
                          loan.is_overdue
                            ? 'border-red-500'
                            : loan.days_remaining <= 3
                            ? 'border-amber-500'
                            : 'border-green-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 mb-1">
                              {loan.book.title}
                            </h5>
                            <p className="text-sm text-gray-600 mb-2">
                              {loan.book.author}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center text-gray-600">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>Prestado: {formatDate(loan.loan_date)}</span>
                              </div>
                              
                              <div className="flex items-center text-gray-600">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>Vence: {formatDate(loan.due_date)}</span>
                              </div>
                              
                              <div className="flex items-center">
                                {loan.is_overdue ? (
                                  <span className="flex items-center text-red-600 font-semibold">
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Vencido hace {loan.days_overdue} días
                                  </span>
                                ) : (
                                  <span className="flex items-center text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {loan.days_remaining} días restantes
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-gray-600">
                                Extensiones: {loan.extensions_count} / 2
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4 text-right">
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              {loan.book.barcode}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Sin préstamos activos</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron usuarios
            </h3>
            <p className="text-gray-600">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  )
}