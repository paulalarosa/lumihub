import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, LogIn } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: any;
}

export default function AdminUsers() {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch users from auth.users via a secure query
      const { data, error } = await supabase
        .from('auth.users')
        .select('id, email, created_at, user_metadata')
        .limit(50);

      if (!error && data) {
        setUsers(data as User[]);
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
    return <p className="text-slate-400">Carregando usuários...</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium text-sm">Email</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium text-sm">Data de Criação</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                    <td className="py-4 px-4 text-white text-sm">{u.email}</td>
                    <td className="py-4 px-4 text-slate-400 text-sm">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(u.id);
                          alert('ID copiado!');
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleImpersonate(u.id)}
                        disabled={impersonating === u.id}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <LogIn className="h-4 w-4 mr-1" />
                        {impersonating === u.id ? 'Processando...' : 'Acessar Conta'}
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
