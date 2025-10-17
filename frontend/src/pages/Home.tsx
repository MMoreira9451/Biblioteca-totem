import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import KioskMenu from '../components/KioskMenu'
import BarcodeInput from '../components/BarcodeInput'

export default function Home() {
  const navigate = useNavigate()
  const [scannerActive, setScannerActive] = useState(false)
  const [currentAction, setCurrentAction] = useState<string>('')

  const handleBarcodeAction = (action: string) => {
    setCurrentAction(action)
    setScannerActive(true)
  }

  const handleBarcodeScan = (barcode: string) => {
    setScannerActive(false)
    
    // Navigate to appropriate flow based on action
    switch (currentAction) {
      case 'rent':
        navigate(`/rent?barcode=${encodeURIComponent(barcode)}`)
        break
      case 'return':
        navigate(`/return?barcode=${encodeURIComponent(barcode)}`)
        break
      case 'extend':
        navigate(`/extend?barcode=${encodeURIComponent(barcode)}`)
        break
      case 'info':
        navigate(`/book/${encodeURIComponent(barcode)}`)
        break
      default:
        toast.error('Acción no reconocida')
    }
  }

  const handleScannerClose = () => {
    setScannerActive(false)
    setCurrentAction('')
  }

  return (
    <>
      <KioskMenu onBarcodeAction={handleBarcodeAction} />

      <BarcodeInput
        isActive={scannerActive}
        onScan={handleBarcodeScan}
        onClose={handleScannerClose}
      />
    </>
  )
}