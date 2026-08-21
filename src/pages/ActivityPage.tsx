import { useState, useEffect } from 'react'
import { IconArrowUpCircle, IconArrowDownCircle, IconActivity } from '@tabler/icons-react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { PageLayout, Header, Card, EmptyState, Skeleton } from '@/components/ui'
import { movementApi } from '@/api'
import type { Movement } from '@/types'

interface MovementWithProduct extends Movement {
  productName: string
}

function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  return `Hace ${diffDays}d`
}

export function ActivityPage() {
  const [movements, setMovements] = useState<MovementWithProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [listRef] = useAutoAnimate<HTMLDivElement>({ duration: 400, easing: "ease-in-out" })

  useEffect(() => {
    loadMovements()
  }, [])

  const loadMovements = async () => {
    try {
      const data = await movementApi.list()
      setMovements(data as MovementWithProduct[])
    } catch {
      setMovements([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageLayout
      nav
      header={<Header title="Actividad" />}
      contentClassName="px-4 content-nav-safe"
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : movements.length === 0 ? (
        <EmptyState
          icon={<IconActivity />}
          title="Sin actividad"
          description="Los movimientos de stock aparecerán aquí"
        />
      ) : (
        <div ref={listRef} className="space-y-3">
          {movements.map((movement) => (
            <Card key={movement.id}>
              <div className="flex items-center gap-3">
                <div className={`activity-icon ${movement.type === 'in' ? 'activity-icon--in' : 'activity-icon--out'}`}>
                  {movement.type === 'in' ? <IconArrowDownCircle /> : <IconArrowUpCircle />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="activity-name">{movement.productName}</p>
                  <p className="activity-time">{formatTimeAgo(movement.createdAt)}</p>
                </div>
                <span className={`activity-qty ${movement.type === 'in' ? 'activity-qty--in' : 'activity-qty--out'}`}>
                  {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
