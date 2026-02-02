import { useState } from "react";
import { useClients } from "../hooks/useClients";
import { useDeleteClient } from "../hooks/useDeleteClient";
import { useUIStore } from "@/stores/useUIStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Mail, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pagination } from "@/components/ui/pagination";

import { CreateClientDialog } from "./CreateClientDialog";
import { ActionsMenu } from "@/components/ui/ActionsMenu";

export const ClientsTable = () => {
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data: result, isLoading, error } = useClients(page, limit);
    const { mutate: deleteClient, isPending: isDeleting } = useDeleteClient();
    const { searchTerm } = useUIStore();

    const clients = result?.data || [];
    const totalCount = result?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Filter logic (Note: Applies only to current page until server-side search is implemented)
    const filteredClients = clients.filter(client => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (client.name || '').toLowerCase().includes(term) ||
            (client.email || '').toLowerCase().includes(term)
        );
    });

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`CONFIRM DELETION OF TARGET: ${name}?`)) {
            deleteClient(id);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 p-4 border border-white/10 bg-black/50 animate-pulse text-white">
                LOADING_DATABASE...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 border border-red-500/20 bg-red-950/10 text-red-400 font-mono text-sm">
                SYSTEM_ERROR: {error.message}
            </div>
        );
    }

    if (!clients.length) {
        // Show empty state but still allow creating a client
        return (
            <div className="bg-white text-black border border-black flex flex-col">
                <div className="p-4 border-b border-black flex justify-end bg-gray-50">
                    <CreateClientDialog />
                </div>
                <div className="p-12 font-mono text-sm text-black/40 text-center uppercase tracking-widest">
                    NO_RECORDS_IN_DATABASE
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white text-black border border-black flex flex-col">
            <div className="p-4 border-b border-black flex justify-between items-center bg-gray-50">
                <span className="font-mono text-xs uppercase text-gray-500 tracking-wider">
                    Total Records: <span className="text-black font-bold">{totalCount}</span>
                </span>
                <CreateClientDialog />
            </div>
            <Table>
                <TableHeader className="bg-gray-100 border-b-2 border-black">
                    <TableRow className="border-black hover:bg-transparent">
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-black w-[300px] border-r border-black/10">NOME</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-black border-r border-black/10">EMAIL</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-black border-r border-black/10">TELEFONE</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-black border-r border-black/10">DATA DO EVENTO</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-black border-r border-black/10 text-center">DOCS</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-black text-right">AÇÕES</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredClients.map((client) => {
                        const contractUrl = (client as any).contract_url; // Cast to access potential new column
                        return (
                            <TableRow key={client.id} className="border-b border-black/10 hover:bg-yellow-50 transition-colors">
                                <TableCell className="font-medium text-black border-r border-black/10">
                                    <div className="flex flex-col">
                                        <span className="font-serif text-base tracking-tight">{client.name}</span>
                                        <span className="font-mono text-[10px] text-gray-400 uppercase">{client.id.slice(0, 8)}...</span>
                                    </div>
                                </TableCell>
                                <TableCell className="border-r border-black/10">
                                    {client.email ? (
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Mail className="w-3 h-3 text-gray-400" />
                                            {client.email}
                                        </div>
                                    ) : <span className="text-xs text-gray-300">-</span>}
                                </TableCell>
                                <TableCell className="border-r border-black/10">
                                    {client.phone ? (
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Phone className="w-3 h-3 text-gray-400" />
                                            {client.phone}
                                        </div>
                                    ) : <span className="text-xs text-gray-300">-</span>}
                                </TableCell>
                                <TableCell className="border-r border-black/10">
                                    {client.wedding_date ? (
                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-mono">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {format(new Date(client.wedding_date), 'dd/MM/yyyy', { locale: ptBR })}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-300 font-mono">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="border-r border-black/10 text-center">
                                    {contractUrl ? (
                                        <a
                                            href={contractUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black text-white hover:bg-yellow-500 hover:text-black transition-colors"
                                            title="View Contract"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                        </a>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <ActionsMenu
                                        id={client.id}
                                        contractUrl={contractUrl}
                                        onDelete={(id) => handleDelete(id, client.name || 'Client')}
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={isLoading}
            />
        </div>
    );
};
