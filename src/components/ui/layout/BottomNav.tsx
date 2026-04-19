import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Users, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const location = useLocation()

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    )
  }

  const navItems = [
    {
      icon: Home,
      label: 'Início',
      path: '/dashboard',
    },
    {
      icon: Calendar,
      label: 'Agenda',
      path: '/calendar',
    },
    {
      icon: Users,
      label: 'Clientes',
      path: '/clientes',
    },
    {
      icon: Filter,
      label: 'Funil',
      path: '/funil',
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
      <div className="grid grid-cols-4 h-[60px]">
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors relative',
                active ? 'text-white' : 'text-gray-500 hover:text-gray-200',
              )}
            >
              {active && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-white" />
              )}
              <item.icon
                className={cn(
                  'h-5 w-5',
                  active && '',
                )}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
