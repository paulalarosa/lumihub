import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Users,
  CreditCard,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react'
import { motion } from 'framer-motion'
import NotificationBell from '@/features/admin/components/NotificationBell'

import AdminOverview from '@/features/admin/AdminOverview'
import AdminUsuarias from '@/features/admin/AdminUsuarias'
import AdminSubscriptions from '@/features/admin/AdminSubscriptions'
import AdminMarketing from '@/features/admin/AdminMarketing'
import AdminSistema from '@/features/admin/AdminSistema'

type AdminTab = 'overview' | 'usuarios' | 'financeiro' | 'marketing' | 'sistema'

const MENU_ITEMS: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
  { id: 'usuarios', label: 'Usuárias', icon: Users },
  { id: 'financeiro', label: 'Financeiro', icon: CreditCard },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'sistema', label: 'Sistema', icon: Settings },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, loading: authLoading, signOut } = useAuth()
  const { isAdmin: isAuthorizedAdmin, isLoading: adminLoading } = useIsAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const activeTab = (searchParams.get('tab') as AdminTab) || 'overview'

  const setTab = (tab: AdminTab) => {
    setSearchParams({ tab })
  }

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground font-mono uppercase tracking-widest text-xs">
          Verificando acesso...
        </p>
      </div>
    )
  }

  if (!isAuthorizedAdmin) {
    return null
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const activeLabel = MENU_ITEMS.find((m) => m.id === activeTab)?.label ?? ''

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`${
          sidebarOpen ? 'w-56' : 'w-16'
        } bg-background border-r border-border flex flex-col transition-all duration-300 relative z-20`}
      >
        <div className="p-5 border-b border-border">
          {sidebarOpen ? (
            <>
              <h1 className="text-foreground font-serif text-xl font-bold tracking-tight">
                KHAOS_CORE
              </h1>
              <p className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest mt-0.5">
                System_Admin
              </p>
            </>
          ) : (
            <h1 className="text-foreground font-serif text-sm font-bold">KC</h1>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-0.5">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors relative group ${
                  isActive
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-background" />
                )}
                <Icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-[10px] font-mono uppercase tracking-widest">
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-muted-foreground hover:text-foreground p-2 flex items-center justify-center hover:bg-muted transition-colors"
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 rounded-none font-mono text-[10px] uppercase tracking-widest"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">LOGOUT</span>}
          </Button>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="bg-background border-b border-border px-8 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-foreground font-serif text-2xl font-light tracking-tight">
              {activeLabel}
            </h2>
            <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-widest mt-0.5">
              Terminal: {user?.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-8 w-8 border border-border flex items-center justify-center bg-background">
              <ShieldCheck className="h-4 w-4 text-foreground" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-muted/20 p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && <AdminOverview />}
            {activeTab === 'usuarios' && <AdminUsuarias />}
            {activeTab === 'financeiro' && <AdminSubscriptions />}
            {activeTab === 'marketing' && <AdminMarketing />}
            {activeTab === 'sistema' && <AdminSistema />}
          </div>
        </div>
      </div>
    </div>
  )
}
