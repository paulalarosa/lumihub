import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Copy, LogIn, Eye } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';

interface AdminUser {
  id: string;
  user_id: string;
  role: 'user' | 'admin' | 'super_admin';
  created_at: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch users
  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers((data || []) as AdminUser[]);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (targetUserId: string) => {
    try {
      setImpersonating(targetUserId);

      // Call Edge Function to generate session
      const { data, error } = await supabase.functions.invoke(
        'admin-ghost-login',
        {
          body: { target_user_id: targetUserId },
        }
      );

      if (error) throw error;

      // Store token and redirect
      localStorage.setItem('admin_ghost_token', data.token);

      toast({
        title: 'Sucesso',
        description: 'Acessando conta do usuário...',
      });

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Erro ao acessar conta:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível acessar a conta do usuário',
        variant: 'destructive',
      });
      setImpersonating(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      super_admin: { variant: 'default', label: 'Super Admin' },
      admin: { variant: 'secondary', label: 'Admin' },
      user: { variant: 'outline', label: 'Usuário' },
    };

    const config = variants[role] || variants.user;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Usuários
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Gerencie os usuários da plataforma e suas permissões
          </p>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <p className="text-slate-500">Carregando usuários...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-500">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableHead>ID do Usuário</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow
                        key={u.id}
                        className="border-slate-200 dark:border-slate-800"
                      >
                        <TableCell className="font-mono text-sm">
                          {u.user_id.substring(0, 12)}...
                        </TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell className="text-sm">
                          {formatDate(u.created_at)}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(u.user_id);
                              toast({
                                title: 'Copiado',
                                description: 'ID do usuário copiado para a área de transferência',
                              });
                            }}
                            title="Copiar ID"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleImpersonate(u.user_id)}
                            disabled={impersonating === u.user_id}
                            title="Acessar conta"
                          >
                            {impersonating === u.user_id ? (
                              <>
                                <Eye className="w-4 h-4 mr-1 animate-spin" />
                                Acessando...
                              </>
                            ) : (
                              <>
                                <LogIn className="w-4 h-4 mr-1" />
                                Acessar
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="text-base">Sobre Gerenciamento de Usuários</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p>
              • Você pode acessar as contas de usuários usando o botão "Acessar"
              para visualizar suas atividades
            </p>
            <p>
              • Funções: Usuário (padrão), Admin (acesso administrativo),
              Super Admin (controle total)
            </p>
            <p>
              • Use o botão de cópia para copiar o ID do usuário para a área de
              transferência
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
