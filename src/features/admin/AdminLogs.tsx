import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Terminal, RefreshCw, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuditDatabase, AuditLog, NotificationLog, SystemLog } from '@/types/audit';
import { LogFilters } from './components/logs/LogFilters';
import { LogTable } from './components/logs/LogTable';
import { LogDetailDialog } from './components/logs/LogDetailDialog';

export default function AdminLogs() {
  const [activeTab, setActiveTab] = useState('system');
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [emailLogs, setEmailLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [availableTables, setAvailableTables] = useState<string[]>([]);
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

      if (error) {
        // Fallback for types if RPC not generated yet, safely cast to unknown first
        const { data: fallbackData } = await (supabase.from('audit_logs') as unknown as SupabaseClient<AuditDatabase>['from']).select('table_name').limit(100);
        if (fallbackData) {
          const uniqueTables = Array.from(new Set((fallbackData as unknown as AuditLog[]).map(d => d.table_name)));
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
      const typedSupabase = supabase as unknown as SupabaseClient<AuditDatabase>;
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

  const handleExportCSV = () => {
    const dataToExport = activeTab === 'system' ? systemLogs : activeTab === 'audit' ? auditLogs : emailLogs;
    if (dataToExport.length === 0) return;

    const headers = Object.keys(dataToExport[0]).join(',');
    const csvRows = dataToExport.map(row => {
      // Create a record from the row to access by key safely
      const record = row as Record<string, unknown>;
      return Object.values(row)
        .map(value => {
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          return `"${stringValue.replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kontrol_${activeTab}_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="bg-black border border-white/20 rounded-none">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-white" />
            <CardTitle className="text-white font-serif tracking-tight text-xl uppercase">KONTROL.AUDIT_TERMINAL</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-none border-white/20 hover:bg-white hover:text-black font-mono text-[10px] uppercase">
              <FileDown className="h-3 w-3 mr-2" />
              EXPORT_CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} className="rounded-none border-white/20 hover:bg-white hover:text-black font-mono text-[10px] uppercase">
              <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
              RELOAD_BUFFER
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <LogFilters
            filterAction={filterAction}
            setFilterAction={setFilterAction}
            filterTable={filterTable}
            setFilterTable={setFilterTable}
            filterUser={filterUser}
            setFilterUser={setFilterUser}
            activeTab={activeTab}
            availableTables={availableTables}
          />

          <Tabs defaultValue="system" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 border-b border-white/10">
              <TabsList className="bg-transparent h-12 gap-6 p-0">
                {['system', 'audit', 'email'].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent text-gray-500 data-[state=active]:text-white font-mono text-[10px] uppercase tracking-widest px-0"
                  >
                    {tab === 'system' ? 'SYSTEM_LOGS' : tab === 'audit' ? 'AUDIT_TRAIL' : 'EMAIL_DELIVERY'}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="system" className="m-0">
              <LogTable
                activeTab="system"
                loading={loading}
                systemLogs={systemLogs}
                auditLogs={[]}
                emailLogs={[]}
                onSelectAudit={() => { }}
              />
            </TabsContent>
            <TabsContent value="audit" className="m-0">
              <LogTable
                activeTab="audit"
                loading={loading}
                systemLogs={[]}
                auditLogs={auditLogs}
                emailLogs={[]}
                onSelectAudit={setSelectedAudit}
              />
            </TabsContent>
            <TabsContent value="email" className="m-0">
              <LogTable
                activeTab="email"
                loading={loading}
                systemLogs={[]}
                auditLogs={[]}
                emailLogs={emailLogs}
                onSelectAudit={setSelectedAudit}
              />
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

      <LogDetailDialog selectedAudit={selectedAudit} onClose={() => setSelectedAudit(null)} />
    </div>
  );
}
