import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Download, CheckCircle, Database, FileKey, RefreshCw, AlertTriangle } from 'lucide-react';
import { AuditService } from '@/services/audit.service';
import { BackupService } from '@/services/backup.service';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MFAEnrollment from '@/features/auth/MFAEnrollment';
import { useLanguage } from '@/hooks/useLanguage';

export default function AdminSecurity() {
    const { t } = useLanguage();
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);
    const [integrityStatus, setIntegrityStatus] = useState<'secure' | 'risk'>('secure');

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const { data } = await AuditService.getLogs(0, 10); // Fetch detailed recent logs
            setLogs(data || []);
        } catch (error) {
            console.error(error);
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
            fetchLogs();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar backup.");
        } finally {
            setBackupLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-black border border-white/20 rounded-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 font-mono uppercase tracking-widest">Integrity Status</CardTitle>
                        <ShieldCheck className={`h-4 w-4 ${integrityStatus === 'secure' ? 'text-green-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center gap-2 font-serif">
                            {integrityStatus === 'secure' ? 'SECURE' : 'AT RISK'}
                            {integrityStatus === 'secure' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 font-mono uppercase">System Monitoring Active</p>
                    </CardContent>
                </Card>

                <Card className="bg-black border border-white/20 rounded-none md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-lg font-bold text-white font-serif tracking-tight">Encrypted Backup</CardTitle>
                            <CardDescription className="text-gray-500 text-xs font-mono">Military-grade AES-256 encryption. Full DB dump.</CardDescription>
                        </div>
                        <Database className="h-6 w-6 text-white/20" />
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleBackup}
                            disabled={backupLoading}
                            variant="outline"
                            className="rounded-none border-white/30 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-wider w-full md:w-auto"
                        >
                            {backupLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {t('admin_backup_generate')}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="bg-black border border-white/20 rounded-none">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
                            <CardTitle className="text-white font-serif text-lg">Recent Security Events</CardTitle>
                            <Button variant="ghost" size="sm" onClick={fetchLogs} className="text-gray-500 hover:text-white rounded-none">
                                <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Simplified table for security events */}
                            <div className="divide-y divide-white/10">
                                {logs.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 font-mono text-xs">No recent security events detected.</div>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 rounded-full">
                                                    <AlertTriangle className="h-3 w-3 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-medium">{log.action}</p>
                                                    <p className="text-gray-500 text-[10px] font-mono">{log.admin_email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-gray-500 text-[10px] font-mono block">
                                                    {log.created_at ? format(new Date(log.created_at), "HH:mm", { locale: ptBR }) : '-'}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] font-mono border-green-900 text-green-500 bg-green-900/10 rounded-none h-4 px-1">
                                                    LOGGED
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="bg-black border border-white/20 rounded-none h-full">
                        <CardHeader className="border-b border-white/10 pb-4">
                            <CardTitle className="text-white font-serif text-lg flex items-center gap-2">
                                <FileKey className="w-4 h-4" />
                                Credentials & MFA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <MFAEnrollment />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
