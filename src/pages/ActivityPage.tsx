import { useState, useEffect } from 'react'
import { ArrowUpCircle, ArrowDownCircle, Activity } from 'lucide-react'
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
      contentClassName="px-4 pb-24"
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : movements.length === 0 ? (
        <EmptyState
          icon={<Activity className="w-8 h-8 text-on-surface-muted" />}
          title="Sin actividad"
          description="Los movimientos de stock aparecerán aquí"
        />
      ) : (
        <div className="space-y-3">
          {movements.map((movement) => (
            <Card key={movement.id}>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 ${
                  movement.type === 'in'
                    ? 'bg-success-container'
                    : 'bg-error-container'
                }`}>
                  {movement.type === 'in' ? (
                    <ArrowDownCircle className="w-5 h-5 text-success" />
                  ) : (
                    <ArrowUpCircle className="w-5 h-5 text-error" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface text-sm font-medium truncate">
                    {movement.productName}
                  </p>
                  <p className="text-on-surface-muted text-xs">
                    {formatTimeAgo(movement.createdAt)}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${
                  movement.type === 'in' ? 'text-success' : 'text-error'
                }`}>
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
