import { useLocation, useNavigate } from 'react-router'
import { ScanLine, Package, Activity, User } from 'lucide-react'
import { motion } from 'motion/react'
import { hapticTap } from '@/lib/haptics'

interface NavItem {
  icon: React.ReactNode
  path: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { icon: <ScanLine className="w-5 h-5" />, path: '/', label: 'Escanear' },
  { icon: <Package className="w-5 h-5" />, path: '/inventory', label: 'Inventario' },
  { icon: <Activity className="w-5 h-5" />, path: '/activity', label: 'Actividad' },
  { icon: <User className="w-5 h-5" />, path: '/profile', label: 'Perfil' },
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
    <nav className="flex items-center gap-1 p-1.5
      bg-white/80 backdrop-blur-xl
      border border-outline-variant/50
      rounded-[28px] shadow-lg
    ">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.path)
        return (
          <motion.button
            key={item.path}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNav(item.path)}
            className={`
              relative flex flex-col items-center justify-center
              w-14 h-12 rounded-2xl
              transition-colors duration-150
              ${active
                ? 'text-brand'
                : 'text-on-surface-muted hover:text-on-surface'
              }
            `}
            aria-label={item.label}
          >
            {active && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-2xl bg-brand-container"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{item.icon}</span>
          </motion.button>
        )
      })}
    </nav>
  )
}
