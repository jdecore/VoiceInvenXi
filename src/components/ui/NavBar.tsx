import { useLocation, useNavigate } from 'react-router'
import { IconScan, IconPackage, IconActivity, IconUser } from '@tabler/icons-react'
import { hapticTap } from '@/lib/haptics'

interface NavItem {
  icon: React.ReactNode
  path: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { icon: <IconScan />, path: '/', label: 'Escanear' },
  { icon: <IconPackage />, path: '/inventory', label: 'Inventario' },
  { icon: <IconActivity />, path: '/activity', label: 'Actividad' },
  { icon: <IconUser />, path: '/profile', label: 'Perfil' },
]

export function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNav = (path: string) => {
    hapticTap()
    navigate(path)
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="navbar" aria-label="Navegación principal">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.path)
        return (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={`navbar-btn ${active ? 'navbar-btn--active' : ''}`}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            {item.icon}
          </button>
        )
      })}
    </nav>
  )
}
