import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Search, ScanText } from 'lucide-react'
import CameraView from '@/components/CameraView'
import LoadingDots from '@/components/LoadingDots'
import { useTTS } from '@/hooks/useTTS'
import styles from './SearchPage.module.css'

const MOCK_BARCODES = [
  '7790123456789',
  '7791234567890',
  '7792345678901',
  '7793456789012',
  '7794567890123',
]

export default function SearchPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [scanning, setScanning] = useState(true)
  const scanCooldown = useRef(false)
  const { speak: speakText } = useTTS()

  useEffect(() => {
    const timeout = setTimeout(() => {
      speakText('Apunta la cámara al código de barras')
    }, 1000)
    return () => clearTimeout(timeout)
  }, [])

  const handleBarcode = useCallback(
    (barcode: string) => {
      if (scanCooldown.current || isLoading) return
      scanCooldown.current = true
      setIsLoading(true)
      setScanning(false)
      speakText('Buscando producto')

      setTimeout(() => {
        navigate(`/product/${barcode}`)
      }, 300)

      setTimeout(() => {
        scanCooldown.current = false
      }, 3000)
    },
    [navigate, isLoading]
  )

  const handleSearch = useCallback(() => {
    if (isLoading) return
    setIsLoading(true)
    setScanning(false)
    speakText('Buscando producto')

    setTimeout(() => {
      const randomBarcode =
        MOCK_BARCODES[Math.floor(Math.random() * MOCK_BARCODES.length)]
      navigate(`/product/${randomBarcode}`)
    }, 300)
  }, [navigate, isLoading])

  return (
    <div className={styles.page}>
      <div className={styles.cameraFill}>
        <CameraView showScanHint onScan={handleBarcode} scanning={scanning} />
      </div>

      {isLoading && (
        <div className={styles.loadingContainer}>
          <LoadingDots text="Buscando producto..." />
        </div>
      )}

      <div className={styles.overlay}>
        <motion.div
          className={styles.topBar}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className={styles.logo}>VoiceInvenXi</span>
        </motion.div>

        <motion.div
          className={styles.bottomSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <span className={styles.searchHint}>Buscar producto</span>
          <div className={styles.buttonRow}>
            <motion.button
              className={styles.textSearchButton}
              onClick={() => navigate('/search-text')}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <ScanText size={20} />
              <span>Buscar por nombre</span>
            </motion.button>
            <motion.button
              className={styles.searchButton}
              onClick={handleSearch}
              disabled={isLoading}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Search size={28} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
