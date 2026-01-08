import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sparkles, 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  Settings, 
  LogOut,
  Shield,
  FolderOpen,
  Plus
} from 'lucide-react';
import { AssistantsPanelCard } from '@/components/dashboard/AssistantsPanelCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isAssistant, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    // Redirect assistants to their portal
    if (!loading && user && isAssistant && !isAdmin) {
      navigate('/assistente');
    }
  }, [user, loading, isAssistant, isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const quickActions = [
    {
      title: "Clientes",
      description: "Gerencie suas clientes",
      icon: Users,
      href: "/clientes",
      color: "bg-blue-500"
    },
    {
      title: "Projetos",
      description: "Eventos e trabalhos",
      icon: FolderOpen,
      href: "/projetos",
      color: "bg-purple-500"
    },
    {
      title: "Agenda",
      description: "Calendário e eventos",
      icon: Calendar,
      href: "/agenda",
      color: "bg-green-500"
    },
    {
      title: "Configurações",
      description: "Perfil e serviços",
      icon: Settings,
      href: "/configuracoes",
      color: "bg-gray-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-poppins font-bold text-xl text-foreground">
                Beauty Pro
              </span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link to="/configuracoes">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-poppins font-bold text-3xl text-foreground mb-2">
            Olá, {user.user_metadata?.full_name || 'Maquiadora'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Bem-vinda ao seu painel. Aqui você gerencia todo o seu negócio.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.href}>
              <Card className="hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-2`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <h2 className="font-poppins font-semibold text-xl text-foreground mb-4">
          Resumo
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clientes</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Users className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Projetos</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <FolderOpen className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento</p>
                  <p className="text-2xl font-bold">R$ 0</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contratos</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <FileText className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assistants Panel */}
        <div className="mb-8">
          <AssistantsPanelCard />
        </div>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-xl mb-2">Comece agora!</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Adicione sua primeira cliente e crie um projeto para começar a usar todas as funcionalidades.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/clientes">
                <Button className="gap-2">
                  <Users className="h-4 w-4" />
                  Adicionar Cliente
                </Button>
              </Link>
              <Link to="/configuracoes">
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configurar Perfil
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
