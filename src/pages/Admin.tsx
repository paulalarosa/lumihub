import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Sparkles, 
  ArrowLeft,
  Users,
  Shield,
  CheckCircle,
  Clock,
  Settings,
  Database,
  CreditCard,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (!loading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta área",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }
  }, [user, isAdmin, loading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoadingUsers(false);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    const usersWithRoles = profiles?.map(profile => ({
      ...profile,
      roles: roles?.filter(r => r.user_id === profile.id).map(r => r.role) || []
    })) || [];

    setUsers(usersWithRoles);
    setLoadingUsers(false);
  };

  const toggleAdminRole = async (userId: string, currentRoles: string[]) => {
    const isCurrentlyAdmin = currentRoles.includes('admin');
    
    if (isCurrentlyAdmin) {
      // Remove admin role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível remover o papel de admin",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });
      
      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível adicionar o papel de admin",
          variant: "destructive"
        });
        return;
      }
    }
    
    toast({
      title: "Sucesso",
      description: isCurrentlyAdmin ? "Admin removido" : "Admin adicionado"
    });
    
    fetchUsers();
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Lista de funcionalidades para implementar
  const todoFeatures = [
    {
      category: "Autenticação & Usuários",
      items: [
        { name: "Sistema de cadastro e login", status: "done" },
        { name: "Perfis de usuário", status: "done" },
        { name: "Sistema de roles (admin/user)", status: "done" },
        { name: "Recuperação de senha", status: "pending" },
        { name: "Login social (Google)", status: "pending" }
      ]
    },
    {
      category: "CRM - Clientes",
      items: [
        { name: "Cadastro de clientes", status: "done" },
        { name: "Histórico de interações", status: "done" },
        { name: "Anotações privadas", status: "done" },
        { name: "Tags e segmentação", status: "done" }
      ]
    },
    {
      category: "Projetos & Eventos",
      items: [
        { name: "Criar projetos por cliente", status: "done" },
        { name: "Checklist de tarefas", status: "done" },
        { name: "Moodboard interativo", status: "done" },
        { name: "Questionário de briefing", status: "done" },
        { name: "Geração de contratos", status: "done" }
      ]
    },
    {
      category: "Financeiro",
      items: [
        { name: "Geração de faturas", status: "done" },
        { name: "Integração Mercado Pago", status: "done" },
        { name: "Split de pagamentos", status: "pending" },
        { name: "Relatórios financeiros", status: "pending" },
        { name: "Cadastro de dados bancários (PIX, conta digital)", status: "done" },
        { name: "Recebimento de pagamentos na plataforma", status: "pending" },
        { name: "Dashboard financeiro do usuário", status: "pending" }
      ]
    },
    {
      category: "Portal da Cliente",
      items: [
        { name: "Link exclusivo por projeto", status: "done" },
        { name: "Visualização de moodboard", status: "done" },
        { name: "Preenchimento de briefing", status: "done" },
        { name: "Visualização de contrato", status: "done" },
        { name: "Pagamento online", status: "done" }
      ]
    },
    {
      category: "Configurações",
      items: [
        { name: "Perfil da maquiadora", status: "done" },
        { name: "Personalização de marca", status: "done" },
        { name: "Cardápio de serviços", status: "done" },
        { name: "Planos e assinatura", status: "pending" }
      ]
    },
    {
      category: "Upload de Imagens",
      items: [
        { name: "Moodboard com upload real", status: "pending" },
        { name: "Foto de perfil/avatar", status: "pending" },
        { name: "Logo personalizado", status: "pending" }
      ]
    }
  ];

  const totalItems = todoFeatures.reduce((acc, cat) => acc + cat.items.length, 0);
  const doneItems = todoFeatures.reduce((acc, cat) => acc + cat.items.filter(i => i.status === 'done').length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="font-poppins font-bold text-xl text-foreground">
                  Painel Admin
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Usuários</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.roles.includes('admin')).length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Funcionalidades</p>
                  <p className="text-2xl font-bold">{doneItems}/{totalItems}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{totalItems - doneItems}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciar Usuários
              </CardTitle>
              <CardDescription>
                Controle os acessos e permissões dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : users.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum usuário cadastrado ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {users.map((userItem) => (
                    <div 
                      key={userItem.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{userItem.full_name || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground">{userItem.email}</p>
                        <div className="flex gap-2 mt-1">
                          {userItem.roles.map(role => (
                            <Badge 
                              key={role} 
                              variant={role === 'admin' ? 'default' : 'secondary'}
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Admin</span>
                        <Switch
                          checked={userItem.roles.includes('admin')}
                          onCheckedChange={() => toggleAdminRole(userItem.id, userItem.roles)}
                          disabled={userItem.id === user?.id}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features TODO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Lista de Funcionalidades
              </CardTitle>
              <CardDescription>
                Acompanhe o progresso do desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <div className="space-y-6">
                {todoFeatures.map((category) => (
                  <div key={category.category}>
                    <h3 className="font-semibold text-sm text-foreground mb-2">
                      {category.category}
                    </h3>
                    <div className="space-y-2">
                      {category.items.map((item) => (
                        <div 
                          key={item.name}
                          className="flex items-center gap-3 text-sm"
                        >
                          {item.status === 'done' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className={item.status === 'done' ? 'text-muted-foreground line-through' : ''}>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
