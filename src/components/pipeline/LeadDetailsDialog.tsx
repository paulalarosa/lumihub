import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  FileText,
  MessageSquare,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/textarea'

import { PipelineLead } from '@/pages/SalesPipeline'

interface LeadDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  lead: PipelineLead | null
}

export const LeadDetailsDialog = ({
  isOpen,
  onClose,
  lead,
}: LeadDetailsDialogProps) => {
  if (!lead) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 bg-neutral-900 border-neutral-800 text-white">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-neutral-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-neutral-700">
                <AvatarFallback className="text-xl bg-neutral-800">
                  {lead.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {lead.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1 text-neutral-400">
                  {lead.event_type && (
                    <Badge variant="outline">{lead.event_type}</Badge>
                  )}
                  <span>•</span>
                  <span className="text-sm">
                    Criado em {new Date(lead.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="font-mono font-bold">
                  {lead.lead_score} Score
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Info */}
          <ScrollArea className="w-1/3 border-r border-neutral-800 p-6 bg-neutral-900/50">
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                  Contato
                </h4>

                {lead.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 rounded-md bg-neutral-800">
                      <Mail className="w-4 h-4 text-neutral-400" />
                    </div>
                    <span>{lead.email}</span>
                  </div>
                )}

                {lead.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 rounded-md bg-neutral-800">
                      <Phone className="w-4 h-4 text-neutral-400" />
                    </div>
                    <span>{lead.phone}</span>
                  </div>
                )}
              </div>

              <Separator className="bg-neutral-800" />

              {/* Event Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                  Evento
                </h4>

                {lead.event_date && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 rounded-md bg-neutral-800">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Data</p>
                      <p className="text-neutral-400">
                        {new Date(lead.event_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {lead.estimated_budget && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 rounded-md bg-neutral-800">
                      <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Orçamento</p>
                      <p className="text-neutral-400">
                        R$ {lead.estimated_budget.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-neutral-800" />

              {/* Source */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                  Origem
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700">
                    {lead.source || 'Não informado'}
                  </Badge>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Main Content (History & Actions) */}
          <div className="flex-1 flex flex-col bg-neutral-950">
            {/* Tabs or Action Bar could go here */}
            <div className="p-4 border-b border-neutral-800 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-neutral-900 border-neutral-700"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Nova Nota
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-neutral-900 border-neutral-700"
              >
                <Clock className="w-4 h-4 mr-2" />
                Agendar Tarefa
              </Button>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Timeline Placeholder */}
                <div className="flex gap-4">
                  <div className="w-8 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center border border-blue-500/30">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="w-0.5 flex-1 bg-neutral-800 my-2" />
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                      <p className="text-sm text-neutral-400">
                        Lead criado no sistema
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        {new Date(lead.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {lead.notes && (
                  <div className="flex gap-4">
                    <div className="w-8 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center border border-yellow-500/30">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                        <p className="text-sm font-medium mb-1">Nota Inicial</p>
                        <p className="text-sm text-neutral-400">{lead.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-neutral-800 bg-neutral-900">
              <Textarea
                placeholder="Escreva uma nota..."
                className="bg-neutral-950 border-neutral-800 min-h-[80px] text-sm"
              />
              <div className="flex justify-end mt-2">
                <Button size="sm">Adicionar Nota</Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
