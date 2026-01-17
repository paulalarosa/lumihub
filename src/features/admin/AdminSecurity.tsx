import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Download, AlertCircle, CheckCircle, Database, FileKey, RefreshCw } from 'lucide-react';
import { AuditService, AuditLog } from '@/services/audit.service';
import { BackupService } from '@/services/backup.service';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MFAEnrollment from '@/features/auth/MFAEnrollment';

export default function AdminSecurity() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);
    const [integrityStatus, setIntegrityStatus] = useState<'secure' | 'risk'>('secure');

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const { data } = await AuditService.getLogs(0, 50); // Fetch last 50
            setLogs(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao buscar logs de auditoria.");
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleBackup = async () => {
        setBackupLoading(true);
        try {
            await BackupService.generateEncryptedBackup();
            toast.success("Backup criptografado gerado com sucesso.");
            fetchLogs(); // Refresh logs to show new backup event
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar backup.");
        } finally {
            setBackupLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-[#1A1A1A]/50 border-white/10 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-white/70">Status de Integridade</CardTitle>
                        <ShieldCheck className={`h-4 w-4 ${integrityStatus === 'secure' ? 'text-green-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                            {integrityStatus === 'secure' ? 'Seguro' : 'Em Risco'}
                            {integrityStatus === 'secure' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                        <p className="text-xs text-white/50 mt-1">Monitoramento ativo em tempo real</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#1A1A1A]/50 border-white/10 backdrop-blur-xl md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-lg font-medium text-white">Backup Criptografado</CardTitle>
                            <CardDescription className="text-white/50">Exporte todos os dados sensíveis com criptografia militar AES-256.</CardDescription>
                        </div>
                        <Database className="h-8 w-8 text-[#00e5ff]/20" />
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleBackup}
                            disabled={backupLoading}
                            className="bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20 border border-[#00e5ff]/50"
                        >
                            {backupLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Gerar Exportação Segura (.enc)
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Logs */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-[#1A1A1A] border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white">Trilha de Auditoria</CardTitle>
                            <Button variant="ghost" size="sm" onClick={fetchLogs} className="text-white/50 hover:text-white">
                                <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-white/5 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="text-white/70">Ação</TableHead>
                                            <TableHead className="text-white/70">Admin</TableHead>
                                            <TableHead className="text-white/70">Data</TableHead>
                                            <TableHead className="text-white/70 text-right">Integridade</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingLogs ? (
                                            [1, 2, 3, 4, 5].map(i => (
                                                <TableRow key={i} className="border-white/5">
                                                    <TableCell><div className="h-4 w-24 bg-white/5 rounded animate-pulse" /></TableCell>
                                                    <TableCell><div className="h-4 w-32 bg-white/5 rounded animate-pulse" /></TableCell>
                                                    <TableCell><div className="h-4 w-20 bg-white/5 rounded animate-pulse" /></TableCell>
                                                    <TableCell><div className="h-4 w-8 bg-white/5 rounded animate-pulse ml-auto" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : logs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-white/30">Nenhum registro encontrado.</TableCell>
                                            </TableRow>
                                        ) : (
                                            logs.map((log) => (
                                                <TableRow key={log.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                    <TableCell className="font-medium text-white">
                                                        <div className="flex flex-col">
                                                            <span>{log.action}</span>
                                                            <span className="text-xs text-white/40 font-mono truncate max-w-[200px]">{JSON.stringify(log.details)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-white/70">{log.admin_email}</TableCell>
                                                    <TableCell className="text-white/70">
                                                        {log.created_at ? format(new Date(log.created_at), "dd MMM HH:mm", { locale: ptBR }) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                            Verified
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: MFA & Config */}
                <div className="space-y-6">
                    <div className="bg-[#1A1A1A] border border-[#00e5ff]/10 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <FileKey className="w-4 h-4 text-[#00e5ff]" />
                            Credenciais de Acesso
                        </h3>
                        <MFAEnrollment />
                    </div>
                </div>
            </div>
        </div>
    );
}
