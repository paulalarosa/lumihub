import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import heroImage from "@/assets/hero-beauty.jpg";
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Palette, 
  FileText, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  Zap,
  Sparkles
} from "lucide-react";

const Home = () => {
  const features = [
    {
      icon: Users,
      title: "CRM Completo",
      description: "Gerencie clientes, histórico e anotações em um só lugar"
    },
    {
      icon: Calendar,
      title: "Gestão de Projetos",
      description: "Organize cada evento com checklists e cronogramas"
    },
    {
      icon: Palette,
      title: "Moodboard Interativo",
      description: "Colabore com clientes em referências visuais"
    },
    {
      icon: FileText,
      title: "Contratos Automáticos",
      description: "Gere contratos profissionais em minutos"
    },
    {
      icon: CreditCard,
      title: "Pagamentos Integrados",
      description: "Receba via Pix e cartão com split automático"
    },
    {
      icon: BarChart3,
      title: "Relatórios Financeiros",
      description: "Acompanhe sua receita e crescimento"
    }
  ];

  const benefits = [
    "Economize 10+ horas por semana em tarefas administrativas",
    "Aumente sua receita com processos profissionais",
    "Ofereça experiência premium para suas clientes",
    "Organize completamente seu negócio"
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Maquiadora Especialista em Noivas",
      content: "Consegui profissionalizar completamente meu negócio. Minhas clientes adoram o portal exclusivo!",
      rating: 5
    },
    {
      name: "Ana Costa",
      role: "Maquiadora & Beauty Artist",
      content: "O sistema de pagamentos mudou tudo! Agora recebo na hora e sem complicação.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Clareza na Confusão
                </div>
                <h1 className="font-poppins font-bold text-4xl lg:text-6xl text-foreground leading-tight text-balance">
                  O Sistema Operacional para 
                  <span className="text-primary"> Maquiadoras Profissionais</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Transforme a gestão caótica do seu negócio em um processo simples, elegante e automatizado. 
                  Ofereça uma experiência premium para suas clientes enquanto aumenta sua receita.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/cadastro">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    Começar Grátis
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Ver Demonstração
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Teste gratuito por 14 dias
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-success mr-2" />
                  Dados 100% seguros
                </div>
              </div>
            </div>

            <div className="relative animate-slide-up">
              <div className="relative">
                <img 
                  src={heroImage} 
                  alt="Ferramentas profissionais de maquiagem organizadas elegantemente" 
                  className="rounded-2xl shadow-strong w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-poppins font-bold text-3xl lg:text-4xl text-foreground">
              Tudo que você precisa em uma plataforma
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Integre todas as ferramentas essenciais para gerir seu negócio de maquiagem 
              de forma profissional e eficiente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-medium transition-all duration-300 group">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-poppins font-semibold text-xl text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="font-poppins font-bold text-3xl lg:text-4xl text-foreground">
                  Por que escolher a Lovable Beauty Pro?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Mais de 1.000 maquiadoras já transformaram seus negócios com nossa plataforma.
                </p>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-foreground font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              <Link to="/recursos">
                <Button variant="accent" size="lg">
                  Conhecer Todos os Recursos
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">10+</div>
                <div className="text-sm text-muted-foreground">Horas economizadas por semana</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-accent mb-2">40%</div>
                <div className="text-sm text-muted-foreground">Aumento médio na receita</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-success mb-2">98%</div>
                <div className="text-sm text-muted-foreground">Satisfação das clientes</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Suporte disponível</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-poppins font-bold text-3xl lg:text-4xl text-foreground">
              O que dizem nossas clientes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Maquiadoras profissionais que transformaram seus negócios conosco.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 border-border">
                <div className="space-y-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-foreground italic">
                    "{testimonial.content}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
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
                Pronta para transformar seu negócio?
              </h2>
              <p className="text-xl text-primary-foreground/90">
                Junte-se a mais de 1.000 maquiadoras que já profissionalizaram seus negócios. 
                Comece seu teste gratuito hoje mesmo.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastro">
                <Button variant="accent" size="lg" className="w-full sm:w-auto">
                  <Zap className="h-5 w-5 mr-2" />
                  Começar Teste Gratuito
                </Button>
              </Link>
              <Link to="/planos">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Ver Planos e Preços
                </Button>
              </Link>
            </div>

            <div className="text-sm text-primary-foreground/80">
              ✨ Sem compromisso • Cancele quando quiser • Suporte dedicado
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;