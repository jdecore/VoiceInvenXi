import { useState } from 'react'
import { User, LogOut, RefreshCw } from 'lucide-react'
import { PageLayout, Header, Card, Button, useToast } from '@/components/ui'
import { searchApi } from '@/api'

export function ProfilePage() {
  const { showToast } = useToast()
  const [isSeeding, setIsSeeding] = useState(false)

  const handleLogout = () => {
    showToast('info', 'Inicio de sesión no disponible por ahora')
  }

  const handleReseed = async () => {
    if (isSeeding) return
    setIsSeeding(true)
    try {
      const res = await searchApi.seedEmbeddings()
      showToast('success', `Embeddings regenerados: ${res.updated}/${res.total}`)
    } catch {
      showToast('error', 'No se pudieron regenerar los embeddings')
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <PageLayout nav header={<Header title="Perfil" showBack={false} />} contentClassName="px-4 content-nav-safe">
      <div className="profile-header">
        <div className="profile-avatar">
          <User />
        </div>
        <h2 className="profile-name">Operario</h2>
        <p className="profile-role">Administrador</p>
      </div>

      <Card>
        <p className="text-on-surface-variant text-sm font-medium mb-1">Búsqueda semántica</p>
        <p className="text-on-surface-muted text-sm mb-3">
          Regenera los vectores de los productos para mejorar la búsqueda por voz y texto.
        </p>
        <Button variant="tonal" className="w-full" onClick={handleReseed} disabled={isSeeding}>
          <RefreshCw />
          {isSeeding ? 'Regenerando...' : 'Regenerar embeddings'}
        </Button>
      </Card>

      <div className="mt-3">
        <Card interactive onClick={handleLogout}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-error-container">
              <LogOut />
            </div>
            <div className="flex-1">
              <p className="text-error font-medium">Cerrar sesión</p>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  )
}
