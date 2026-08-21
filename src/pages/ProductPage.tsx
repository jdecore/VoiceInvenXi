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
      navigate(`/new/${encodeURIComponent(barcode)}`, { replace: true })
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
        stock: type === 'in' ? prev.stock + quantity! : prev.stock - quantity!,
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
        <div className="product-image-placeholder">
          <Package />
          <p>Sin imagen</p>
        </div>

        <Card>
          <div className="product-stock-row">
            <div className="min-w-0">
              <p className="product-info-title">{product.name}</p>
              {product.brand && (
                <p className="product-info-brand">{product.brand}</p>
              )}
            </div>
            <div className="flex flex-col items-end">
              <p className="product-stock-label">Stock</p>
              <div className="product-stock-value">
                <StockValue
                  stock={product.stock}
                  unit={product.unit}
                  className={getStockColor(product.stock)}
                />
                <button onClick={handleReplayStock} aria-label="Escuchar stock" className="replay-btn">
                  <Volume2 />
                </button>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-2">
          {product.category && (
            <span className="tag">{product.category}</span>
          )}
          {product.presentation && (
            <span className="tag">{product.presentation}</span>
          )}
        </div>

        <Card>
          <p className="text-on-surface-variant text-sm font-medium mb-3">Tipo de movimiento</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMovementType('in')}
              className={`movement-toggle ${movementType === 'in' ? 'movement-toggle--in' : ''}`}
            >
              <Plus />
              Entrada
            </button>
            <button
              onClick={() => setMovementType('out')}
              className={`movement-toggle ${movementType === 'out' ? 'movement-toggle--out' : ''}`}
            >
              <Minus />
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
