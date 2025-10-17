import React, { useEffect, useRef, useState } from 'react'
import { Barcode, X, Loader2 } from 'lucide-react'

interface BarcodeInputProps {
  onScan: (barcode: string) => void
  onClose: () => void
  isActive: boolean
}

export default function BarcodeInput({ onScan, onClose, isActive }: BarcodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [barcode, setBarcode] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (isActive && inputRef.current) {
      // Auto-focus when component becomes active
      inputRef.current.focus()
      setBarcode('')
      setIsProcessing(false)
    }
  }, [isActive])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (barcode.trim() && !isProcessing) {
      setIsProcessing(true)
      onScan(barcode.trim())

      // Reset after short delay to prevent double-scanning
      setTimeout(() => {
        setBarcode('')
        setIsProcessing(false)
      }, 500)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Some barcode scanners send Enter automatically
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  if (!isActive) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="relative w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="bg-white rounded-t-2xl p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Escanear Código de Barras
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
            disabled={isProcessing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="bg-white p-8">
          <div className="text-center mb-6">
            <Barcode className="h-24 w-24 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Listo para escanear
            </h3>
            <p className="text-gray-600">
              Use la pistola lectora para escanear el código de barras del libro
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="barcode-input" className="block text-sm font-medium text-gray-700 mb-2">
                Código de Barras
              </label>
              <input
                ref={inputRef}
                id="barcode-input"
                type="text"
                value={barcode}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
                placeholder="Escanee el código de barras..."
                className="w-full px-4 py-4 text-2xl text-center border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoComplete="off"
                autoFocus
              />
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center text-blue-600">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Procesando...</span>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!barcode.trim() || isProcessing}
                className="flex-1 kiosk-button-primary"
              >
                {isProcessing ? 'Procesando...' : 'Confirmar'}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="kiosk-button-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-b-2xl p-4 border-t border-gray-200">
          <div className="text-center text-gray-600">
            <p className="text-sm font-medium mb-2">
              Instrucciones:
            </p>
            <ul className="text-sm space-y-1">
              <li>• Apunte la pistola lectora hacia el código de barras</li>
              <li>• Presione el gatillo para escanear</li>
              <li>• El código se ingresará automáticamente</li>
              <li>• También puede escribir el código manualmente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
