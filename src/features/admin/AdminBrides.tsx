import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Gem, Search, Link as LinkIcon, Copy } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useAdminBrides } from './hooks/useAdminBrides'

export default function AdminBrides() {
  const { brides, isLoading } = useAdminBrides()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return brides
    const q = search.toLowerCase()
    return brides.filter((b) => {
      return (
        (b.full_name ?? '').toLowerCase().includes(q) ||
        (b.name ?? '').toLowerCase().includes(q) ||
        (b.email ?? '').toLowerCase().includes(q) ||
        (b.origin_business ?? '').toLowerCase().includes(q) ||
        (b.origin_email ?? '').toLowerCase().includes(q)
      )
    })
  }, [brides, search])

  const totalBrides = brides.filter((b) => b.is_bride).length

  const copyPortal = (portalLink: string | null) => {
    if (!portalLink) {
      toast.error('Essa cliente ainda não tem link de portal')
      return
    }
    const url = portalLink.startsWith('http')
      ? portalLink
      : `${window.location.origin}${portalLink.startsWith('/') ? '' : '/'}${portalLink}`
    navigator.clipboard.writeText(url)
    toast.success('Link do portal copiado')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-background border border-border rounded-none shadow-none">
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Total cadastradas
            </p>
            <p className="text-2xl font-serif text-white mt-1">{brides.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-background border border-border rounded-none shadow-none">
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Marcadas como noiva
            </p>
            <p className="text-2xl font-serif text-white mt-1">{totalBrides}</p>
          </CardContent>
        </Card>
        <Card className="bg-background border border-border rounded-none shadow-none">
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Com portal ativo
            </p>
            <p className="text-2xl font-serif text-white mt-1">
              {brides.filter((b) => b.portal_link).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-background border border-border rounded-none shadow-none">
        <CardHeader className="border-b border-border bg-zinc-900/30">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-white font-mono text-[11px] uppercase tracking-[0.3em] font-bold flex items-center gap-2">
              <Gem className="h-4 w-4" />
              Noivas / Clientes
            </CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, email ou maquiadora..."
                className="pl-9 h-9 bg-transparent border-border rounded-none font-mono text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
              Nenhuma noiva encontrada
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-black/40">
                    <th className="text-left py-3 px-4 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.25em] font-bold">
                      Noiva
                    </th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.25em] font-bold">
                      Cadastrada por
                    </th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.25em] font-bold">
                      Casamento
                    </th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.25em] font-bold">
                      Cadastrada em
                    </th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.25em] font-bold">
                      Portal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const displayName = b.full_name ?? b.name ?? '—'
                    const weddingLabel = b.wedding_date
                      ? new Date(b.wedding_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'
                    const createdLabel = b.created_at
                      ? formatDistanceToNow(new Date(b.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })
                      : '—'
                    return (
                      <tr
                        key={b.id}
                        className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-serif text-sm text-white flex items-center gap-2">
                              {displayName}
                              {b.is_bride && (
                                <Gem className="h-3 w-3 text-white/50" />
                              )}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-600">
                              {b.email ?? '—'}
                              {b.phone ? ` · ${b.phone}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-white/80">
                              {b.origin_business ?? '—'}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-600">
                              {b.origin_email ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[11px] font-mono text-zinc-400 uppercase">
                          {weddingLabel}
                        </td>
                        <td className="py-3 px-4 text-[10px] font-mono text-zinc-500">
                          {createdLabel}
                        </td>
                        <td className="py-3 px-4">
                          {b.portal_link ? (
                            <button
                              type="button"
                              onClick={() => copyPortal(b.portal_link)}
                              aria-label={`Copiar link do portal de ${displayName}`}
                              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-mono text-[10px] uppercase tracking-widest"
                            >
                              <LinkIcon className="h-3 w-3" />
                              Copiar
                              <Copy className="h-3 w-3 opacity-50" />
                            </button>
                          ) : (
                            <span className="text-zinc-600 font-mono text-[10px] uppercase">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
