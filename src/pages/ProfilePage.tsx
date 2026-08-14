import { User, LogOut } from 'lucide-react'
import { PageLayout, Header, Card, useToast } from '@/components/ui'

export function ProfilePage() {
  const { showToast } = useToast()

  const handleLogout = () => {
    showToast('info', 'Inicio de sesión no disponible por ahora')
  }

  return (
    <PageLayout nav header={<Header title="Perfil" showBack={false} />} contentClassName="px-4 pb-[calc(20%+8rem)]">
      <div className="flex flex-col items-center py-6">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-brand-container mb-4">
          <User className="w-10 h-10 text-brand" />
        </div>
        <h2 className="text-on-surface text-xl font-semibold">Operario</h2>
        <p className="text-on-surface-muted text-sm text-center">Administrador</p>
      </div>

      <Card interactive onClick={handleLogout}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-error-container">
            <LogOut className="w-5 h-5 text-error" />
          </div>
          <div className="flex-1">
            <p className="text-error font-medium">Cerrar sesión</p>
          </div>
        </div>
      </Card>
    </PageLayout>
  )
}
