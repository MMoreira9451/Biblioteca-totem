import {
  Calendar,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

export interface Book {
  id: number
  isbn?: string
  barcode: string
  title: string
  author: string
  publisher?: string
  publication_year?: number
  edition?: string
  pages?: number
  language: string
  subject?: string
  description?: string
  location?: string
  status: 'AVAILABLE' | 'LOANED' | 'RESERVED' | 'MAINTENANCE'
  is_active: boolean
  is_available: boolean
  is_loaned: boolean
  created_at: string
  updated_at?: string
}

export interface Loan {
  id: number
  user_id: number
  book_id: number
  loan_date: string
  due_date: string
  return_date?: string
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'EXTENDED'
  extensions_count: number
  notes?: string
  is_overdue: boolean
  days_remaining: number
  days_overdue: number
  can_extend: boolean
  created_at: string
  updated_at?: string
  user?: {
    id: number
    email: string
    full_name: string
    role: string
  }
  book?: Book
}

interface BookCardProps {
  book: Book
  currentLoan?: Loan
  availableActions?: string[]
  onAction?: (action: string, book: Book) => void
  showActions?: boolean
  compact?: boolean
}

export default function BookCard({ 
  book, 
  currentLoan, 
  availableActions = [], 
  onAction,
  showActions = true,
  compact = false
}: BookCardProps) {
  
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      AVAILABLE: {
        className: 'status-available',
        text: 'Disponible',
        icon: <CheckCircle className="h-4 w-4" />
      },
      LOANED: {
        className: 'status-loaned',
        text: 'Prestado',
        icon: <XCircle className="h-4 w-4" />
      },
      RESERVED: {
        className: 'status-reserved',
        text: 'Reservado',
        icon: <Clock className="h-4 w-4" />
      },
      MAINTENANCE: {
        className: 'status-maintenance',
        text: 'Mantenimiento',
        icon: <AlertTriangle className="h-4 w-4" />
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.MAINTENANCE
    
    return (
      <span className={`${config.className} flex items-center`}>
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </span>
    )
  }

  const getActionButton = (action: string) => {
    const actionConfig = {
      rent: {
        text: 'Rentar',
        className: 'kiosk-button-primary',
        disabled: !book.is_available
      },
      return: {
        text: 'Devolver',
        className: 'kiosk-button-success',
        disabled: !book.is_loaned
      },
      extend: {
        text: 'Extender',
        className: 'kiosk-button-warning',
        disabled: !currentLoan?.can_extend
      },
      info: {
        text: 'Ver Detalles',
        className: 'kiosk-button-secondary',
        disabled: false
      }
    }

    const config = actionConfig[action as keyof typeof actionConfig]
    if (!config) return null

    return (
      <button
        key={action}
        onClick={() => onAction?.(action, book)}
        disabled={config.disabled}
        className={`${config.className} text-sm py-2 px-4 min-h-[2.5rem]`}
      >
        {config.text}
      </button>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (compact) {
    return (
      <div className="book-card">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{book.title}</h3>
            <p className="text-sm text-gray-600 truncate">{book.author}</p>
          </div>
          <div className="ml-3 flex-shrink-0">
            {getStatusBadge(book.status)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="book-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-gray-900 mb-1 leading-tight">
            {book.title}
          </h3>
          <p className="text-lg text-gray-600 mb-2">{book.author}</p>
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            {book.publication_year && (
              <span>📅 {book.publication_year}</span>
            )}
            {book.pages && (
              <span>📄 {book.pages} páginas</span>
            )}
            {book.language && (
              <span>🌐 {book.language.toUpperCase()}</span>
            )}
          </div>
        </div>
        
        <div className="ml-4 flex-shrink-0">
          {getStatusBadge(book.status)}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        {book.isbn && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">ISBN:</span>
            <span className="ml-2 text-gray-600">{book.isbn}</span>
          </div>
        )}
        
        <div className="text-sm">
          <span className="font-medium text-gray-700">Código:</span>
          <span className="ml-2 font-mono text-gray-600">{book.barcode}</span>
        </div>

        {book.publisher && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Editorial:</span>
            <span className="ml-2 text-gray-600">{book.publisher}</span>
          </div>
        )}

        {book.subject && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Materia:</span>
            <span className="ml-2 text-gray-600">{book.subject}</span>
          </div>
        )}

        {book.location && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Ubicación:</span>
            <span className="ml-2 text-gray-600">{book.location}</span>
          </div>
        )}

        {book.description && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Descripción:</span>
            <p className="mt-1 text-gray-600 leading-relaxed">{book.description}</p>
          </div>
        )}
      </div>

      {/* Current Loan Info */}
      {currentLoan && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <User className="h-4 w-4 mr-2" />
            Información del Préstamo
          </h4>
          
          <div className="space-y-2 text-sm">
            {currentLoan.user && (
              <div>
                <span className="font-medium text-gray-700">Usuario:</span>
                <span className="ml-2 text-gray-600">{currentLoan.user.full_name}</span>
              </div>
            )}
            
            <div>
              <span className="font-medium text-gray-700">Fecha de préstamo:</span>
              <span className="ml-2 text-gray-600">{formatDate(currentLoan.loan_date)}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Fecha de vencimiento:</span>
              <span className={`ml-2 ${currentLoan.is_overdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                {formatDate(currentLoan.due_date)}
              </span>
            </div>

            {currentLoan.is_overdue ? (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="font-semibold">
                  Vencido hace {currentLoan.days_overdue} día{currentLoan.days_overdue !== 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {currentLoan.days_remaining} día{currentLoan.days_remaining !== 1 ? 's' : ''} restante{currentLoan.days_remaining !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {currentLoan.extensions_count > 0 && (
              <div className="text-amber-600">
                <span className="font-medium">Extensiones:</span>
                <span className="ml-2">{currentLoan.extensions_count}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && availableActions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableActions.map(action => getActionButton(action))}
        </div>
      )}
    </div>
  )
}