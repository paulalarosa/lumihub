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
  Palette,
  ClipboardList,
  MessageSquare,
  Camera
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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

  const features = [
    {
      title: "Clientes (CRM)",
      description: "Gerencie suas clientes e histórico",
      icon: Users,
      status: "em breve",
      color: "bg-blue-500"
    },
    {
      title: "Agenda",
      description: "Calendário de eventos e compromissos",
      icon: Calendar,
      status: "em breve",
      color: "bg-green-500"
    },
    {
      title: "Financeiro",
      description: "Faturas e pagamentos",
      icon: DollarSign,
      status: "em breve",
      color: "bg-yellow-500"
    },
    {
      title: "Contratos",
      description: "Templates e assinaturas digitais",
      icon: FileText,
      status: "em breve",
      color: "bg-purple-500"
    },
    {
      title: "Moodboard",
      description: "Galeria de referências com clientes",
      icon: Palette,
      status: "em breve",
      color: "bg-pink-500"
    },
    {
      title: "Briefing",
      description: "Questionários de anamnese",
      icon: ClipboardList,
      status: "em breve",
      color: "bg-indigo-500"
    },
    {
      title: "Mensagens",
      description: "Comunicação com clientes",
      icon: MessageSquare,
      status: "em breve",
      color: "bg-teal-500"
    },
    {
      title: "Portfólio",
      description: "Galeria de trabalhos",
      icon: Camera,
      status: "em breve",
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-poppins font-bold text-xl text-foreground">
                Beauty Pro
              </span>
            </div>
            
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                  <p className="text-sm text-muted-foreground">Eventos este mês</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Calendar className="h-8 w-8 text-primary/50" />
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

        {/* Features Grid */}
        <h2 className="font-poppins font-semibold text-xl text-foreground mb-4">
          Funcionalidades
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-md transition-shadow cursor-pointer opacity-60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                    {feature.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base mb-1">{feature.title}</CardTitle>
                <CardDescription className="text-sm">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
