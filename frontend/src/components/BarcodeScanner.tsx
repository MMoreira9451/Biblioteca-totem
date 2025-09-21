import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Camera, X, Loader2 } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  isActive: boolean
}

export default function BarcodeScanner({ onScan, onClose, isActive }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')

  useEffect(() => {
    if (isActive) {
      initializeScanner()
    } else {
      stopScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isActive])

  const initializeScanner = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Initialize reader
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader()
      }

      // Get available video devices
      const videoDevices = await readerRef.current.listVideoInputDevices()
      setDevices(videoDevices)

      // Prefer back camera if available
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      )
      
      const deviceId = backCamera?.deviceId || videoDevices[0]?.deviceId
      setSelectedDevice(deviceId || '')

      if (!deviceId) {
        throw new Error('No hay cámaras disponibles')
      }

      await startDecoding(deviceId)
    } catch (err: any) {
      console.error('Error initializing scanner:', err)
      setError(err.message || 'Error al inicializar la cámara')
    } finally {
      setIsLoading(false)
    }
  }

  const startDecoding = async (deviceId: string) => {
    if (!readerRef.current || !videoRef.current) return

    try {
      await readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText()
            console.log('Barcode scanned:', barcode)
            onScan(barcode)
          }
          
          if (error && !(error instanceof Error)) {
            // ZXing throws non-Error objects for "not found" which is normal
            console.debug('Scanner error (normal):', error)
          }
        }
      )
    } catch (err: any) {
      console.error('Error starting decoding:', err)
      setError('Error al acceder a la cámara')
    }
  }

  const stopScanner = () => {
    if (readerRef.current) {
      readerRef.current.reset()
    }
  }

  const switchCamera = async (deviceId: string) => {
    if (!readerRef.current) return
    
    setSelectedDevice(deviceId)
    setIsLoading(true)
    
    try {
      readerRef.current.reset()
      await startDecoding(deviceId)
    } catch (err: any) {
      setError('Error al cambiar cámara')
    } finally {
      setIsLoading(false)
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
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="bg-white p-4">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Iniciando cámara...</p>
                </div>
              </div>
            )}

            {error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                <div className="text-center text-red-700 p-4">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Error de Cámara</h3>
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={initializeScanner}
                    className="mt-4 kiosk-button-primary"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 scanner-overlay">
                  <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
                    <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2">
                      <p className="text-sm font-medium">
                        Posiciona el código de barras dentro del marco
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Camera Selection */}
        {devices.length > 1 && (
          <div className="bg-white p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Cámara
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => switchCamera(e.target.value)}
              className="kiosk-input"
              disabled={isLoading}
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Cámara ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-b-2xl p-4 border-t border-gray-200">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Mantén el código de barras estable dentro del marco para escanearlo automáticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}