import { MessageCircle } from 'lucide-react'
import type { MakeupArtistContact } from '../hooks/useBrideDashboard'

interface Props {
  makeupArtist: MakeupArtistContact | null
  brideName?: string | null
}

/**
 * Botão flutuante de contato WhatsApp. Renderiza apenas se houver telefone
 * no cadastro da maquiadora. Mensagem pré-formatada pra noiva não precisar
 * "inventar" o que escrever.
 *
 * Visual: pill no rodapé da página, sticky — sempre visível em qualquer
 * tab do dashboard. Mobile-first.
 */
export function MakeupArtistContactButton({ makeupArtist, brideName }: Props) {
  const phone = makeupArtist?.whatsapp || makeupArtist?.phone
  if (!phone) return null

  // Sanitiza pra só dígitos; se vier com +55 ou espaços, wa.me ignora
  // caracteres não numéricos depois do domínio.
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null

  const firstName = makeupArtist?.full_name?.split(' ')[0] ?? 'você'
  const greeting = brideName ? `Oi ${firstName}, é a ${brideName}.` : `Oi ${firstName}!`
  const message = encodeURIComponent(
    `${greeting} Tudo bem? Queria tirar uma dúvida sobre o casamento.`,
  )

  const href = `https://wa.me/${digits}?text=${message}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 h-12 rounded-full shadow-lg transition-colors font-mono text-xs uppercase tracking-widest"
      aria-label={`Falar com ${makeupArtist?.full_name ?? 'maquiadora'} no WhatsApp`}
    >
      <MessageCircle className="w-4 h-4" />
      <span className="hidden sm:inline">
        Falar com {makeupArtist?.full_name?.split(' ')[0] ?? 'maquiadora'}
      </span>
      <span className="sm:hidden">WhatsApp</span>
    </a>
  )
}
