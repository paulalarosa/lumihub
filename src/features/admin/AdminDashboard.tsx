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
  FileText,
  LineChart,
  Activity,
} from 'lucide-react'
import { motion } from 'framer-motion'
import NotificationBell from '@/features/admin/components/NotificationBell'

import AdminOverview from '@/features/admin/AdminOverview'
import AdminMetrics from '@/features/admin/AdminMetrics'
import AdminUsuarias from '@/features/admin/AdminUsuarias'
import AdminSubscriptions from '@/features/admin/AdminSubscriptions'
import AdminMarketing from '@/features/admin/AdminMarketing'
import AdminSistema from '@/features/admin/AdminSistema'
import AdminContent from '@/features/admin/AdminContent'
import AdminActivityPanel from '@/features/admin/components/AdminActivityPanel'

type AdminTab =
  | 'overview'
  | 'atividade'
  | 'metricas'
  | 'usuarios'
  | 'financeiro'
  | 'marketing'
  | 'conteudo'
  | 'sistema'

const MENU_ITEMS: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
  { id: 'atividade', label: 'Atividade', icon: Activity },
  { id: 'metricas', label: 'Métricas', icon: LineChart },
  { id: 'usuarios', label: 'Usuárias', icon: Users },
  { id: 'financeiro', label: 'Financeiro', icon: CreditCard },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'conteudo', label: 'Conteúdo', icon: FileText },
  { id: 'sistema', label: 'Sistema', icon: Settings },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, loading: authLoading, signOut } = useAuth()
  const { isAdmin: isAuthorizedAdmin, isLoading: adminLoading } = useIsAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const closeMobileAndSet = (tab: AdminTab) => {
    setTab(tab)
    setSidebarOpen(false)
  }

  const sidebarNav = (
    <>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-foreground font-serif text-xl font-bold tracking-tight">
            KHAOS_CORE
          </h1>
          <p className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest mt-0.5">
            System_Admin
          </p>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden text-muted-foreground hover:text-foreground"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => closeMobileAndSet(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors relative ${
                isActive
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-background" />
              )}
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="text-[10px] font-mono uppercase tracking-widest">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 rounded-none font-mono text-[10px] uppercase tracking-widest justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          LOGOUT
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop sidebar (md+) */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:flex w-56 bg-background border-r border-border flex-col relative z-20"
      >
        {sidebarNav}
      </motion.div>

      {/* Mobile sidebar drawer (below md) */}
      {sidebarOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <div className="md:hidden fixed inset-y-0 left-0 w-64 bg-background border-r border-border flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {sidebarNav}
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="bg-background border-b border-border px-4 py-3 sm:px-8 sm:py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-muted-foreground hover:text-foreground p-1 -ml-1"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-foreground font-serif text-xl sm:text-2xl font-light tracking-tight truncate">
                {activeLabel}
              </h2>
              <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-widest mt-0.5 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <NotificationBell />
            <div className="h-8 w-8 border border-border flex items-center justify-center bg-background">
              <ShieldCheck className="h-4 w-4 text-foreground" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-muted/20 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && <AdminOverview />}
            {activeTab === 'atividade' && <AdminActivityPanel />}
            {activeTab === 'metricas' && <AdminMetrics />}
            {activeTab === 'usuarios' && <AdminUsuarias />}
            {activeTab === 'financeiro' && <AdminSubscriptions />}
            {activeTab === 'conteudo' && <AdminContent />}
            {activeTab === 'marketing' && <AdminMarketing />}
            {activeTab === 'sistema' && <AdminSistema />}
          </div>
        </div>
      </div>
    </div>
  )
}
