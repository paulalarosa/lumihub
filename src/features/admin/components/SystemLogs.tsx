import { useSystemLogs } from "../hooks/useSystemLogs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity } from "lucide-react";

export const SystemLogs = () => {
    const { data: logs, isLoading } = useSystemLogs();

    if (isLoading) {
        return <div className="p-4 text-white animate-pulse">LOADING_LOGS...</div>;
    }

    if (!logs?.length) {
        return (
            <div className="p-12 border border-white/10 bg-black/20 text-center font-mono text-sm text-white/40">
                NO_SYSTEM_LOGS_FOUND
            </div>
        );
    }

    return (
        <div className="bg-black/40 border border-white/10 text-white font-mono text-xs">
            <Table>
                <TableHeader className="border-b border-white/10 bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white/60 font-bold uppercase tracking-wider w-[200px]">TIMESTAMP</TableHead>
                        <TableHead className="text-white/60 font-bold uppercase tracking-wider">EVENT</TableHead>
                        <TableHead className="text-white/60 font-bold uppercase tracking-wider">DETAILS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="text-white/40">
                                {log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) : '-'}
                            </TableCell>
                            <TableCell className="text-yellow-500">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-3 h-3 opacity-50" />
                                    {log.event_type}
                                </div>
                            </TableCell>
                            <TableCell className="text-white/60 truncate max-w-[300px]">
                                {JSON.stringify(log.metadata || {})}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
