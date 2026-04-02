import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Trash2, Copy, Check } from 'lucide-react'
import { useAssistant } from '@/hooks/useAssistant'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export function AssistantInviteDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const { invites, loading, fetchInvites, sendInvite, revokeInvite } =
    useAssistant()
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchInvites()
    }
  }, [isOpen, fetchInvites])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    const newInvite = await sendInvite(email)
    if (newInvite) {
      setEmail('')
    }
  }

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/invite?token=${code}`
    navigator.clipboard.writeText(link)
    setCopiedToken(code)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-[#00e5ff]/20 text-[#00e5ff] hover:bg-[#00e5ff]/10"
        >
          <Mail className="w-4 h-4 mr-2" />
          Convidar Assistente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-[#121212]/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Equipe</DialogTitle>
          <DialogDescription className="text-gray-400">
            Convide assistentes para gerenciar sua agenda e clientes. Eles terão
            acesso limitado ao seu studio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Assistente</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                required
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Enviar'
                )}
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3 text-gray-400">
            Convites Enviados
          </h4>
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {invites.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">
                  Nenhum convite enviado.
                </p>
              ) : (
                invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">
                        {invite.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 ${
                            invite.status === 'accepted'
                              ? 'text-green-400 border-green-500/20 bg-green-500/10'
                              : invite.status === 'revoked'
                                ? 'text-red-400 border-red-500/20 bg-red-500/10'
                                : 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
                          }`}
                        >
                          {invite.status === 'pending'
                            ? 'Pendente'
                            : invite.status === 'accepted'
                              ? 'Aceito'
                              : 'Revogado'}
                        </Badge>
                        {invite.status === 'pending' && (
                          <button
                            onClick={() =>
                              copyLink(invite.invite_code || invite.token)
                            }
                            className="text-xs text-[#00e5ff] hover:underline flex items-center gap-1"
                          >
                            {copiedToken ===
                            (invite.invite_code || invite.token) ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            Copiar Link
                          </button>
                        )}
                      </div>
                    </div>
                    {invite.status === 'pending' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => revokeInvite(invite.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
