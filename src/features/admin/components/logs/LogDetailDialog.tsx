import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Binary, Copy } from 'lucide-react'
import { format } from 'date-fns/format'
import { toast } from 'sonner'
import { AuditLog } from '@/types/audit'
import { Json } from '@/integrations/supabase/types'

interface LogDetailDialogProps {
  selectedAudit: AuditLog | null
  onClose: () => void
}

export function LogDetailDialog({
  selectedAudit,
  onClose,
}: LogDetailDialogProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para o terminal')
  }

  const getActionBadge = (action: string) => {
    const norm = action?.toUpperCase()
    if (norm?.startsWith('SECURITY_')) {
      return (
        <Badge
          variant="outline"
          className="border-red-500 text-red-500 rounded-none uppercase text-[10px] bg-red-500/10 border-double"
        >
          {action.replace('SECURITY_', '')}
        </Badge>
      )
    }
    const badges: Record<string, JSX.Element> = {
      SUBSCRIPTION_UPDATE: (
        <Badge
          variant="outline"
          className="border-purple-500 text-purple-500 rounded-none uppercase text-[10px] bg-purple-500/10"
        >
          Subscription
        </Badge>
      ),
      PAYMENT_SUCCESS: (
        <Badge
          variant="outline"
          className="border-green-500 text-green-500 rounded-none uppercase text-[10px] bg-green-500/10 font-bold"
        >
          $ Paid
        </Badge>
      ),
      SYNC_CONFLICT: (
        <Badge
          variant="outline"
          className="border-orange-500 text-orange-500 rounded-none uppercase text-[10px] bg-orange-500/10 font-bold"
        >
          Conflict
        </Badge>
      ),
      DELETE: (
        <Badge
          variant="destructive"
          className="rounded-none uppercase text-[10px]"
        >
          Delete
        </Badge>
      ),
      UPDATE: (
        <Badge
          variant="outline"
          className="border-blue-500 text-blue-500 rounded-none uppercase text-[10px] bg-blue-500/10"
        >
          Update
        </Badge>
      ),
      INSERT: (
        <Badge
          variant="outline"
          className="border-green-500 text-green-500 rounded-none uppercase text-[10px] bg-green-500/10"
        >
          Insert
        </Badge>
      ),
    }

    return (
      badges[norm || ''] || (
        <Badge
          variant="secondary"
          className="rounded-none uppercase text-[10px]"
        >
          {action}
        </Badge>
      )
    )
  }

  const JsonView = ({ label, data }: { label: string; data: Json | null }) => (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          {label}
        </p>
        {data && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(JSON.stringify(data, null, 2))}
            className="h-4 p-0 text-gray-600 hover:text-white"
          >
            <Copy className="h-2 w-2 mr-1" />
            <span className="text-[8px] uppercase">Copy</span>
          </Button>
        )}
      </div>
      <div className="bg-white/5 border border-white/10 p-4 overflow-auto max-h-[300px] group relative">
        <pre className="text-[10px] font-mono text-white leading-relaxed">
          {data ? JSON.stringify(data, null, 2) : 'NULL'}
        </pre>
      </div>
    </div>
  )

  return (
    <Dialog open={!!selectedAudit} onOpenChange={onClose}>
      <DialogContent className="bg-black border border-white/20 rounded-none max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-white/10 pb-4">
          <DialogTitle className="flex items-center gap-2 font-serif text-white text-xl">
            <Binary className="h-5 w-5" />
            TERMINAL_STATE_INSPECTOR
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-white/10 pb-6">
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                Resource
              </p>
              <p className="text-xs text-white uppercase font-mono">
                {selectedAudit?.table_name}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                Action
              </p>
              <div>{getActionBadge(selectedAudit?.action || '')}</div>
            </div>
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                Operator
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-white font-mono">
                  {selectedAudit?.user_id || 'SYSTEM'}
                </p>
                {selectedAudit?.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-3 w-3 p-0"
                    onClick={() => handleCopy(selectedAudit.user_id!)}
                  >
                    <Copy className="h-2 w-2" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                Sequence
              </p>
              <p className="text-xs text-white font-mono">
                {selectedAudit?.created_at &&
                  format(
                    new Date(selectedAudit.created_at),
                    'dd/MM/yyyy HH:mm:ss',
                  )}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
              {selectedAudit?.table_name === 'EMAIL_PROVIDER'
                ? 'Provider Message ID'
                : 'Record ID (UUID)'}
            </p>
            <div className="flex items-center gap-2 bg-white/5 p-2 border border-white/10 w-fit">
              <code className="text-[10px] text-white font-mono">
                {selectedAudit?.record_id}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => handleCopy(selectedAudit?.record_id || '')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {selectedAudit?.table_name === 'EMAIL_PROVIDER' &&
            selectedAudit.old_data &&
            typeof selectedAudit.old_data === 'object' &&
            !Array.isArray(selectedAudit.old_data) && (
              <div className="grid grid-cols-2 gap-6 bg-white/5 p-4 border border-white/10">
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                    Template
                  </p>
                  <p className="text-xs text-green-500 font-mono">
                    {((selectedAudit.old_data as Record<string, unknown>)
                      ?.template as string) || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                    Provider
                  </p>
                  <p className="text-xs text-white font-mono font-bold">
                    AWS_SES_V2
                  </p>
                </div>
              </div>
            )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
            <JsonView
              label="[OLD_DATA_BUFFER]"
              data={selectedAudit?.old_data}
            />
            <JsonView
              label="[NEW_DATA_BUFFER]"
              data={selectedAudit?.new_data}
            />
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-white/10">
            <p className="text-[8px] font-mono text-gray-600 uppercase">
              CONFIDENTIAL: ACCESS_RESTRICTED_TO_KONTROL_ADMINS // LOG_ID:{' '}
              {selectedAudit?.id}
            </p>
            <Button
              onClick={onClose}
              className="rounded-none bg-white text-black hover:bg-gray-200 font-mono text-[10px] uppercase tracking-widest px-8"
            >
              DISCONNECT_TERMINAL
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
