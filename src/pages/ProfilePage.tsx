import { User, Settings, Bell, HelpCircle, LogOut } from 'lucide-react'
import { PageLayout, Header, Card, NavBar } from '@/components/ui'

export function ProfilePage() {
  return (
    <PageLayout>
      <Header title="Perfil" showBack={false} />

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="flex flex-col items-center py-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-brand-container mb-4">
            <User className="w-10 h-10 text-brand" />
          </div>
          <h2 className="text-on-surface text-xl font-semibold">Operario</h2>
          <p className="text-on-surface-muted text-sm"> Administrador</p>
        </div>

        <div className="space-y-2">
          <Card interactive onClick={() => {}}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-2">
                <Settings className="w-5 h-5 text-on-surface-variant" />
              </div>
              <div className="flex-1">
                <p className="text-on-surface font-medium">Configuración</p>
                <p className="text-on-surface-muted text-sm">Preferencias de la app</p>
              </div>
            </div>
          </Card>

          <Card interactive onClick={() => {}}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-2">
                <Bell className="w-5 h-5 text-on-surface-variant" />
              </div>
              <div className="flex-1">
                <p className="text-on-surface font-medium">Notificaciones</p>
                <p className="text-on-surface-muted text-sm">Gestionar alertas</p>
              </div>
            </div>
          </Card>

          <Card interactive onClick={() => {}}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-2">
                <HelpCircle className="w-5 h-5 text-on-surface-variant" />
              </div>
              <div className="flex-1">
                <p className="text-on-surface font-medium">Ayuda</p>
                <p className="text-on-surface-muted text-sm">Soporte y documentación</p>
              </div>
            </div>
          </Card>

          <Card interactive onClick={() => {}}>
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
      </div>

      <div className="flex items-center justify-center gap-3 px-4 py-4 bg-white border-t border-outline-variant/50">
        <NavBar />
      </div>
    </PageLayout>
  )
}
