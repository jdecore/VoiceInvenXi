import { useNavigate } from 'react-router'
import { ArrowLeft, Activity, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { EmptyState, TelegramNav } from '@/components/ui'

const MOCK_MOVEMENTS = [
  { id: '1', productName: 'Aceite de Oliva Extra Virgen', quantity: 20, type: 'in' as const, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: '2', productName: 'Arroz Largo Fino', quantity: 5, type: 'out' as const, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: '3', productName: 'Leche Entera', quantity: 30, type: 'in' as const, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
]

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
  const navigate = useNavigate()

  return (
    <div className="h-full flex flex-col bg-transparent overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <h1 className="text-white text-lg font-semibold">Actividad</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {MOCK_MOVEMENTS.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              icon={<Activity className="w-8 h-8 text-white/30" />}
              title="Sin actividad"
              description="Los movimientos de stock aparecerán aquí"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {MOCK_MOVEMENTS.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  movement.type === 'in' 
                    ? 'bg-emerald-500/15 text-emerald-400' 
                    : 'bg-rose-500/15 text-rose-400'
                }`}>
                  {movement.type === 'in' ? (
                    <ArrowDownCircle className="w-5 h-5" />
                  ) : (
                    <ArrowUpCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{movement.productName}</p>
                  <p className="text-white/40 text-xs">{formatTimeAgo(movement.createdAt)}</p>
                </div>
                <span className={`text-sm font-semibold ${
                  movement.type === 'in' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <TelegramNav />
    </div>
  )
}
