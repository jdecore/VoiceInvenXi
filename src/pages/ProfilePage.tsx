import { User, LogOut } from 'lucide-react'
import { Header, Card, NavBar, useToast } from '@/components/ui'

export function ProfilePage() {
  const { showToast } = useToast()

  const handleLogout = () => {
    showToast('info', 'Inicio de sesión no disponible por ahora')
  }

  return (
    <div className="relative h-full flex flex-col bg-surface overflow-hidden">
      <Header title="Perfil" showBack={false} />

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="flex flex-col items-center py-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-brand-container mb-4">
            <User className="w-10 h-10 text-brand" />
          </div>
          <h2 className="text-on-surface text-xl font-semibold">Operario</h2>
          <p className="text-on-surface-muted text-sm"> Administrador</p>
        </div>

        <Card interactive onClick={handleLogout}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-error-container">
              <LogOut className="w-5 h-5 text-error" />
            </div>
            <div className="flex-1">
              <p className="text-error font-medium">Cerrar sesión</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center px-4 py-4 pb-[env(safe-area-inset-bottom)]">
        <NavBar />
      </div>
    </div>
  )
}
