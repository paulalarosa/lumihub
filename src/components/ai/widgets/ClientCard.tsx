import { User, Mail, Phone, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ClientCardProps {
  client: {
    name: string
    email?: string
    phone?: string
    notes?: string
    id?: string
  }
}

export const ClientCard = ({ client }: ClientCardProps) => {
  return (
    <div className="bg-zinc-950/50 border border-white/10 rounded-none p-4 space-y-4 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-[12px] font-bold text-white font-mono uppercase tracking-widest">
              {client.name}
            </h4>
            <p className="text-[8px] font-mono uppercase text-zinc-500">
              Entity Profile
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-none hover:bg-white/10"
        >
          <ExternalLink className="w-3 h-3 text-zinc-500" />
        </Button>
      </div>

      <div className="space-y-2 border-t border-white/5 pt-3">
        {client.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-400">
              {client.email}
            </span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-400">
              {client.phone}
            </span>
          </div>
        )}
      </div>

      {client.notes && (
        <div className="bg-black/40 border border-white/5 p-2 rounded-none">
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="w-3 h-3 text-zinc-600" />
            <span className="text-[8px] font-mono uppercase text-zinc-600">
              Registry Notes
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed italic">
            "{client.notes}"
          </p>
        </div>
      )}
    </div>
  )
}
