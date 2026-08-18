import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Plus, Minus, Volume2, Package } from 'lucide-react'
import { PageLayout, Header, Card, FAB, VoiceWave, SuccessAnimation, Skeleton, useToast } from '@/components/ui'
import { StockValue, getStockColor } from '@/components/ui/StockValue'
import { useSTT } from '@/hooks/useSTT'
import { useTTS } from '@/hooks/useTTS'
import { productApi, movementApi, agentApi } from '@/api'
import { parseSpanishNumber } from '@/lib/numbers'
import type { Product } from '@/types'

export function ProductPage() {
  const { barcode } = useParams<{ barcode: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isListening, transcript, interimTranscript, start, stop, error } = useSTT()
  const { speak } = useTTS()

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [movementType, setMovementType] = useState<'in' | 'out'>('in')
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [barcode])

  useEffect(() => {
    if (transcript) {
      handleMovement(transcript)
    }
  }, [transcript])

  const loadProduct = async () => {
    if (!barcode) return
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

  const handleMovement = useCallback(async (text: string) => {
    if (!product) return

    let quantity: number | null = null
    let type: 'in' | 'out' = movementType

    try {
      const intent = await agentApi.parseMovement(text)
      if (intent) {
        quantity = intent.quantity
        type = intent.type
      }
    } catch {
      quantity = null
    }

    if (!quantity) {
      quantity = parseSpanishNumber(text)
    }

    if (!quantity || quantity <= 0) {
      showToast('error', 'No se detectó una cantidad')
      return
    }

    try {
      await movementApi.create({
        productId: product.id,
        quantity,
        type,
      })

      setProduct((prev) => prev ? {
        ...prev,
        stock: type === 'in' ? prev.stock + quantity : prev.stock - quantity,
      } : null)

      setShowSuccess(true)
      setTimeout(() => {
        speak(`${type === 'in' ? 'Entrada' : 'Salida'} de ${quantity} unidades registrada`)
      }, 2500)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Error al registrar movimiento')
    }
  }, [product, movementType, speak, showToast])

  const handleMic = () => {
    if (isListening) {
      stop()
    } else {
      start()
    }
  }

  const handleReplayStock = () => {
    speak(`${product?.name}, ${product?.stock} ${product?.unit || 'unidades'} en stock`)
  }

  if (isLoading) {
    return (
      <PageLayout header={<Header title="Cargando..." />}>
        <div className="flex-1 px-4 space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-24" />
          <Skeleton className="h-32" />
        </div>
      </PageLayout>
    )
  }

  if (!product) return null

  return (
    <PageLayout>
      {showSuccess && (
        <SuccessAnimation
          message="Movimiento registrado"
          subMessage={movementType === 'in' ? 'Stock actualizado' : 'Stock reducido'}
          onComplete={() => setShowSuccess(false)}
        />
      )}

      <Header title={product.name} subtitle={product.barcode} />

      <div className="px-4 space-y-4 pb-32">
        <div className="h-40 rounded-2xl bg-surface-2 flex flex-col items-center justify-center gap-2 border border-outline-variant/50">
          <Package className="w-8 h-8 text-on-surface-muted" />
          <p className="text-on-surface-muted text-sm">Sin imagen</p>
        </div>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-on-surface text-lg font-semibold">{product.name}</p>
                {product.brand && (
                  <p className="text-on-surface-muted text-sm">{product.brand}</p>
                )}
              </div>
              <div className="flex flex-col items-end">
                <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wide">
                  Stock
                </p>
                <div className="flex items-center gap-2">
                  <StockValue
                    stock={product.stock}
                    unit={product.unit}
                    className={`text-4xl font-bold leading-none ${getStockColor(product.stock)}`}
                  />
                  <button
                    onClick={handleReplayStock}
                    aria-label="Escuchar stock"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-2 hover:bg-surface-3 transition-colors"
                  >
                    <Volume2 className="w-4 h-4 text-brand" />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            {product.category && (
              <span className="px-3 py-1 rounded-full bg-surface-2 text-on-surface-variant text-sm border border-outline-variant/50">
                {product.category}
              </span>
            )}
            {product.presentation && (
              <span className="px-3 py-1 rounded-full bg-surface-2 text-on-surface-variant text-sm border border-outline-variant/50">
                {product.presentation}
              </span>
            )}
          </div>

          <Card>
            <p className="text-on-surface-variant text-sm font-medium mb-3">Tipo de movimiento</p>
            <div className="flex gap-2">
              <button
                onClick={() => setMovementType('in')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  movementType === 'in'
                    ? 'bg-success-container text-success border border-success/30'
                    : 'bg-surface-2 text-on-surface-muted border border-outline-variant/50'
                }`}
              >
                <Plus className="w-5 h-5" />
                Entrada
              </button>
              <button
                onClick={() => setMovementType('out')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  movementType === 'out'
                    ? 'bg-error-container text-error border border-error/30'
                    : 'bg-surface-2 text-on-surface-muted border border-outline-variant/50'
                }`}
              >
                <Minus className="w-5 h-5" />
                Salida
              </button>
            </div>
          </Card>

          <div className="flex flex-col items-center gap-3 py-4">
            <FAB isListening={isListening} onClick={handleMic} />
            <p className="text-on-surface-muted text-sm">
              {isListening
                ? interimTranscript || `Di la cantidad para ${movementType === 'in' ? 'entrada' : 'salida'}...`
                : 'Toca para decir la cantidad'}
            </p>
            {error && (
              <p className="text-error text-sm">{error}</p>
            )}
          </div>

          {isListening && (
            <div className="flex justify-center">
              <VoiceWave active />
            </div>
          )}
        </div>
    </PageLayout>
  )
}
