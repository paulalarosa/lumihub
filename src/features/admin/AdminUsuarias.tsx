import { useState } from 'react'
import AdminUsers from '@/features/admin/AdminUsers'
import AdminAssistants from '@/features/admin/AdminAssistants'
import { Users, UserCheck } from 'lucide-react'

type SubTab = 'users' | 'assistants'

const SUB_TABS: { id: SubTab; label: string; icon: typeof Users }[] = [
  { id: 'users', label: 'Profissionais', icon: Users },
  { id: 'assistants', label: 'Assistentes', icon: UserCheck },
]

export default function AdminUsuarias() {
  const [subTab, setSubTab] = useState<SubTab>('users')

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex border-b border-border">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = subTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors border-b-2 -mb-px ${
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

      {subTab === 'users' && <AdminUsers />}
      {subTab === 'assistants' && <AdminAssistants />}
    </div>
  )
}
