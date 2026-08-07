import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, ArrowDown, ArrowUp, Package } from 'lucide-react'
import { GlassCard, StockBadge, VoiceWave, SuccessAnimation, SkeletonLoader, useToast } from '@/components/ui'
import { useSTT } from '@/hooks/useSTT'
import { useTTS } from '@/hooks/useTTS'
import { productApi, movementApi } from '@/api'
import type { Product } from '@/types'

export function ProductPage() {
  const { barcode } = useParams<{ barcode: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isListening, transcript, interimTranscript, start, stop, isSupported, error, reset } = useSTT()
  const { speak } = useTTS()

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [movementType, setMovementType] = useState<'in' | 'out'>('in')
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastMovement, setLastMovement] = useState<{ quantity: number; type: 'in' | 'out' } | null>(null)

  useEffect(() => {
    if (!barcode) return

    const fetchProduct = async () => {
      setIsLoading(true)
      try {
        const data = await productApi.getByBarcode(barcode)
        setProduct(data)
        speak(`${data.name}, ${data.stock} unidades en stock`)
      } catch {
        navigate(`/new/${barcode}`, { replace: true })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [barcode])

  useEffect(() => {
    if (!transcript || !product) return

    const numberMatch = transcript.match(/\d+/)
    if (numberMatch) {
      const quantity = parseInt(numberMatch[0], 10)
      handleMovement(quantity)
    }
  }, [transcript])

  const handleMovement = useCallback(async (quantity: number) => {
    if (!product) return

    try {
      await movementApi.create({
        productId: product.id,
        quantity,
        type: movementType,
      })

      setLastMovement({ quantity, type: movementType })
      setShowSuccess(true)
      setProduct((prev) => prev ? {
        ...prev,
        stock: movementType === 'in' ? prev.stock + quantity : prev.stock - quantity,
      } : null)

      setTimeout(() => {
        speak(`${quantity} unidades ${movementType === 'in' ? 'agregadas' : 'retiradas'}. Stock actual: ${movementType === 'in' ? (product.stock + quantity) : (product.stock - quantity)}`)
      }, 2500)
    } catch {
      showToast({ variant: 'error', message: 'Error al registrar movimiento' })
    }
  }, [product, movementType, speak, showToast])

  const handleVoiceStart = () => {
    reset()
    start()
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-transparent">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.06]"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div className="flex-1">
            <SkeletonLoader className="h-6 w-40" />
          </div>
        </div>
        <div className="flex-1 px-4 space-y-4">
          <SkeletonLoader className="h-40" />
          <SkeletonLoader className="h-24" />
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="h-full flex flex-col bg-transparent">
      {showSuccess && (
        <SuccessAnimation
          message="Movimiento registrado"
          subMessage={`${lastMovement?.type === 'in' ? '+' : '-'}${lastMovement?.quantity} unidades`}
          onComplete={() => setShowSuccess(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <h1 className="text-white text-lg font-semibold flex-1 truncate">{product.name}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4">
        {/* Product image placeholder */}
        <div className="relative w-full h-40 rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-16 h-16 text-white/15" />
          )}
        </div>

        {/* Product info */}
        <GlassCard elevated>
          <div className="space-y-3">
            <div>
              <p className="text-white text-xl font-bold">{product.name}</p>
              <p className="text-white/50 text-sm">{product.brand}</p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              {product.category && (
                <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-white/60">
                  {product.category}
                </span>
              )}
              {product.presentation && (
                <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-white/60">
                  {product.presentation}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <p className="text-white/50 text-sm">Stock actual</p>
              <StockBadge stock={product.stock} unit={product.unit} />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-white/50 text-sm">Código de barras</p>
              <span className="font-mono text-white/70 text-sm">{product.barcode}</span>
            </div>
          </div>
        </GlassCard>

        {/* Movement controls */}
        <GlassCard elevated>
          <div className="space-y-4">
            <p className="text-white/70 text-sm font-medium">Registrar movimiento</p>

            {/* Type toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setMovementType('in')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                  font-semibold text-sm transition-all duration-200
                  ${movementType === 'in'
                    ? 'bg-[#2ECC71] text-white shadow-[0_4px_16px_rgba(46,204,113,0.3)]'
                    : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1]'
                  }
                `}
              >
                <ArrowDown className="w-4 h-4" />
                Entrada
              </button>
              <button
                onClick={() => setMovementType('out')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                  font-semibold text-sm transition-all duration-200
                  ${movementType === 'out'
                    ? 'bg-[#FF5A5F] text-white shadow-[0_4px_16px_rgba(255,90,95,0.3)]'
                    : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1]'
                  }
                `}
              >
                <ArrowUp className="w-4 h-4" />
                Salida
              </button>
            </div>

            {/* Voice control */}
            <div className="flex flex-col items-center gap-3">
              {isListening && <VoiceWave active />}

              <button
                onClick={isListening ? stop : handleVoiceStart}
                disabled={!isSupported}
                className={`
                  w-16 h-16 rounded-full
                  flex items-center justify-center
                  transition-all duration-300
                  ${isListening
                    ? 'bg-[#FF5A5F] shadow-[0_0_30px_rgba(255,90,95,0.5)] animate-pulse-scan'
                    : 'bg-[#4F8CFF] hover:bg-[#3A6FD8] shadow-[0_4px_20px_rgba(79,140,255,0.3)]'
                  }
                  disabled:opacity-50
                `}
              >
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2C10.34 2 9 3.34 9 5V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V5C15 3.34 13.66 2 12 2Z" />
                  <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10" />
                  <path d="M12 19V22" />
                </svg>
              </button>

              <p className="text-white/50 text-sm text-center">
                {isListening
                  ? interimTranscript || 'Di la cantidad...'
                  : 'Toca para hablar'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="text-[#FF5A5F] text-sm text-center">{error}</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
