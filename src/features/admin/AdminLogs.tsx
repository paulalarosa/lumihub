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
import { Terminal, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';

interface SystemLog {
  id: string;
  timestamp: string | null;
  level: string | null;
  severity: string | null;
  message: string | null;
  user_id: string | null;
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
      }
    }
  }
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const typedSupabase = supabase as unknown as SupabaseClient<LocalDatabase>;
      const { data, error } = await typedSupabase
        .from('system_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching system logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const norm = severity?.toLowerCase();
    switch (norm) {
      case 'error': return <Badge variant="destructive" className="rounded-none uppercase text-[10px]">Critical</Badge>;
      case 'warning': return <Badge variant="outline" className="border-yellow-500 text-yellow-500 rounded-none uppercase text-[10px] bg-yellow-500/10">Warning</Badge>;
      case 'success': return <Badge variant="outline" className="border-green-500 text-green-500 rounded-none uppercase text-[10px] bg-green-500/10">Stable</Badge>;
      default: return <Badge variant="secondary" className="rounded-none uppercase text-[10px]">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="bg-black border border-white/20 rounded-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-white" />
            <CardTitle className="text-white font-serif tracking-tight">System Logs</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} className="rounded-none border-white/20 hover:bg-white hover:text-black">
            <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
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
                  [1, 2, 3].map(i => (
                    <TableRow key={i} className="border-white/5">
                      <TableCell><div className="h-4 w-32 bg-white/5 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-white/5 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-64 bg-white/5 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-white/5 rounded animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center font-mono text-xs text-gray-500">
                      NO_LOGS_FOUND_IN_SYSTEM_REGISTRY
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-white/5 hover:bg-white/5 transition-colors font-mono text-xs text-gray-300">
                      <TableCell className="whitespace-nowrap text-gray-500">
                        {log.timestamp ? format(new Date(log.timestamp), "HH:mm:ss.SSS") : '--:--'}
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(log.severity || log.level)}
                      </TableCell>
                      <TableCell className="w-full">
                        <span className="text-white">{log.message}</span>
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        {log.user_id || 'SYSTEM'}
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
  );
}
