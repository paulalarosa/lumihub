import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, LogIn } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type UserRoleWithTimestamp = Tables<'user_roles'> & {
  created_at?: string;
};

interface AdminUser extends UserRoleWithTimestamp {
  email?: string;
}

export default function AdminUsers() {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch users from profiles table instead of user_roles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (targetUserId: string) => {
    try {
      setImpersonating(targetUserId);

      // Call Edge Function to generate session
      const { data, error } = await supabase.functions.invoke('admin-ghost-login', {
        body: { target_user_id: targetUserId },
      });

      if (error) {
        alert(`Erro: ${error.message}`);
        setImpersonating(null);
        return;
      }

      // In production, you'd handle the session creation here
      // For now, we'll just notify
      alert(`Impersonação preparada para ${targetUserId}. Redirecionando...`);

      // Redirect to dashboard (in real implementation, would create proper session)
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error impersonating user:', error);
      alert('Erro ao acessar conta do usuário');
      setImpersonating(null);
    }
  };

  if (loading) {
    return <p className="text-gray-400">Carregando usuários...</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#1A1A1A] border-white/10">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Nome / ID</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Função</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Data de Criação</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-4 px-4 text-white text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{u.full_name || 'Sem nome'}</span>
                        <span className="text-xs text-white/40">{u.id.substring(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300 text-sm capitalize">
                      <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-[#00e5ff]/20 text-[#00e5ff]' : 'bg-white/10 text-gray-400'}`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(u.id);
                          alert('ID copiado!');
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleImpersonate(u.id)}
                        disabled={impersonating === u.id}
                        size="sm"
                        className="bg-[#00e5ff] hover:bg-[#00e5ff]/80 text-black font-semibold"
                      >
                        <LogIn className="h-4 w-4 mr-1" />
                        {impersonating === u.id ? '...' : 'Acessar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
