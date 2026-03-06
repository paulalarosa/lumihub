import {
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Users,
  DollarSign,
  BarChart3,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'

type TabType =
  | 'dashboard'
  | 'agenda'
  | 'tarefas'
  | 'clientes'
  | 'financeiro'
  | 'relatorios'

interface AssistantSidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  pendingTasksCount: number
  onLockedClick: (feature: string) => void
}

const AssistantSidebar = ({
  activeTab,
  onTabChange,
  pendingTasksCount,
  onLockedClick,
}: AssistantSidebarProps) => {
  const menuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      locked: false,
    },
    { id: 'agenda' as TabType, label: 'Agenda', icon: Calendar, locked: false },
    {
      id: 'tarefas' as TabType,
      label: 'Tarefas',
      icon: CheckSquare,
      locked: false,
      badge: pendingTasksCount,
    },
    { id: 'clientes' as TabType, label: 'Clientes', icon: Users, locked: true },
    {
      id: 'financeiro' as TabType,
      label: 'Financeiro',
      icon: DollarSign,
      locked: true,
    },
    {
      id: 'relatorios' as TabType,
      label: 'Relatórios',
      icon: BarChart3,
      locked: true,
    },
  ]

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const isLocked = item.locked

          return (
            <Button
              key={item.id}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3',
                isLocked && 'opacity-60 hover:opacity-80',
              )}
              onClick={() => {
                if (isLocked) {
                  onLockedClick(item.label)
                } else {
                  onTabChange(item.id)
                }
              }}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
              {item.badge && item.badge > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                  {item.badge}
                </Badge>
              )}
            </Button>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Recursos Premium</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Desbloqueie acesso a clientes, financeiro e relatórios.
          </p>
          <Button
            size="sm"
            variant="default"
            className="w-full"
            onClick={() => onLockedClick('premium')}
          >
            Saiba Mais
          </Button>
        </div>
      </div>
    </aside>
  )
}

export default AssistantSidebar
