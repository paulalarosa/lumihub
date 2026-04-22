import { useState } from 'react'
import { Loader2, UserPlus, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/hooks/useLanguage'
import {
  usePendingPeerMigrations,
  PendingPeerMigration,
} from '../hooks/usePendingPeerMigrations'

/**
 * Card que aparece no dashboard da usuária quando ela acabou de criar conta
 * e já tinha vínculos como assistente-PIN com outras maquiadoras. Oferece
 * migrar cada vínculo pra uma conexão de parceria (peer_connection) ou
 * dispensar (mantém como assistente-PIN).
 *
 * Renderiza nada se não houver pendências — invisível pra quem não é caso.
 */
export function PendingMigrationsCard() {
  const { t } = useLanguage()
  const { migrations, isLoading, accept, dismiss } = usePendingPeerMigrations()
  const [processing, setProcessing] = useState<string | null>(null)

  if (isLoading || migrations.length === 0) return null

  const handleAccept = async (m: PendingPeerMigration) => {
    setProcessing(m.id)
    try {
      await accept.mutateAsync(m)
    } finally {
      setProcessing(null)
    }
  }

  const handleDismiss = async (m: PendingPeerMigration) => {
    setProcessing(m.id)
    try {
      await dismiss.mutateAsync(m.id)
    } finally {
      setProcessing(null)
    }
  }

  return (
    <section className="border border-white/20 bg-white/[0.03] mb-8">
      <header className="p-5 border-b border-white/10 flex items-start gap-3">
        <div className="w-9 h-9 bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
          <UserPlus className="w-4 h-4 text-white/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] text-white/40 tracking-[0.25em] uppercase mb-1">
            {t('network.migration.eyebrow')}
          </p>
          <h3 className="font-serif text-lg text-white">
            {t('network.migration.title', { count: migrations.length })}
          </h3>
          <p className="text-white/50 text-sm mt-1 leading-relaxed">
            {t('network.migration.description')}
          </p>
        </div>
      </header>

      <ul className="divide-y divide-white/5">
        {migrations.map((m) => {
          const busy = processing === m.id
          const hostName =
            m.host_profile?.full_name ||
            m.host_profile?.email ||
            'Sem nome'
          return (
            <li key={m.id} className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/[0.04] border border-white/10 flex items-center justify-center text-xs font-mono text-white/60 flex-shrink-0">
                {hostName
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{hostName}</p>
                <p className="text-[10px] text-white/30 font-mono">
                  {m.host_profile?.email}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => handleDismiss(m)}
                  className="h-9 w-9 p-0 text-white/30 hover:text-white hover:bg-white/5 rounded-none"
                  aria-label={t('network.migration.dismiss_action')}
                  title={t('network.migration.dismiss_tooltip')}
                >
                  {busy && dismiss.variables === m.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => handleAccept(m)}
                  className="rounded-none bg-white text-black hover:bg-gray-200 font-mono text-[10px] uppercase tracking-widest h-9 px-3"
                >
                  {busy && accept.variables?.id === m.id ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <ChevronRight className="w-3 h-3 mr-1" />
                  )}
                  {t('network.migration.accept_action')}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
