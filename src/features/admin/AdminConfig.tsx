import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { RotateCcw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ConfigItem } from '@/types/database';

export default function AdminConfig() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [editedConfigs, setEditedConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_config' as any)
        .select('*')
        .order('key');

      if (!error && data) {
        setConfigs(data as any as ConfigItem[]);
        const edited: Record<string, string> = {};
        (data as any).forEach((item: any) => {
          edited[item.key] = item.value || '';
        });
        setEditedConfigs(edited);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedConfigs(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      for (const config of configs) {
        const newValue = editedConfigs[config.key];
        if (newValue !== config.value) {
          const { error } = await supabase
            .from('system_config' as any)
            .update({ value: newValue } as any)
            .eq('key', config.key);

          if (error) {
            alert(`Erro ao salvar ${config.key}: ${error.message}`);
            return;
          }
        }
      }

      alert('Configurações salvas com sucesso!');
      fetchConfigs();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const edited: Record<string, string> = {};
    configs.forEach((item) => {
      edited[item.key] = item.value || '';
    });
    setEditedConfigs(edited);
  };

  if (loading) {
    return <p className="text-slate-400">Carregando configurações...</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="space-y-6">
            {configs.map((config) => (
              <div key={config.key} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <label className="block text-white font-medium text-sm">{config.key}</label>
                    {config.description && (
                      <p className="text-slate-400 text-xs mt-1">{config.description}</p>
                    )}
                  </div>
                  <span className="text-slate-500 text-xs bg-slate-700 px-2 py-1 rounded">
                    {config.type}
                  </span>
                </div>

                {config.type === 'boolean' ? (
                  <select
                    value={editedConfigs[config.key]}
                    onChange={(e) => handleChange(config.key, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  >
                    <option value="true">Verdadeiro</option>
                    <option value="false">Falso</option>
                  </select>
                ) : (
                  <input
                    type={config.type === 'number' ? 'number' : 'text'}
                    value={editedConfigs[config.key]}
                    onChange={(e) => handleChange(config.key, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-700">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button
              onClick={handleReset}
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
