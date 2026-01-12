import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/AdminLayout';
import { ConfigItem } from '@/types/database';
import { Loader2 } from 'lucide-react';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<Record<string, ConfigItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch config
  useEffect(() => {
    if (user) {
      fetchConfig();
    }
  }, [user]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_config' as any)
        .select('*')
        .order('key');

      if (error) throw error;

      const configMap: Record<string, ConfigItem> = {};
      (data as any)?.forEach((item: ConfigItem) => {
        configMap[item.key] = item;
      });

      setConfig(configMap);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, newValue: boolean) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('system_config' as any)
        .update({ value: newValue ? 'true' : 'false' } as any)
        .eq('key', key);

      if (error) throw error;

      setConfig({
        ...config,
        [key]: {
          ...config[key],
          value: newValue ? 'true' : 'false',
        },
      });

      toast({
        title: 'Sucesso',
        description: 'Configuração atualizada',
      });
    } catch (err) {
      console.error('Erro ao salvar configuração:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a configuração',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getBooleanValue = (value: string | null): boolean => {
    return value === 'true' || value === '1';
  };

  // Feature flags to display
  const featureFlags = [
    {
      key: 'maintenance_mode',
      label: 'Modo de Manutenção',
      description: 'Desativa a plataforma para todos os usuários',
      icon: '🔧',
    },
    {
      key: 'new_registrations_enabled',
      label: 'Novos Cadastros',
      description: 'Permite que novos usuários se registrem na plataforma',
      icon: '👥',
    },
  ];

  const settingsGroups = [
    {
      title: 'Feature Flags',
      description: 'Controle de funcionalidades da plataforma',
      items: featureFlags,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Configurações
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Gerencie as configurações e feature flags da plataforma
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span>Carregando configurações...</span>
            </CardContent>
          </Card>
        )}

        {/* Settings Groups */}
        {!loading &&
          settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              {/* Group Header */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {group.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {group.description}
                </p>
              </div>

              {/* Settings Cards */}
              <div className="grid grid-cols-1 gap-4">
                {group.items.map((item) => {
                  const configItem = config[item.key];
                  const isEnabled = getBooleanValue(configItem?.value || 'false');

                  return (
                    <Card
                      key={item.key}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="py-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{item.icon}</span>
                              <Label className="text-base font-semibold cursor-pointer">
                                {item.label}
                              </Label>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {item.description}
                            </p>
                          </div>

                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(value) =>
                              handleToggle(item.key, value)
                            }
                            disabled={saving}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

        {/* Additional Info */}
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="text-base">Sobre Configurações</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p>
              • As alterações em configurações são aplicadas imediatamente para
              todos os usuários
            </p>
            <p>
              • O Modo de Manutenção mostrará uma página de manutenção para todos
              os usuários, exceto administradores
            </p>
            <p>
              • Novos Cadastros controla se novos usuários podem se registrar na
              plataforma
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
