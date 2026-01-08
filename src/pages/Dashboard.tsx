import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
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
import { motion } from 'framer-motion';

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
      gradient: "from-blue-500 to-blue-600"
    },
    {
      title: "Projetos",
      description: "Eventos e trabalhos",
      icon: FolderOpen,
      href: "/projetos",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      title: "Agenda",
      description: "Calendário e eventos",
      icon: Calendar,
      href: "/agenda",
      gradient: "from-green-500 to-green-600"
    },
    {
      title: "Configurações",
      description: "Perfil e serviços",
      icon: Settings,
      href: "/configuracoes",
      gradient: "from-gray-500 to-gray-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background page-transition">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-glow transition-all duration-300 group-hover:scale-105">
                <span className="text-xl font-serif font-bold text-white">L</span>
              </div>
              <span className="font-serif font-semibold text-2xl text-foreground">
                Lumi
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="font-serif font-semibold text-4xl text-foreground mb-2">
            Olá, {user.user_metadata?.full_name || 'Maquiadora'}! ✨
          </h1>
          <p className="text-muted-foreground text-lg">
            Bem-vinda ao seu painel. Aqui você gerencia todo o seu negócio.
          </p>
        </motion.div>

        {/* Quick Actions - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={action.href}>
                <Card className="glass-card border-0 glow-hover h-full cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className={`w-14 h-14 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center mb-3`}>
                      <action.icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="font-serif text-xl">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats - Bento Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="font-serif font-semibold text-2xl text-foreground mb-6">
            Resumo
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Clientes</p>
                    <p className="text-3xl font-serif font-semibold text-foreground">0</p>
                  </div>
                  <Users className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Projetos</p>
                    <p className="text-3xl font-serif font-semibold text-foreground">0</p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Faturamento</p>
                    <p className="text-3xl font-serif font-semibold text-foreground">R$ 0</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Contratos</p>
                    <p className="text-3xl font-serif font-semibold text-foreground">0</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Assistants Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-10"
        >
          <AssistantsPanelCard />
        </motion.div>

        {/* Getting Started */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-serif font-semibold text-2xl mb-2">Comece agora!</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Adicione sua primeira cliente e crie um projeto para começar a usar todas as funcionalidades.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/clientes">
                  <Button className="gap-2 glow-hover bg-gradient-to-r from-primary to-accent text-white border-0">
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
        </motion.div>
      </main>
    </div>
  );
}