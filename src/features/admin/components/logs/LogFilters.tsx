import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter } from 'lucide-react'

interface LogFiltersProps {
  filterAction: string
  setFilterAction: (value: string) => void
  filterTable: string
  setFilterTable: (value: string) => void
  filterUser: string
  setFilterUser: (value: string) => void
  activeTab: string
  availableTables: string[]
}

export const formatTableName = (tableName: string) => {
  if (tableName === 'objects') return 'STORAGE_FILES'
  return tableName
}

export function LogFilters({
  filterAction,
  setFilterAction,
  filterTable,
  setFilterTable,
  filterUser,
  setFilterUser,
  activeTab,
  availableTables,
}: LogFiltersProps) {
  return (
    <div className="bg-white/5 border-b border-white/10 p-4 flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <Filter className="h-3 w-3 text-gray-500" />
        <span className="text-[10px] font-mono text-gray-500 uppercase">
          Filters:
        </span>
      </div>

      <Select value={filterAction} onValueChange={setFilterAction}>
        <SelectTrigger className="w-[140px] h-8 rounded-none border-white/10 bg-black text-[10px] font-mono uppercase">
          <SelectValue placeholder="ACTION" />
        </SelectTrigger>
        <SelectContent className="bg-black border-white/20 rounded-none text-white font-mono text-[10px] uppercase">
          <SelectItem value="all">ALL_ACTIONS</SelectItem>
          <SelectItem value="INSERT">INSERT</SelectItem>
          <SelectItem value="UPDATE">UPDATE</SelectItem>
          <SelectItem value="DELETE">DELETE</SelectItem>
          <SelectItem value="USER_SIGN_IN">SIGN_IN</SelectItem>
          <SelectItem value="SEND_WHATSAPP_CONFIRMATION">WA_CONFIRM</SelectItem>
          <SelectItem value="SEND_WHATSAPP_REMINDER">WA_REMIND</SelectItem>
          <SelectItem value="SEND_WHATSAPP_FEEDBACK">WA_FEEDBACK</SelectItem>
          <SelectItem value="SUBSCRIPTION_UPDATE">SUB_UPDATE</SelectItem>
          <SelectItem value="PAYMENT_SUCCESS">PAYMENT_OK</SelectItem>
          <SelectItem value="SYNC_CONFLICT">SYNC_CONFLICT</SelectItem>
        </SelectContent>
      </Select>

      {activeTab === 'audit' && (
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="w-[180px] h-8 rounded-none border-white/10 bg-black text-[10px] font-mono uppercase">
            <SelectValue placeholder="RESOURCE" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/20 rounded-none text-white font-mono text-[10px] uppercase max-h-[300px]">
            <SelectItem value="all">ALL_RESOURCES</SelectItem>
            {availableTables.map((table) => (
              <SelectItem key={table} value={table}>
                {formatTableName(table).toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Input
        placeholder="SEARCH_OPERATOR_ID"
        value={filterUser === 'all' ? '' : filterUser}
        onChange={(e) => setFilterUser(e.target.value || 'all')}
        className="w-[200px] h-8 rounded-none border-white/10 bg-black text-[10px] font-mono uppercase focus:border-white/40"
      />
    </div>
  )
}
