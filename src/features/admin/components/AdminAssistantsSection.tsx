import { UserCog, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  useAdminAssistants,
  type AdminAssistantRow,
} from '../hooks/useAdminAssistants'

export function AdminAssistantsSection() {
  const { data: assistants = [], isLoading, isError } = useAdminAssistants()

  return (
    <section className="space-y-4 pt-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-xl text-white flex items-center gap-2">
            <UserCog className="w-4 h-4 text-white/60" />
            Assistentes da equipe
          </h2>
          <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
            {assistants.length} cadastradas · convidadas pelas maquiadoras
          </p>
        </div>
      </header>

      {isLoading && (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-white/30" />
        </div>
      )}

      {isError && (
        <div className="py-8 text-center border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-mono uppercase">
          Erro ao carregar assistentes
        </div>
      )}

      {!isLoading && assistants.length === 0 && (
        <div className="py-8 text-center border border-dashed border-white/10 text-white/40 text-xs font-mono uppercase tracking-widest">
          Nenhuma assistente cadastrada
        </div>
      )}

      {assistants.length > 0 && (
        <>
          <div className="md:hidden space-y-3">
            {assistants.map((a) => (
              <AssistantMobileCard key={a.id} assistant={a} />
            ))}
          </div>

          <Card className="hidden md:block bg-black/40 border border-zinc-800 rounded-none overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="text-left py-3 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                        Nome
                      </th>
                      <th className="text-left py-3 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                        Contato
                      </th>
                      <th className="text-left py-3 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                        Maquiadora dona
                      </th>
                      <th className="text-left py-3 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                        Status
                      </th>
                      <th className="text-left py-3 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                        Cadastrada
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assistants.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-zinc-900 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-400">
                              {a.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-serif text-white text-sm">
                              {a.full_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-[11px] text-zinc-400">
                          <div>{a.email ?? '-'}</div>
                          {a.phone && (
                            <div className="text-[10px] text-zinc-600">
                              {a.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 font-mono text-[11px] text-zinc-400">
                          {a.owner_name ?? (
                            <span className="text-zinc-600 italic">—</span>
                          )}
                          {a.owner_email && (
                            <div className="text-[10px] text-zinc-600">
                              {a.owner_email}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <Badge
                            variant="outline"
                            className={`rounded-none font-mono text-[9px] uppercase tracking-widest ${
                              a.is_upgraded
                                ? 'border-emerald-900/50 text-emerald-500'
                                : 'border-zinc-800 text-zinc-500'
                            }`}
                          >
                            {a.is_upgraded ? 'Com conta' : 'Só convite'}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-[10px] font-mono text-zinc-600 uppercase">
                          {a.created_at
                            ? new Date(a.created_at).toLocaleDateString('pt-BR')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  )
}

function AssistantMobileCard({ assistant: a }: { assistant: AdminAssistantRow }) {
  return (
    <div className="border border-zinc-800 bg-black/40 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-[11px] font-bold text-zinc-400 shrink-0">
          {a.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-serif text-white text-sm truncate">
              {a.full_name}
            </h3>
            <Badge
              variant="outline"
              className={`shrink-0 rounded-none font-mono text-[8px] uppercase tracking-widest ${
                a.is_upgraded
                  ? 'border-emerald-900/50 text-emerald-500'
                  : 'border-zinc-800 text-zinc-500'
              }`}
            >
              {a.is_upgraded ? 'Conta' : 'Convite'}
            </Badge>
          </div>
          {a.email && (
            <p className="text-[11px] font-mono text-zinc-500 truncate">
              {a.email}
            </p>
          )}
          {a.owner_name && (
            <p className="text-[10px] font-mono text-zinc-600 mt-2 truncate">
              Dona: {a.owner_name}
            </p>
          )}
          <p className="text-[9px] font-mono text-zinc-600 mt-1">
            {a.created_at
              ? new Date(a.created_at).toLocaleDateString('pt-BR')
              : '-'}
          </p>
        </div>
      </div>
    </div>
  )
}
