import { useLocation, useNavigate } from 'react-router'
import { Plus, ScanLine, Package, BarChart3, User } from 'lucide-react'
import { hapticTap } from '@/lib/haptics'

interface NavItem {
  icon: React.ReactNode
  label: string
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { icon: <Plus className="w-5 h-5" />, label: 'Agregar', path: '/new' },
  { icon: <ScanLine className="w-5 h-5" />, label: 'Escanear', path: '/' },
  { icon: <Package className="w-5 h-5" />, label: 'Inventario', path: '/inventory' },
  { icon: <BarChart3 className="w-5 h-5" />, label: 'Analíticas', path: '/analytics' },
  { icon: <User className="w-5 h-5" />, label: 'Perfil', path: '/profile' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNav = (path: string) => {
    hapticTap()
    if (path === '/new') {
      navigate('/new/scan')
    } else {
      navigate(path)
    }
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    if (path === '/new') return location.pathname.startsWith('/new')
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="flex items-center justify-between gap-1 px-2 pt-2 pb-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.path)
        return (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={`
              flex flex-col items-center gap-1 px-2 py-1.5
              rounded-xl min-w-[48px]
              transition-all duration-200
              ${active
                ? 'text-[#4F8CFF] bg-[#4F8CFF]/15'
                : 'text-white/40 hover:text-white/60'
              }
            `}
          >
            {item.icon}
            <span className={`text-[10px] font-medium ${active ? 'text-[#4F8CFF]' : ''}`}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
