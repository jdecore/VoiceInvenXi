import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { BarChart3 } from 'lucide-react'
import { EmptyState, BottomNav } from '@/components/ui'

export function AnalyticsPage() {
  const navigate = useNavigate()

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <h1 className="text-white text-lg font-semibold">Analíticas</h1>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-24">
        <EmptyState
          icon={<BarChart3 className="w-8 h-8 text-white/30" />}
          title="Dashboard de analíticas"
          description="Próximamente verás gráficos de movimientos, productos más escaneados y más"
        />
      </div>

      <div className="relative z-20">
        <BottomNav />
      </div>
    </div>
  )
}
