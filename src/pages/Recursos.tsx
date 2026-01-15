import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar,
  CreditCard,
  Palette,
  FileText,
  BarChart3,
  ArrowRight,
  CheckCircle,
  MessageSquare,
  Image,
  Clock,
  Smartphone,
  Cloud,
  Lock
} from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";

const Recursos = () => {
  const mainFeatures = [
    {
      icon: Users,
      title: "CRM Completo",
      description: "Centralize todas as informações das suas clientes",
      features: [
        "Cadastro completo com histórico",
        "Anotações privadas organizadas",
        "Histórico de interações",
        "Lembretes automáticos",
        "Tags e categorização"
      ]
    },
    {
      icon: Calendar,
      title: "Gestão de Projetos",
      description: "Organize cada evento do início ao fim",
      features: [
        "Checklists personalizáveis",
        "Cronogramas visuais",
        "Marcos do projeto",
        "Tarefas compartilhadas",
        "Notificações automáticas"
      ]
    },
    {
      icon: Palette,
      title: "Moodboard Interativo",
      description: "Colabore visualmente com suas clientes",
      features: [
        "Upload de referências",
        "Comentários em tempo real",
        "Organização por categorias",
        "Histórico de versões",
        "Aprovação de looks"
      ]
    },
    {
      icon: MessageSquare,
      title: "Questionário Inteligente",
      description: "Colete informações importantes automaticamente",
      features: [
        "Anamnese personalizada",
        "Perguntas condicionais",
        "Respostas organizadas",
        "Histórico de questionários",
        "Templates prontos"
      ]
    },
    {
      icon: FileText,
      title: "Contratos Automáticos",
      description: "Gere contratos profissionais em minutos",
      features: [
        "Templates personalizáveis",
        "Assinatura digital",
        "Cláusulas automáticas",
        "Histórico de contratos",
        "Validação jurídica"
      ]
    },
    {
      icon: CreditCard,
      title: "Pagamentos Integrados",
      description: "Receba pagamentos de forma simples e segura",
      features: [
        "Pix e cartão de crédito",
        "Split automático",
        "Faturas personalizadas",
        "Controle de inadimplência",
        "Relatórios financeiros"
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: BarChart3,
      title: "Relatórios Avançados",
      description: "Acompanhe o crescimento do seu negócio com dashboards intuitivos"
    },
    {
      icon: Smartphone,
      title: "Aplicativo Mobile",
      description: "Acesse tudo pelo celular - você e suas clientes"
    },
    {
      icon: Cloud,
      title: "Backup Automático",
      description: "Seus dados sempre seguros na nuvem"
    },
    {
      icon: Lock,
      title: "Segurança LGPD",
      description: "Proteção total dos dados das suas clientes"
    },
    {
      icon: Image,
      title: "Galeria de Trabalhos",
      description: "Showcase profissional dos seus projetos"
    },
    {
      icon: Clock,
      title: "Automações",
      description: "Economize tempo com fluxos automatizados"
    }
  ];

  return (
    <>
      <SEOHead 
        title="Recursos e Funcionalidades - Lumi | Sistema Completo de Gestão"
        description="CRM completo, gestão de projetos, moodboard interativo, contratos digitais, pagamentos integrados e muito mais. Conheça todos os recursos da Lumi."
        keywords="recursos lumi, funcionalidades sistema beleza, crm maquiadora, gestão projetos noivas"
        url="https://lumihub.lovable.app/recursos"
      />
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <h1 className="font-poppins font-bold text-4xl lg:text-6xl text-foreground">
                Recursos Completos para seu
                <span className="text-primary"> Negócio de Maquiagem</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Descubra todas as ferramentas que vão transformar a gestão do seu negócio
                e elevar a experiência das suas clientes a um novo patamar.
              </p>
            </div>

            <Link to="/cadastro">
              <Button variant="hero" size="lg">
                Começar Teste Gratuito
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-poppins font-bold text-3xl lg:text-4xl text-foreground">
              Recursos Principais
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para profissionalizar completamente seu negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mainFeatures.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-medium transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-poppins text-xl text-foreground">
                        {feature.title}
                      </CardTitle>
                      <p className="text-muted-foreground mt-2">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-foreground text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-poppins font-bold text-3xl lg:text-4xl text-foreground">
              E muito mais...
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Recursos adicionais que fazem toda a diferença no dia a dia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <Card key={index} className="p-6 border-border hover:shadow-medium transition-all duration-300 group">
                <div className="space-y-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-poppins font-semibold text-lg text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-light text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <h2 className="font-poppins font-bold text-3xl lg:text-4xl">
                Pronta para começar?
              </h2>
              <p className="text-xl text-primary-foreground/90">
                Teste todos esses recursos gratuitamente por 14 dias.
                Sem compromisso, sem cartão de crédito.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastro">
                <Button variant="accent" size="lg" className="w-full sm:w-auto">
                  Começar Teste Gratuito
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link to="/planos">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Ver Planos e Preços
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
    </>
  );
};

export default Recursos;