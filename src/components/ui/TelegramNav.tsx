import { useLocation, useNavigate } from 'react-router'
import { ScanLine, Package, Activity, User, Search } from 'lucide-react'
import { hapticTap } from '@/lib/haptics'

interface NavItem {
  icon: React.ReactNode
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { icon: <ScanLine className="w-[22px] h-[22px]" />, path: '/' },
  { icon: <Package className="w-[22px] h-[22px]" />, path: '/inventory' },
  { icon: <Activity className="w-[22px] h-[22px]" />, path: '/activity' },
  { icon: <User className="w-[22px] h-[22px]" />, path: '/profile' },
]

export function TelegramNav() {
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

  const handleSearch = () => {
    hapticTap()
    navigate('/search')
  }

  return (
    <div className="relative z-50 px-4 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center gap-2 p-1.5
        bg-[rgba(18,18,26,0.92)] backdrop-blur-xl backdrop-saturate-[180%]
        border border-[rgba(255,255,255,0.1)]
        rounded-[28px] shadow-[0_-4px_24px_rgba(0,0,0,0.3)]
      ">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`
                relative flex items-center justify-center
                h-11 rounded-full
                transition-all duration-200
                ${active
                  ? 'w-11 text-[#4F8CFF] bg-[#4F8CFF]/15'
                  : 'w-11 text-white/40 hover:text-white/60 hover:bg-white/5'
                }
              `}
              aria-label={item.path}
            >
              {item.icon}
              {active && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#4F8CFF]" />
              )}
            </button>
          )
        })}

        <div className="w-px h-6 bg-white/10 mx-0.5" />

        <button
          onClick={handleSearch}
          className="flex items-center justify-center
            w-11 h-11 rounded-full
            bg-[#4F8CFF] text-white
            shadow-[0_2px_8px_rgba(79,140,255,0.3)]
            transition-all duration-200
            hover:bg-[#3D7AE8] active:scale-95"
          aria-label="Buscar"
        >
          <Search className="w-[20px] h-[20px]" />
        </button>
      </div>
    </div>
  )
}
