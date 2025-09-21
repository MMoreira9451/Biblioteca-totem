import React from 'react'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose?: () => void
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-500'
  },
  error: {
    icon: XCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-500'
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-amber-50 border-amber-200 text-amber-800',
    iconClassName: 'text-amber-500'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClassName: 'text-blue-500'
  }
}

export default function Toast({ 
  type, 
  title, 
  message, 
  duration = 4000, 
  onClose 
}: ToastProps) {
  const config = toastConfig[type]
  const Icon = config.icon

  React.useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  return (
    <div className={`rounded-lg border p-4 shadow-lg animate-slide-up ${config.className}`}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${config.iconClassName}`} />
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">
            {title}
          </h4>
          
          {message && (
            <p className="text-sm opacity-90">
              {message}
            </p>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 p-1 hover:bg-black hover:bg-opacity-10 rounded-md transition-colors touch-target"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}