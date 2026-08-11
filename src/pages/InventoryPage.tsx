import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Package } from 'lucide-react'
import { PageLayout, Header, Card, StockBadge, NavBar, EmptyState, Skeleton } from '@/components/ui'
import { productApi } from '@/api'
import type { Product } from '@/types'

export function InventoryPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await productApi.list()
      setProducts(data)
    } catch {
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageLayout>
      <Header title="Inventario" />

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8 text-on-surface-muted" />}
            title="Sin productos"
            description="Escanea un código de barras para agregar productos"
          />
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <Card
                key={product.id}
                interactive
                onClick={() => navigate(`/product/${product.barcode}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-container">
                    <Package className="w-5 h-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-on-surface font-medium truncate">{product.name}</p>
                    <p className="text-on-surface-muted text-sm truncate">
                      {product.brand || 'Sin marca'} {product.category && `• ${product.category}`}
                    </p>
                  </div>
                  <StockBadge stock={product.stock} unit={product.unit} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 px-4 py-4 bg-white border-t border-outline-variant/50">
        <NavBar />
      </div>
    </PageLayout>
  )
}
