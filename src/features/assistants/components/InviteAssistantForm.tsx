import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AlertCircle, CheckCircle, Copy, Send } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useQuery } from '@tanstack/react-query'

export const InviteAssistantForm = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [assistantName, setAssistantName] = useState('')
  const [assistantEmail, setAssistantEmail] = useState('')
  const [assistantPin, setAssistantPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: makeupArtistData } = useQuery({
    queryKey: ['makeup-artist-profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('makeup_artists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) return data

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

      // @ts-expect-error - Expected missing table typescript definition
      const { data: created } = await supabase
        .from('makeup_artists')
        .insert({
          user_id: user.id,
          business_name:
            profile?.full_name || user.email?.split('@')[0] || 'Profissional',
        })
        .select('id')
        .single()

      return created || null
    },
    enabled: !!user,
    retry: false,
  })

  const makeupArtistId = makeupArtistData?.id || null

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    setAssistantPin(pin)
  }

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !assistantName || !assistantEmail || !assistantPin) return

    setLoading(true)
    setError(null)
    setGeneratedLink(null)

    try {
      const normalizedEmail = assistantEmail.trim().toLowerCase()

      // @ts-expect-error - Expected missing table typescript definition
      const { data: existing } = await supabase
        .from('assistants')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle()

      let assistantId = existing?.id

      if (existing) {
        // @ts-expect-error - Expected missing table typescript definition
        await supabase
          .from('assistants')
          .update({ full_name: assistantName, pin: assistantPin })
          .eq('id', existing.id)
      } else {
        // @ts-expect-error - Expected missing table typescript definition
        const { data: newAssistant, error: insertError } = await supabase
          .from('assistants')
          .insert({
            full_name: assistantName,
            email: normalizedEmail,
            pin: assistantPin,
            user_id: null,
          })
          .select('id')
          .single()

        if (insertError) throw insertError
        assistantId = newAssistant.id
      }

      if (makeupArtistId && assistantId) {
        // @ts-expect-error - Expected missing table typescript definition
        const { data: existingAccess } = await supabase
          .from('assistant_access')
          .select('id')
          .eq('makeup_artist_id', makeupArtistId)
          .eq('assistant_id', assistantId)
          .maybeSingle()

        if (!existingAccess) {
          // @ts-expect-error - Expected missing table typescript definition
          const { error: accessError } = await supabase
            .from('assistant_access')
            .insert({
              makeup_artist_id: makeupArtistId,
              assistant_id: assistantId,
              status: 'active',
              granted_at: new Date().toISOString(),
            })

          if (accessError) throw accessError
        }
      }

      const portalLink = `${window.location.origin}/agenda-equipa/${user.id}`
      setGeneratedLink(portalLink)

      toast({ title: 'Assistente cadastrada com sucesso!' })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao cadastrar assistente'
      setError(message)
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      toast({ title: 'Link copiado!' })
    }
  }

  const shareViaWhatsApp = () => {
    if (!generatedLink) return
    const message = encodeURIComponent(
      `Olá ${assistantName}! Você acabou de ser adicionada à equipa.\n\nAcesse a agenda pelo link:\n${generatedLink}\n\nSeus dados de acesso:\nEmail: ${assistantEmail}\nPIN: ${assistantPin}`,
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const handleNewInvite = () => {
    setGeneratedLink(null)
    setAssistantName('')
    setAssistantEmail('')
    setAssistantPin('')
    setError(null)
  }

  if (generatedLink) {
    return (
      <div className="space-y-4 p-4">
        <Alert className="bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Assistente Cadastrada</AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="text-sm">
              Envie os dados abaixo para <strong>{assistantName}</strong>:
            </p>

            <div className="bg-background/50 p-3 rounded border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Link:</span>
                <code className="text-xs font-mono truncate max-w-[200px]">
                  {generatedLink}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Email:</span>
                <code className="text-xs font-mono">{assistantEmail}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">PIN:</span>
                <code className="text-xs font-mono font-bold">
                  {assistantPin}
                </code>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={shareViaWhatsApp}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                size="sm"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Enviar via WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={copyLink}
                className="flex-1 gap-2"
                size="sm"
              >
                <Copy className="h-4 w-4" />
                Copiar Link
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={handleNewInvite}
              className="w-full text-xs text-muted-foreground hover:text-white mt-2"
              size="sm"
            >
              Cadastrar outra assistente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-muted-foreground">
        Cadastre a assistente para dar acesso à agenda da equipa.
      </p>

      <form onSubmit={handleCreateAssistant} className="space-y-3">
        <Input
          type="text"
          placeholder="Nome da assistente"
          value={assistantName}
          onChange={(e) => setAssistantName(e.target.value)}
          required
        />

        <Input
          type="email"
          placeholder="Email da assistente"
          value={assistantEmail}
          onChange={(e) => setAssistantEmail(e.target.value)}
          required
        />

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="PIN de acesso (4 dígitos)"
            value={assistantPin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4)
              setAssistantPin(val)
            }}
            maxLength={4}
            required
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={generatePin}
            className="shrink-0 text-xs"
          >
            Gerar PIN
          </Button>
        </div>

        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading ? (
            <LoadingSpinner className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Cadastrar e Gerar Link
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
