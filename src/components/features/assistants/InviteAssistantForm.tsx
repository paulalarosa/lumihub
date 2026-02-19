import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AlertCircle, CheckCircle, Copy, Mail } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface InviteAssistantFormProps {
  onSuccess?: () => void
}

export const InviteAssistantForm = ({
  onSuccess,
}: InviteAssistantFormProps) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email')
  const [loading, setLoading] = useState(false)
  const [makeupArtistId, setMakeupArtistId] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [existingAssistant, setExistingAssistant] = useState(false)

  useEffect(() => {
    if (user) {
      supabase
        .from('makeup_artists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setMakeupArtistId(data.id)
        })
    }
  }, [user])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 11) val = val.slice(0, 11)

    // Simple mask: (XX) XXXXX-XXXX
    if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`
    if (val.length > 9) val = `${val.slice(0, 10)}-${val.slice(10)}`

    setPhone(val)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()

    const targetValue = channel === 'email' ? email : phone
    if (!makeupArtistId || !targetValue) return

    setLoading(true)
    setError(null)
    setInviteLink(null)
    setExistingAssistant(false)

    try {
      if (!email) {
        throw new Error('O email é obrigatório para o cadastro da assistente.')
      }

      // 1. Verify existence
      const { data: _checkData, error: checkError } = await supabase.rpc(
        'check_assistant_exists',
        { p_email: email },
      )

      if (checkError) throw checkError

      const { data: rawData, error } = await (supabase.rpc(
        'create_assistant_invite',
        {
          p_makeup_artist_id: makeupArtistId,
          p_assistant_email: email,
        },
      ) as any)

      const data = rawData

      if (error) throw error

      if (data?.success) {
        setInviteLink(data.invite_link)

        // 2. Send notification
        if (channel === 'email') {
          await sendInviteEmail(email, data.invite_link, data.invite_id)
          toast({ title: 'Convite enviado por email!' })
        } else {
          await sendInviteWhatsApp(phone, data.invite_link, data.invite_id)
          toast({ title: 'Convite enviado por WhatsApp!' })
        }

        if (onSuccess) onSuccess()
      } else {
        setError(data.error || 'Erro ao criar convite')
        if (data.existing_assistant) {
          setExistingAssistant(true)
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const sendInviteEmail = async (
    recipientEmail: string,
    inviteLink: string,
    inviteId: string,
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const makeupArtistName =
        userData?.user?.user_metadata?.full_name ||
        userData?.user?.email?.split('@')[0] ||
        'Uma maquiadora'

      const { error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          to: recipientEmail,
          makeup_artist_name: makeupArtistName,
          invite_link: inviteLink,
          invite_id: inviteId,
        },
      })

      if (error) throw error
    } catch (_err) {
      toast({
        title: 'Aviso',
        description: 'Convite criado, mas o email falhou. Copie o link abaixo.',
        variant: 'destructive',
      })
    }
  }

  const sendInviteWhatsApp = async (
    recipientPhone: string,
    inviteLink: string,
    inviteId: string,
  ) => {
    if (!recipientPhone) return

    try {
      const { data: userData } = await supabase.auth.getUser()
      const makeupArtistName =
        userData?.user?.user_metadata?.full_name || 'Uma maquiadora'

      const cleanPhone = recipientPhone.replace(/\D/g, '')
      const formattedPhone = cleanPhone.startsWith('55')
        ? `+${cleanPhone}`
        : `+55${cleanPhone}`

      const { data, error } = await supabase.functions.invoke(
        'send-invite-whatsapp',
        {
          body: {
            to: formattedPhone,
            makeup_artist_name: makeupArtistName,
            invite_link: inviteLink,
            invite_id: inviteId,
          },
        },
      )

      // If success is boolean false or error exists, throw.
      if (error || (data && data.success === false))
        throw error || new Error(data?.error || 'Unknown error')
    } catch (_err) {
      toast({
        title: 'Aviso',
        description: 'Falha ao enviar WhatsApp. Copie o link manualmente.',
        variant: 'destructive',
      })
    }
  }

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      toast({ title: 'Link copiado!' })
    }
  }

  if (!makeupArtistId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <LoadingSpinner className="w-8 h-8" />
        <p className="text-sm text-muted-foreground">
          Carregando informações...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-medium">Convidar Assistente</h3>
      <p className="text-sm text-muted-foreground">
        Envie um convite para adicionar um assistente à sua equipe.
      </p>

      {/* Channel Selector */}
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={channel === 'email' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChannel('email')}
          className="flex-1"
        >
          <Mail className="w-4 h-4 mr-2" />
          Email
        </Button>
        <Button
          type="button"
          variant={channel === 'whatsapp' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChannel('whatsapp')}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 mr-2 fill-current"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          WhatsApp
        </Button>
      </div>

      <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="Email da assistente (Obrigatório)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />

        {channel === 'whatsapp' && (
          <Input
            type="tel"
            placeholder="WhatsApp (11) 99999-9999"
            value={phone}
            onChange={handlePhoneChange}
            className="flex-1"
            required={channel === 'whatsapp'}
          />
        )}

        <Button
          type="submit"
          disabled={loading}
          className={
            channel === 'whatsapp'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : ''
          }
        >
          {loading ? (
            <LoadingSpinner className="w-4 h-4 mr-2" />
          ) : channel === 'whatsapp' ? (
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 mr-2 fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          ) : (
            <Mail className="w-4 h-4 mr-2" />
          )}
          Convidar
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {existingAssistant
              ? 'Esta assistente já tem acesso à sua conta.'
              : error}
          </AlertDescription>
        </Alert>
      )}

      {inviteLink && (
        <Alert className="bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Convite Criado</AlertTitle>
          <AlertDescription>
            <div className="mt-2 flex items-center gap-2">
              <code className="bg-background/50 p-2 rounded text-xs flex-1 truncate select-all font-mono border">
                {inviteLink}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                className="h-8 w-8 shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
