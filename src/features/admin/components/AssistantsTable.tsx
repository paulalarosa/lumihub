import { useAssistants } from '../hooks/useAssistants'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2, Mail, User } from 'lucide-react'

export const AssistantsTable = () => {
  const { data: assistants, isLoading } = useAssistants()

  if (isLoading) {
    return (
      <div className="p-4 text-white animate-pulse">LOADING_ASSISTANTS...</div>
    )
  }

  if (!assistants?.length) {
    return (
      <div className="p-12 border border-white/10 bg-black/20 text-center">
        <div className="text-white/40 font-mono text-sm mb-4">
          NO_ASSISTANTS_FOUND
        </div>
        <Button
          variant="outline"
          className="h-8 text-xs font-mono uppercase rounded-none border-white/20 hover:bg-white hover:text-black"
        >
          <Plus className="w-3 h-3 mr-2" /> Invite Assistant
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white text-black border border-black">
      <div className="p-4 border-b border-black flex justify-end bg-gray-50">
        <Button
          size="sm"
          className="h-8 text-xs font-mono uppercase rounded-none bg-black text-white hover:bg-gray-800"
        >
          <Plus className="w-3 h-3 mr-2" /> Invite New
        </Button>
      </div>
      <Table>
        <TableHeader className="bg-gray-100 border-b-2 border-black">
          <TableRow className="border-black hover:bg-transparent">
            <TableHead className="font-bold text-xs uppercase tracking-wider text-black w-[300px] border-r border-black/10">
              NAME
            </TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-black border-r border-black/10">
              EMAIL
            </TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-black border-r border-black/10">
              STATUS
            </TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-black text-right">
              ACTIONS
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assistants.map((assistant) => (
            <TableRow
              key={assistant.id}
              className="border-b border-black/10 hover:bg-yellow-50 transition-colors"
            >
              <TableCell className="font-medium text-black border-r border-black/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-black/10">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-base tracking-tight">
                      {assistant.name || 'Unhamed'}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400 uppercase">
                      {assistant.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="border-r border-black/10">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail className="w-3 h-3 text-gray-400" />
                  {assistant.email}
                </div>
              </TableCell>
              <TableCell className="border-r border-black/10">
                <span
                  className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider border ${
                    assistant.status === 'active'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}
                >
                  {assistant.status || 'pending'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 text-black/50 hover:text-red-600 hover:bg-red-50 rounded-none"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
