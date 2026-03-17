import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Copy, Eye, History } from 'lucide-react'
import { format } from 'date-fns/format'
import { toast } from 'sonner'
import { AuditLog, NotificationLog, SystemLog } from '@/types/audit'
import { formatTableName } from './LogFilters'
import { useState } from 'react'

interface LogTableProps {
  activeTab: string
  loading: boolean
  systemLogs: SystemLog[]
  auditLogs: AuditLog[]
  emailLogs: NotificationLog[]
  onSelectAudit: (log: AuditLog) => void
}

export function LogTable({
  activeTab,
  loading,
  systemLogs,
  auditLogs,
  emailLogs,
  onSelectAudit,
}: LogTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success('UUID copiado para o terminal')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getSeverityBadge = (severity: string) => {
    const norm = severity?.toLowerCase()
    switch (norm) {
      case 'error':
        return (
          <Badge
            variant="destructive"
            className="rounded-none uppercase text-[10px]"
          >
            Critical
          </Badge>
        )
      case 'warning':
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-500 rounded-none uppercase text-[10px] bg-yellow-500/10"
          >
            Warning
          </Badge>
        )
      case 'success':
        return (
          <Badge
            variant="outline"
            className="border-green-500 text-green-500 rounded-none uppercase text-[10px] bg-green-500/10"
          >
            Stable
          </Badge>
        )
      case 'fatal':
        return (
          <Badge
            variant="destructive"
            className="rounded-none uppercase text-[10px] border-double"
          >
            Fatal
          </Badge>
        )
      default:
        return (
          <Badge
            variant="secondary"
            className="rounded-none uppercase text-[10px]"
          >
            Info
          </Badge>
        )
    }
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
    if (norm?.startsWith('SEND_WHATSAPP_')) {
      return (
        <Badge
          variant="outline"
          className="border-emerald-500 text-emerald-500 rounded-none uppercase text-[10px] bg-emerald-500/10 font-bold"
        >
          {action.replace('SEND_WHATSAPP_', '')}
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

  const getEmailStatusBadge = (status: string | null) => {
    switch (status) {
      case 'sent':
        return (
          <Badge
            variant="outline"
            className="border-green-500 text-green-500 rounded-none uppercase text-[10px] bg-green-500/10 font-mono"
          >
            DELIVERED
          </Badge>
        )
      case 'failed':
        return (
          <Badge
            variant="destructive"
            className="rounded-none uppercase text-[10px] font-mono"
          >
            BOUNCED
          </Badge>
        )
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-500 rounded-none uppercase text-[10px] bg-yellow-500/10 font-mono"
          >
            QUEUED
          </Badge>
        )
      default:
        return (
          <Badge
            variant="secondary"
            className="rounded-none uppercase text-[10px] font-mono"
          >
            {status || 'UNKNOWN'}
          </Badge>
        )
    }
  }

  if (activeTab === 'system') {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                Timestamp
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                Level
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                Message
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500 text-right">
                Source
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i} className="border-white/5">
                  <TableCell>
                    <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-white/5 rounded animate-pulse ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : systemLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center font-mono text-xs text-gray-500 italic"
                >
                  NO_SYSTEM_LOGS_RETURNED_FOR_QUERY
                </TableCell>
              </TableRow>
            ) : (
              systemLogs.map((log) => (
                <TableRow
                  key={log.id}
                  className="border-white/5 hover:bg-white/5 transition-colors font-mono text-xs text-gray-300"
                >
                  <TableCell className="whitespace-nowrap text-gray-500">
                    {log.timestamp
                      ? format(new Date(log.timestamp), 'HH:mm:ss.SSS')
                      : '--:--'}
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(log.severity || log.level || 'info')}
                  </TableCell>
                  <TableCell className="w-full">
                    <span className="text-white">{log.message}</span>
                  </TableCell>
                  <TableCell className="text-right text-gray-500">
                    {log.user_id ? (
                      <span className="cursor-help" title={log.user_id}>
                        {log.user_id.substring(0, 8)}
                      </span>
                    ) : (
                      'SYSTEM'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (activeTab === 'audit') {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                Created At
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                Action
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                Source
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                Resource
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                Operator
              </TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500 text-right">
                Details
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i} className="border-white/5">
                  <TableCell>
                    <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-10 bg-white/5 rounded animate-pulse ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : auditLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center font-mono text-xs text-gray-500 italic"
                >
                  NO_AUDIT_TRAIL_MATCHES_CRITERIA
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log) => (
                <TableRow
                  key={log.id}
                  className="border-white/5 hover:bg-white/5 transition-colors font-mono text-xs text-gray-300"
                >
                  <TableCell className="whitespace-nowrap text-gray-500">
                    {format(new Date(log.created_at), 'dd/MM HH:mm:ss')}
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-mono px-1 border ${log.source === 'WEB_UI' ? 'border-blue-500/50 text-blue-400' : 'border-purple-500/50 text-purple-400'}`}
                    >
                      {log.source || 'DB_TRIGGER'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-white uppercase tracking-tighter">
                        {formatTableName(log.table_name)}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-gray-600 truncate max-w-[120px] font-mono">
                          {log.record_id}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-3 w-3 p-0 hover:text-white"
                          onClick={() => handleCopy(log.record_id)}
                        >
                          {copiedId === log.record_id ? (
                            <Check className="h-2 w-2 text-green-500" />
                          ) : (
                            <Copy className="h-2 w-2" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {log.user_id ? (
                      <span
                        className="cursor-help font-mono"
                        title={log.user_id}
                      >
                        {log.user_id.substring(0, 8)}
                      </span>
                    ) : (
                      'SYSTEM'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSelectAudit(log)}
                      className="h-8 w-8 hover:bg-white hover:text-black rounded-none"
                    >
                      <History className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
              Created At
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
              Recipient
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
              Status
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500 text-right">
              Details
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            [1, 2, 3].map((i) => (
              <TableRow key={i} className="border-white/5">
                <TableCell>
                  <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-10 bg-white/5 rounded animate-pulse ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : emailLogs.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center font-mono text-xs text-gray-500 italic text-white/50"
              >
                NO_EMAIL_DELIVERY_LOGS_FOUND
              </TableCell>
            </TableRow>
          ) : (
            emailLogs.map((log) => (
              <TableRow
                key={log.id}
                className="border-white/5 hover:bg-white/5 transition-colors font-mono text-xs text-gray-300"
              >
                <TableCell className="whitespace-nowrap text-gray-500">
                  {format(new Date(log.created_at), 'dd/MM HH:mm:ss')}
                </TableCell>
                <TableCell className="text-white font-mono lowercase">
                  {log.recipient || 'N/A'}
                </TableCell>
                <TableCell>{getEmailStatusBadge(log.status)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onSelectAudit({
                        id: log.id,
                        user_id: null,
                        table_name: 'EMAIL_PROVIDER',
                        record_id: log.provider_id || 'N/A',
                        action: log.status?.toUpperCase() || 'SES_DELIVERY',
                        old_data: log.metadata,
                        new_data: log.error_message
                          ? { error: log.error_message }
                          : null,
                        created_at: log.created_at,
                      } as AuditLog)
                    }}
                    className="h-8 w-8 hover:bg-white hover:text-black rounded-none"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
