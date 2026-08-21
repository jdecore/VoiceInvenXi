import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Package } from 'lucide-react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { PageLayout, Header, Card, ProductRow, EmptyState, Skeleton } from '@/components/ui'
import { productApi } from '@/api'
import type { Product } from '@/types'

export function InventoryPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [listRef] = useAutoAnimate<HTMLDivElement>({ duration: 400, easing: "ease-in-out" })

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
    <PageLayout
      nav
      header={<Header title="Inventario" />}
      contentClassName="px-4 content-nav-safe"
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="Sin productos"
          description="Escanea un código de barras para agregar productos"
        />
      ) : (
        <div ref={listRef} className="space-y-3">
          {products.map((product) => (
            <Card
              key={product.id}
              interactive
              onClick={() => navigate(`/product/${encodeURIComponent(product.barcode)}`)}
            >
              <ProductRow
                name={product.name}
                meta={`${product.brand || 'Sin marca'} ${product.category && `• ${product.category}`}`}
                stock={product.stock}
                unit={product.unit}
              />
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
