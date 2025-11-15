import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  TrendingUp, 
  BookOpen, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Loader2
} from 'lucide-react'
import { api, handleApiError } from '../../api/client'

interface Stats {
  total_books: number
  available_books: number
  loaned_books: number
  total_users: number
  active_students: number
  total_loans: number
  active_loans: number
  returned_loans: number
  overdue_loans: number
  average_loan_duration: number
  most_loaned_books: Array<{
    id: number
    title: string
    author: string
    loan_count: number
  }>
  recent_loans: Array<{
    id: number
    book: {
      title: string
      author: string
    }
    user: {
      full_name: string
    }
    loan_date: string
    due_date: string
  }>
}

export default function Statistics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      
      // Fetch various statistics from different endpoints
      const [booksRes, usersRes, loansRes, activeLoansRes, overdueRes] = await Promise.all([
        api.get('/books', { per_page: 1000 }),
        api.get('/users'),
        api.get('/loans', { per_page: 1000 }),
        api.get('/loans/active'),
        api.get('/loans/overdue')
      ])

      const books = booksRes.data.books
      const users = usersRes.data.users
      const allLoans = loansRes.data.loans
      const activeLoans = activeLoansRes.data.loans
      const overdueLoans = overdueRes.data.overdue_loans

      // Calculate statistics
      const availableBooks = books.filter((b: any) => b.is_available).length
      const loanedBooks = books.filter((b: any) => b.is_loaned).length
      const activeStudents = users.filter((u: any) => 
        u.role === 'STUDENT' && u.is_active
      ).length
      const returnedLoans = allLoans.filter((l: any) => 
        l.status === 'RETURNED'
      ).length

      // Calculate average loan duration
      const completedLoans = allLoans.filter((l: any) => l.return_date)
      const totalDuration = completedLoans.reduce((sum: number, loan: any) => {
        const loanDate = new Date(loan.loan_date)
        const returnDate = new Date(loan.return_date)
        const days = Math.ceil((returnDate.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)
      const avgDuration = completedLoans.length > 0 
        ? Math.round(totalDuration / completedLoans.length) 
        : 0

      // Get most loaned books
      const bookLoanCounts = new Map()
      allLoans.forEach((loan: any) => {
        const bookId = loan.book?.id
        if (bookId) {
          bookLoanCounts.set(bookId, (bookLoanCounts.get(bookId) || 0) + 1)
        }
      })

      const mostLoaned = Array.from(bookLoanCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([bookId, count]) => {
          const book = books.find((b: any) => b.id === bookId)
          return {
            id: bookId,
            title: book?.title || 'Desconocido',
            author: book?.author || 'Desconocido',
            loan_count: count
          }
        })

      // Get recent loans
      const recentLoans = allLoans
        .sort((a: any, b: any) => 
          new Date(b.loan_date).getTime() - new Date(a.loan_date).getTime()
        )
        .slice(0, 5)

      setStats({
        total_books: books.length,
        available_books: availableBooks,
        loaned_books: loanedBooks,
        total_users: users.length,
        active_students: activeStudents,
        total_loans: allLoans.length,
        active_loans: activeLoans.length,
        returned_loans: returnedLoans,
        overdue_loans: overdueLoans.length,
        average_loan_duration: avgDuration,
        most_loaned_books: mostLoaned,
        recent_loans: recentLoans
      })
    } catch (error) {
      const message = handleApiError(error)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Cargando estadísticas...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-lg">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No se pudieron cargar las estadísticas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.total_books}</h3>
          <p className="text-sm text-gray-500 mt-1">Total de Libros</p>
          <div className="mt-2 flex items-center text-xs text-gray-600">
            <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
            {stats.available_books} disponibles
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.active_loans}</h3>
          <p className="text-sm text-gray-500 mt-1">Préstamos Activos</p>
          <div className="mt-2 text-xs text-gray-600">
            {stats.total_loans} préstamos totales
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.total_users}</h3>
          <p className="text-sm text-gray-500 mt-1">Usuarios Totales</p>
          <div className="mt-2 text-xs text-gray-600">
            {stats.active_students} estudiantes activos
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-red-600">{stats.overdue_loans}</h3>
          <p className="text-sm text-gray-500 mt-1">Préstamos Vencidos</p>
          <div className="mt-2 text-xs text-gray-600">
            Requieren atención inmediata
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Performance */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Rendimiento de Préstamos
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Duración Promedio</span>
              <span className="font-semibold text-gray-900">
                {stats.average_loan_duration} días
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Devueltos a Tiempo</span>
              <span className="font-semibold text-green-600">
                {stats.returned_loans}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Tasa de Utilización</span>
              <span className="font-semibold text-blue-600">
                {stats.total_books > 0 
                  ? Math.round((stats.loaned_books / stats.total_books) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Most Loaned Books */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Libros Más Prestados
          </h3>
          
          <div className="space-y-3">
            {stats.most_loaned_books.map((book, index) => (
              <div 
                key={book.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    h-8 w-8 rounded-full flex items-center justify-center font-bold
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'}
                  `}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {book.title}
                    </p>
                    <p className="text-xs text-gray-500">{book.author}</p>
                  </div>
                </div>
                <span className="font-semibold text-blue-600">
                  {book.loan_count}
                </span>
              </div>
            ))}
            
            {stats.most_loaned_books.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No hay datos disponibles
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-purple-600" />
          Actividad Reciente
        </h3>
        
        <div className="space-y-3">
          {stats.recent_loans.map((loan) => (
            <div 
              key={loan.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-1">
                  {loan.book.title}
                </p>
                <p className="text-sm text-gray-600">
                  {loan.book.author}
                </p>
              </div>
              
              <div className="text-right ml-4">
                <p className="text-sm font-medium text-gray-900">
                  {loan.user.full_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(loan.loan_date)} - {formatDate(loan.due_date)}
                </p>
              </div>
            </div>
          ))}
          
          {stats.recent_loans.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No hay préstamos recientes
            </p>
          )}
        </div>
      </div>
    </div>
  )
}