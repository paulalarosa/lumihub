import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { Save, AlertOctagon, UserPlus, Megaphone, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

type ConfigKey = 'maintenance_mode' | 'allow_registrations' | 'global_alert_message';

interface ConfigValues {
  maintenance_mode: boolean;
  allow_registrations: boolean;
  global_alert_message: string;
}

export default function AdminConfig() {
  const { t } = useLanguage();
  const [configs, setConfigs] = useState<ConfigValues>({
    maintenance_mode: false,
    allow_registrations: true,
    global_alert_message: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_config')
        .select('*');

      if (!error && data) {
        const newConfigs: Partial<ConfigValues> = {};
        data.forEach(item => {
          if (item.key === 'maintenance_mode' || item.key === 'allow_registrations') {
            newConfigs[item.key] = item.value === 'true';
          } else if (item.key === 'global_alert_message') {
            newConfigs[item.key] = String(item.value || '');
          }
        });
        setConfigs(prev => ({ ...prev, ...newConfigs }));
      }
    } catch (error) {
      logger.error(error, 'AdminConfig.fetchConfigs', { showToast: false });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: unknown) => {
    try {
      setSaving(true);

      // Optimistic update
      setConfigs(prev => ({ ...prev, [key]: value }));

      const { error } = await supabase
        .from('system_config')
        .upsert({ key, value: String(value) });

      if (error) throw error;

      toast.success(`Configuração [${key}] atualizada com sucesso.`);
    } catch (error) {
      logger.error(error, 'AdminConfig.handleSave', { showToast: false });
      toast.error('Falha ao atualizar parâmetros do sistema.');
      fetchConfigs(); // Revert
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
        <p className="text-gray-500 font-mono text-xs uppercase animate-pulse">Accessing_Core_Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maintenance Mode */}
        <Card className="bg-black border border-red-900/30 rounded-none relative overflow-hidden group">
          <div className={`absolute inset-0 bg-red-900/5 transition-opacity duration-300 ${configs.maintenance_mode ? 'opacity-100' : 'opacity-0'}`} />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className={`h-5 w-5 ${configs.maintenance_mode ? 'text-red-500' : 'text-gray-500'}`} />
                <CardTitle className="text-white font-serif tracking-tight">System Lock</CardTitle>
              </div>
              <Switch
                checked={configs.maintenance_mode}
                onCheckedChange={(checked) => handleSave('maintenance_mode', checked)}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
            <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-red-500/80">
              {t('admin_maintenance_mode')}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-gray-400 text-xs font-mono">
              When active, only Admin users can access the platform. All other sessions will be terminated or blocked.
            </p>
            {configs.maintenance_mode && (
              <Badge variant="outline" className="mt-4 border-red-500 text-red-500 animate-pulse bg-red-950/30 rounded-none">
                ACTIVE LOCKDOWN
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* New Registrations */}
        <Card className="bg-black border border-white/20 rounded-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-white" />
                <CardTitle className="text-white font-serif tracking-tight">Access Control</CardTitle>
              </div>
              <Switch
                checked={configs.allow_registrations}
                onCheckedChange={(checked) => handleSave('allow_registrations', checked)}
              />
            </div>
            <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
              {t('admin_new_registrations')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-xs font-mono">
              Enable or disable public signup forms. Existing invitations will still function.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Global Alert */}
      <Card className="bg-black border border-white/20 rounded-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-white" />
            <CardTitle className="text-white font-serif tracking-tight">Global Broadcast</CardTitle>
          </div>
          <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
            {t('admin_global_alert')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="sr-only">Message</Label>
              <Input
                value={configs.global_alert_message}
                onChange={(e) => setConfigs(prev => ({ ...prev, global_alert_message: e.target.value }))}
                className="bg-white/5 border-white/10 text-white font-mono rounded-none focus:border-white h-10"
                placeholder="ENTER SYSTEM MESSAGE..."
              />
            </div>
            <Button
              onClick={() => handleSave('global_alert_message', configs.global_alert_message)}
              className="rounded-none bg-white text-black hover:bg-gray-200 font-mono uppercase tracking-wider text-xs px-6"
            >
              <Terminal className="h-3 w-3 mr-2" />
              Broadcast
            </Button>
          </div>
          <p className="text-gray-500 text-[10px] font-mono mt-2">
            This message will appear as a banner on all user dashboards immediately. Leave empty to disable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
