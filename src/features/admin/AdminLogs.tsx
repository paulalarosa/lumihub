import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Terminal, History, RefreshCw, Eye, Binary, Search, Filter, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Database, Json } from '@/integrations/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface SystemLog {
  id: string;
  timestamp: string | null;
  level: string | null;
  severity: string | null;
  message: string | null;
  user_id: string | null;
}

interface AuditLog {
  id: string;
  user_id: string | null;
  table_name: string;
  record_id: string;
  action: string;
  source: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
}

interface NotificationLog {
  id: string;
  created_at: string;
  status: string | null;
  error_message: string | null;
  recipient: string | null;
  type: string | null;
  provider_id: string | null;
  metadata: Json | null;
}

// Local Database override
type LocalDatabase = Database & {
  public: {
    Tables: {
      system_logs: {
        Row: SystemLog;
        Insert: Omit<SystemLog, 'id'>;
        Update: Partial<Omit<SystemLog, 'id'>>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id'>;
        Update: Partial<Omit<AuditLog, 'id'>>;
        Relationships: [];
      };
      notification_logs: {
        Row: NotificationLog;
        Insert: Omit<NotificationLog, 'id'>;
        Update: Partial<Omit<NotificationLog, 'id'>>;
        Relationships: [];
      };
    }
  }
};

export default function AdminLogs() {
  const [activeTab, setActiveTab] = useState('system');
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [emailLogs, setEmailLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters State
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchTable, setSearchTable] = useState('');

  // Tables list for filter
  const [availableTables, setAvailableTables] = useState<string[]>([]);

  // Detail Modal State
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, filterUser, filterTable, filterAction]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAvailableTables();
    }
  }, [activeTab]);

  const fetchAvailableTables = async () => {
    try {
      const { data, error } = await supabase.rpc('get_audit_tables');
      if (data) setAvailableTables(data as string[]);
      // Fallback if RPC doesn't exist yet
      if (error) {
        const { data: fallbackData } = await supabase.from('audit_logs').select('table_name').limit(100);
        if (fallbackData) {
          const uniqueTables = Array.from(new Set(fallbackData.map(d => d.table_name)));
          setAvailableTables(uniqueTables);
        }
      }
    } catch (e) {
      console.error("Error fetching tables:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const typedSupabase = supabase as unknown as SupabaseClient<LocalDatabase>;
      if (activeTab === 'system') {
        let query = typedSupabase
          .from('system_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (filterUser !== 'all') {
          query = query.eq('user_id', filterUser);
        }

        const { data, error } = await query;
        if (error) throw error;
        setSystemLogs(data || []);
      } else if (activeTab === 'audit') {
        let query = typedSupabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (filterUser !== 'all') query = query.eq('user_id', filterUser);
        if (filterTable !== 'all') query = query.eq('table_name', filterTable);
        if (filterAction !== 'all') query = query.eq('action', filterAction);

        const { data, error } = await query;
        if (error) throw error;
        setAuditLogs(data || []);
      } else if (activeTab === 'email') {
        const { data, error } = await typedSupabase
          .from('notification_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        setEmailLogs(data || []);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} logs:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("UUID copiado para o terminal");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSeverityBadge = (severity: string) => {
    const norm = severity?.toLowerCase();
    switch (norm) {
      case 'error': return <Badge variant="destructive" className="rounded-none uppercase text-[10px]">Critical</Badge>;
      case 'warning': return <Badge variant="outline" className="border-yellow-500 text-yellow-500 rounded-none uppercase text-[10px] bg-yellow-500/10">Warning</Badge>;
      case 'success': return <Badge variant="outline" className="border-green-500 text-green-500 rounded-none uppercase text-[10px] bg-green-500/10">Stable</Badge>;
      case 'fatal': return <Badge variant="destructive" className="rounded-none uppercase text-[10px] border-double">Fatal</Badge>;
      default: return <Badge variant="secondary" className="rounded-none uppercase text-[10px]">Info</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    const norm = action?.toUpperCase();
    if (norm?.startsWith('SECURITY_')) {
      return <Badge variant="outline" className="border-red-500 text-red-500 rounded-none uppercase text-[10px] bg-red-500/10 border-double">{action.replace('SECURITY_', '')}</Badge>;
    }
    switch (norm) {
      case 'DELETE': return <Badge variant="destructive" className="rounded-none uppercase text-[10px]">Delete</Badge>;
      case 'UPDATE': return <Badge variant="outline" className="border-blue-500 text-blue-500 rounded-none uppercase text-[10px] bg-blue-500/10">Update</Badge>;
      case 'INSERT': return <Badge variant="outline" className="border-green-500 text-green-500 rounded-none uppercase text-[10px] bg-green-500/10">Insert</Badge>;
      default: return <Badge variant="secondary" className="rounded-none uppercase text-[10px]">{action}</Badge>;
    }
  };

  const getEmailStatusBadge = (status: string | null) => {
    switch (status) {
      case 'sent': return <Badge variant="outline" className="border-green-500 text-green-500 rounded-none uppercase text-[10px] bg-green-500/10 font-mono">DELIVERED</Badge>;
      case 'failed': return <Badge variant="destructive" className="rounded-none uppercase text-[10px] font-mono">BOUNCED</Badge>;
      case 'pending': return <Badge variant="outline" className="border-yellow-500 text-yellow-500 rounded-none uppercase text-[10px] bg-yellow-500/10 font-mono">QUEUED</Badge>;
      default: return <Badge variant="secondary" className="rounded-none uppercase text-[10px] font-mono">{status || 'UNKNOWN'}</Badge>;
    }
  };
  const JsonView = ({ label, data }: { label: string, data: Json | null }) => (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{label}</p>
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
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="bg-black border border-white/20 rounded-none">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-white" />
            <CardTitle className="text-white font-serif tracking-tight text-xl uppercase">KONTROL.AUDIT_TERMINAL</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchData} className="rounded-none border-white/20 hover:bg-white hover:text-black font-mono text-[10px] uppercase">
              <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
              RELOAD_BUFFER
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-white/5 border-b border-white/10 p-4 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3 text-gray-500" />
              <span className="text-[10px] font-mono text-gray-500 uppercase">Filters:</span>
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
              </SelectContent>
            </Select>

            {activeTab === 'audit' && (
              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger className="w-[180px] h-8 rounded-none border-white/10 bg-black text-[10px] font-mono uppercase">
                  <SelectValue placeholder="RESOURCE" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20 rounded-none text-white font-mono text-[10px] uppercase max-h-[300px]">
                  <SelectItem value="all">ALL_RESOURCES</SelectItem>
                  {availableTables.map(table => (
                    <SelectItem key={table} value={table}>{table.toUpperCase()}</SelectItem>
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

          <Tabs defaultValue="system" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 border-b border-white/10">
              <TabsList className="bg-transparent h-12 gap-6 p-0">
                <TabsTrigger value="system" className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent text-gray-500 data-[state=active]:text-white font-mono text-[10px] uppercase tracking-widest px-0">
                  SYSTEM_LOGS
                </TabsTrigger>
                <TabsTrigger value="audit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent text-gray-500 data-[state=active]:text-white font-mono text-[10px] uppercase tracking-widest px-0">
                  AUDIT_TRAIL
                </TabsTrigger>
                <TabsTrigger value="email" className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent text-gray-500 data-[state=active]:text-white font-mono text-[10px] uppercase tracking-widest px-0">
                  EMAIL_DELIVERY
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="system" className="m-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Timestamp</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Level</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Message</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500 text-right">Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [1, 2, 3, 4, 5].map(i => (
                        <TableRow key={i} className="border-white/5">
                          <TableCell><div className="h-4 w-32 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-4 w-16 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-4 w-64 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-4 w-24 bg-white/5 rounded animate-pulse ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : systemLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center font-mono text-xs text-gray-500 italic">
                          NO_SYSTEM_LOGS_RETURNED_FOR_QUERY
                        </TableCell>
                      </TableRow>
                    ) : (
                      systemLogs.map((log) => (
                        <TableRow key={log.id} className="border-white/5 hover:bg-white/5 transition-colors font-mono text-xs text-gray-300">
                          <TableCell className="whitespace-nowrap text-gray-500">
                            {log.timestamp ? format(new Date(log.timestamp), "HH:mm:ss.SSS") : '--:--'}
                          </TableCell>
                          <TableCell>
                            {getSeverityBadge(log.severity || log.level || 'info')}
                          </TableCell>
                          <TableCell className="w-full">
                            <span className="text-white">{log.message}</span>
                          </TableCell>
                          <TableCell className="text-right text-gray-500">
                            {log.user_id ? (
                              <span className="cursor-help" title={log.user_id}>{log.user_id.substring(0, 8)}</span>
                            ) : 'SYSTEM'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="audit" className="m-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Created At</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Action</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Source</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Resource</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Operator</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500 text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [1, 2, 3, 4, 5].map(i => (
                        <TableRow key={i} className="border-white/5">
                          <TableCell><div className="h-4 w-32 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-4 w-16 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-4 w-32 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-4 w-24 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-4 w-10 bg-white/5 rounded animate-pulse ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center font-mono text-xs text-gray-500 italic">
                          NO_AUDIT_TRAIL_MATCHES_CRITERIA
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id} className="border-white/5 hover:bg-white/5 transition-colors font-mono text-xs text-gray-300">
                          <TableCell className="whitespace-nowrap text-gray-500">
                            {format(new Date(log.created_at), "dd/MM HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            {getActionBadge(log.action)}
                          </TableCell>
                          <TableCell>
                            <span className={`text-[10px] font-mono px-1 border ${log.source === 'WEB_UI' ? 'border-blue-500/50 text-blue-400' : 'border-purple-500/50 text-purple-400'
                              }`}>
                              {log.source || 'DB_TRIGGER'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-white uppercase tracking-tighter">{log.table_name}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-gray-600 truncate max-w-[120px] font-mono">{log.record_id}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-3 w-3 p-0 hover:text-white"
                                  onClick={() => handleCopy(log.record_id)}
                                >
                                  {copiedId === log.record_id ? <Check className="h-2 w-2 text-green-500" /> : <Copy className="h-2 w-2" />}
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {log.user_id ? (
                              <span className="cursor-help font-mono" title={log.user_id}>{log.user_id.substring(0, 8)}</span>
                            ) : 'SYSTEM'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedAudit(log)}
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
            </TabsContent>

            <TabsContent value="email" className="m-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Created At</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Recipient</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Status</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-widest text-gray-500 text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [1, 2, 3, 4, 5].map(i => (
                        <TableRow key={i} className="border-white/5">
                          <TableCell><div className="h-4 w-32 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-4 w-48 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-4 w-16 bg-white/5 rounded animate-pulse" /></TableCell>
                          <TableCell><div className="h-4 w-10 bg-white/5 rounded animate-pulse ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : emailLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center font-mono text-xs text-gray-500 italic text-white/50">
                          NO_EMAIL_DELIVERY_LOGS_FOUND
                        </TableCell>
                      </TableRow>
                    ) : (
                      emailLogs.map((log) => (
                        <TableRow key={log.id} className="border-white/5 hover:bg-white/5 transition-colors font-mono text-xs text-gray-300">
                          <TableCell className="whitespace-nowrap text-gray-500">
                            {format(new Date(log.created_at), "dd/MM HH:mm:ss")}
                          </TableCell>
                          <TableCell className="text-white font-mono lowercase">
                            {log.recipient || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {getEmailStatusBadge(log.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                // Map to SelectedAudit for display consistency
                                setSelectedAudit({
                                  id: log.id,
                                  user_id: null,
                                  table_name: 'EMAIL_PROVIDER',
                                  record_id: log.provider_id || 'N/A',
                                  action: log.status?.toUpperCase() || 'SES_DELIVERY',
                                  old_data: log.metadata,
                                  new_data: log.error_message ? { error: log.error_message } : null,
                                  created_at: log.created_at
                                } as AuditLog);
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="p-4 border border-white/10 bg-white/5 font-mono text-[10px] uppercase text-gray-500 leading-relaxed flex justify-between items-center">
        <div>
          STATUS_OK: AUDIT_SYSTEM_ONLINE // ENCRYPTION_ACTIVE: AES_256 // PROTOCOL: KONTROL_PRO
        </div>
        <div className="flex gap-4">
          <span>UPTIME: 99.99%</span>
          <span className="text-white animate-pulse">● LIVE</span>
        </div>
      </div>

      {/* Audit Detail Dialog */}
      <Dialog open={!!selectedAudit} onOpenChange={() => setSelectedAudit(null)}>
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
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Resource</p>
                <p className="text-xs text-white uppercase font-mono">{selectedAudit?.table_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Action</p>
                <div>{getActionBadge(selectedAudit?.action || '')}</div>
              </div>
              <div>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Operator</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white font-mono">{selectedAudit?.user_id || 'SYSTEM'}</p>
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
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Sequence</p>
                <p className="text-xs text-white font-mono">{selectedAudit?.created_at && format(new Date(selectedAudit.created_at), "dd/MM/yyyy HH:mm:ss")}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                {selectedAudit?.table_name === 'EMAIL_PROVIDER' ? 'Provider Message ID' : 'Record ID (UUID)'}
              </p>
              <div className="flex items-center gap-2 bg-white/5 p-2 border border-white/10 w-fit">
                <code className="text-[10px] text-white font-mono">{selectedAudit?.record_id}</code>
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

            {selectedAudit?.table_name === 'EMAIL_PROVIDER' && selectedAudit.old_data && typeof selectedAudit.old_data === 'object' && !Array.isArray(selectedAudit.old_data) && (
              <div className="grid grid-cols-2 gap-6 bg-white/5 p-4 border border-white/10">
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Template</p>
                  <p className="text-xs text-green-500 font-mono">{(selectedAudit.old_data as any).template || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Provider</p>
                  <p className="text-xs text-white font-mono font-bold">AWS_SES_V2</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
              <JsonView label="[OLD_DATA_BUFFER]" data={selectedAudit?.old_data} />
              <JsonView label="[NEW_DATA_BUFFER]" data={selectedAudit?.new_data} />
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-white/10">
              <p className="text-[8px] font-mono text-gray-600 uppercase">
                CONFIDENTIAL: ACCESS_RESTRICTED_TO_KONTROL_ADMINS // LOG_ID: {selectedAudit?.id}
              </p>
              <Button
                onClick={() => setSelectedAudit(null)}
                className="rounded-none bg-white text-black hover:bg-gray-200 font-mono text-[10px] uppercase tracking-widest px-8"
              >
                DISCONNECT_TERMINAL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
