import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import ProductImage from '@/components/ProductImage'
import Barcode from '@/components/Barcode'
import StockBadge from '@/components/StockBadge'
import MicButton from '@/components/MicButton'
import VoiceWave from '@/components/VoiceWave'
import SuccessCheck from '@/components/SuccessCheck'
import LoadingDots from '@/components/LoadingDots'
import { useSTT } from '@/hooks/useSTT'
import { useTTS } from '@/hooks/useTTS'
import { productApi, movementApi } from '@/api'
import type { Product } from '@/types'
import styles from './ProductPage.module.css'

export default function ProductPage() {
  const { barcode } = useParams<{ barcode: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [addedQty, setAddedQty] = useState(0)
  const [movementType, setMovementType] = useState<'in' | 'out'>('in')

  useEffect(() => {
    if (!barcode) {
      setIsLoading(false)
      return
    }

    productApi
      .getByBarcode(barcode)
      .then((data) => {
        setProduct(data)
        speakText(`${data.name}, ${data.stock} ${data.unit || 'unidades'} en stock`)
      })
      .catch(() => {
        navigate(`/new/${barcode}`, { replace: true })
      })
      .finally(() => setIsLoading(false))
  }, [barcode])

  const ttsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { isListening, transcript, interimTranscript, start, stop, isSupported } =
    useSTT()
  const { speak: speakText } = useTTS()

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stop()
    } else {
      start()
    }
  }, [isListening, start, stop])

  const handleTranscriptReady = useCallback(async () => {
    if (transcript && product) {
      setIsProcessing(true)

      const match = transcript.match(/(\d+)/)
      const qty = match ? parseInt(match[1], 10) : 10

      try {
        await movementApi.create({
          productId: product.id,
          quantity: qty,
          type: movementType,
        })

        setProduct((prev) =>
          prev
            ? {
                ...prev,
                stock: movementType === 'in' ? prev.stock + qty : prev.stock - qty,
              }
            : prev
        )
      } catch {
        // Silently handle API errors for now
      }

      setAddedQty(qty)
      setIsProcessing(false)
      setShowSuccess(true)
      ttsTimerRef.current = setTimeout(() => {
        speakText(`${qty} ${product.unit || 'unidades'} ${movementType === 'in' ? 'agregadas' : 'retiradas'}`)
      }, 2000)
    }
  }, [transcript, product, movementType, speakText])

  useEffect(() => {
    if (!isListening && transcript && !isProcessing && !showSuccess) {
      handleTranscriptReady()
    }
  }, [isListening, transcript, isProcessing, showSuccess, handleTranscriptReady])

  const handleSuccessComplete = useCallback(() => {
    setShowSuccess(false)
  }, [])

  useEffect(() => {
    return () => {
      if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current)
    }
  }, [])

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <button className={styles.backButton} onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <span className={styles.logo}>VoiceInvenXi</span>
        </div>
        <div className={styles.content}>
          <LoadingDots text="Cargando producto..." />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <button className={styles.backButton} onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <span className={styles.logo}>VoiceInvenXi</span>
        </div>
        <div className={styles.content}>
          <LoadingDots text="Redirigiendo..." />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.topBar}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button className={styles.backButton} onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <span className={styles.logo}>VoiceInvenXi</span>
      </motion.div>

      <div className={styles.content}>
        <motion.div
          className={styles.productCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ProductImage src={product.imageUrl} alt={product.name} size="lg" />

          <GlassCard>
            <div className={styles.productInfo}>
              <span className={styles.productName}>{product.name}</span>
              <span className={styles.productDetail}>
                {product.brand} · {product.category}
              </span>
              <span className={styles.productDetail}>{product.presentation}</span>
            </div>
          </GlassCard>

          <GlassCard compact>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Barcode value={product.barcode} />
              <StockBadge stock={product.stock} unit={product.unit} />
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          className={styles.registerSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <button
              className={`${styles.typeButton} ${movementType === 'in' ? styles.typeButtonActive : ''}`}
              onClick={() => setMovementType('in')}
            >
              Entrada
            </button>
            <button
              className={`${styles.typeButton} ${movementType === 'out' ? styles.typeButtonActive : ''}`}
              onClick={() => setMovementType('out')}
            >
              Salida
            </button>
          </div>

          <MicButton
            isListening={isListening}
            onClick={handleVoiceToggle}
            disabled={isProcessing || !isSupported}
          />

          <VoiceWave active={isListening} />

          <AnimatePresence mode="wait">
            {isListening && (
              <motion.div
                key="listening"
                className={styles.transcriptBox}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className={styles.transcriptLabel}>Escuchando...</div>
                <div className={styles.transcriptText}>
                  {interimTranscript || 'Habla ahora'}
                </div>
              </motion.div>
            )}

            {!isListening && transcript && !isProcessing && !showSuccess && (
              <motion.div
                key="result"
                className={styles.transcriptBox}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className={styles.transcriptLabel}>Detectado</div>
                <div className={styles.transcriptText}>"{transcript}"</div>
              </motion.div>
            )}
          </AnimatePresence>

          {isProcessing && <LoadingDots text="Procesando..." />}

          {!isListening && !transcript && !isProcessing && (
            <span className={styles.actionHint}>
              Pulsa el micrófono y di algo como<br />
              <strong>"Entraron veinte cajas"</strong>
            </span>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <SuccessCheck
            message={`${addedQty} ${product.unit || 'unidades'} ${movementType === 'in' ? 'agregadas' : 'retiradas'}`}
            onComplete={handleSuccessComplete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
