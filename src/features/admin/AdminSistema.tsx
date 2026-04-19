import { useState } from 'react'
import AdminConfig from '@/features/admin/AdminConfig'
import AdminSecurity from '@/features/admin/AdminSecurity'
import AdminLogs from '@/features/admin/AdminLogs'
import AdminIntegrations from '@/features/admin/AdminIntegrations'
import AdminLGPD from '@/features/admin/AdminLGPD'
import { Settings, ShieldCheck, FileText, Plug, Scale } from 'lucide-react'

type SubTab = 'config' | 'security' | 'logs' | 'integrations' | 'lgpd'

const SUB_TABS: { id: SubTab; label: string; icon: typeof Settings }[] = [
  { id: 'config', label: 'Config', icon: Settings },
  { id: 'security', label: 'Segurança', icon: ShieldCheck },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'integrations', label: 'Integrações', icon: Plug },
  { id: 'lgpd', label: 'LGPD', icon: Scale },
]

export default function AdminSistema() {
  const [subTab, setSubTab] = useState<SubTab>('config')

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex border-b border-border overflow-x-auto">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = subTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors border-b-2 -mb-px whitespace-nowrap ${
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {subTab === 'config' && <AdminConfig />}
      {subTab === 'security' && <AdminSecurity />}
      {subTab === 'logs' && <AdminLogs />}
      {subTab === 'integrations' && <AdminIntegrations />}
      {subTab === 'lgpd' && <AdminLGPD />}
    </div>
  )
}
