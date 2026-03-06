import { useState } from 'react'
import { generateWhatsAppLink } from '@/utils/whatsappGenerator'
import { supabase } from '@/integrations/supabase/client'
import {
  MessageCircle,
  ChevronDown,
  Check,
  Clock,
  Heart,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useOrganization } from '@/hooks/useOrganization'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'

interface WhatsAppProps {
  project: {
    event_date?: string | Date
    event_location?: string | null
    id?: string
    name?: string
  }
  client: {
    phone?: string | null
    full_name?: string | null
    name?: string | null
    id?: string
    email?: string | null
  }
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}

export const WhatsAppActionMenu = ({
  project,
  client,
  variant = 'default',
  className,
}: WhatsAppProps) => {
  const { organizationId } = useOrganization()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSend = async (templateType: string) => {
    if (!client?.phone) {
      toast({ title: 'Cliente sem telefone', variant: 'destructive' })
      return
    }

    setLoading(true)

    try {
      // 1. Fetch Template
      if (!organizationId) {
        setLoading(false)
        return
      }

      const { data: template } = await supabase
        .from('message_templates')
        .select('content')
        .eq('organization_id', organizationId)
        .eq('type', templateType)
        .maybeSingle()

      // Fallback content
      let rawText = template?.content
      if (!rawText) {
        switch (templateType) {
          case 'confirmation':
            rawText =
              'Olá {client_name}, gostaria de confirmar seu agendamento.'
            break
          case 'reminder_24h':
            rawText = 'Olá {client_name}, lembrete do seu horário amanhã.'
            break
          case 'thanks':
            rawText = 'Obrigado pela preferência, {client_name}!'
            break
          default:
            rawText = 'Olá {client_name}!'
        }
      }

      // 2. Fetch Professional Name
      let professionalName = 'KONTROL'
      if (user) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (profData?.full_name) professionalName = profData.full_name
      }

      // 3. Generate Link
      const link = generateWhatsAppLink(rawText, {
        client_name: client.full_name || client.name || 'Cliente',
        professional_name: professionalName,
        date: project.event_date
          ? new Date(project.event_date).toLocaleDateString('pt-BR')
          : 'Data a definir',
        time: project.event_date
          ? new Date(project.event_date).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Horário a definir',
        location: project.event_location || 'Local a definir',
        phone: client.phone,
      })

      // 4. Open WhatsApp
      window.open(link, '_blank')
    } catch (error) {
      logger.error(error, { message: 'Erro ao gerar link.', showToast: false })
      toast({ title: 'Erro ao gerar link', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          className={`gap-2 bg-whatsapp hover:bg-emerald-700 text-white border-none font-mono text-xs uppercase tracking-widest ${className}`}
          disabled={loading}
        >
          <MessageCircle className="h-4 w-4" />
          {loading ? 'GERANDO...' : 'WHATSAPP'}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-zinc-900 border-zinc-800 text-zinc-100 min-w-[200px]"
      >
        <DropdownMenuItem
          onClick={() => handleSend('confirmation')}
          className="cursor-pointer font-mono text-xs uppercase hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white"
        >
          <Check className="mr-2 h-3 w-3 text-green-500" />
          Confirmar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSend('reminder_24h')}
          className="cursor-pointer font-mono text-xs uppercase hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white"
        >
          <Clock className="mr-2 h-3 w-3 text-yellow-500" />
          Lembrete (24h)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSend('thanks')}
          className="cursor-pointer font-mono text-xs uppercase hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white"
        >
          <Heart className="mr-2 h-3 w-3 text-pink-500" />
          Agradecimento
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem
          onClick={() => handleSend('custom')}
          className="cursor-pointer font-mono text-xs uppercase hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white"
        >
          <MessageSquare className="mr-2 h-3 w-3 text-zinc-400" />
          Mensagem Livre
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
