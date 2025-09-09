import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  CheckCircle, 
  X, 
  ArrowRight, 
  Star,
  Zap,
  Crown,
  Building
} from "lucide-react";

const Planos = () => {
  const plans = [
    {
      name: "Essencial",
      price: "39,90",
      period: "mês",
      description: "Perfeito para começar a profissionalizar seu negócio",
      badge: null,
      icon: Zap,
      features: [
        { name: "Até 5 clientes ativas", included: true },
        { name: "CRM básico", included: true },
        { name: "Gestão de projetos", included: true },
        { name: "Moodboard interativo", included: true },
        { name: "Questionários personalizados", included: true },
        { name: "Contratos básicos", included: true },
        { name: "Portal da cliente", included: true },
        { name: "Marca branca 100%", included: false },
        { name: "Pagamentos integrados", included: false },
        { name: "Relatórios avançados", included: false },
        { name: "Usuários da equipe", included: false },
        { name: "Automações", included: false }
      ],
      limitations: "Marca d'água da Lovable no portal da cliente",
      cta: "Começar Teste Gratuito",
      ctaVariant: "outline" as const
    },
    {
      name: "Profissional",
      price: "89,90",
      period: "mês",
      description: "Para maquiadoras que querem crescer e escalar",
      badge: "Mais Popular",
      icon: Star,
      features: [
        { name: "Clientes ilimitadas", included: true },
        { name: "CRM completo", included: true },
        { name: "Gestão de projetos avançada", included: true },
        { name: "Moodboard interativo", included: true },
        { name: "Questionários inteligentes", included: true },
        { name: "Contratos profissionais", included: true },
        { name: "Portal 100% marca branca", included: true },
        { name: "Pagamentos integrados", included: true },
        { name: "Relatórios financeiros", included: true },
        { name: "Construtor de pacotes", included: true },
        { name: "1 usuário adicional", included: false },
        { name: "Automações avançadas", included: false }
      ],
      limitations: "Taxa de 2,5% sobre pagamentos processados",
      cta: "Começar Agora",
      ctaVariant: "accent" as const
    },
    {
      name: "Estúdio",
      price: "149,90",
      period: "mês",
      description: "Para estúdios e equipes que precisam de máxima eficiência",
      badge: "Melhor Valor",
      icon: Crown,
      features: [
        { name: "Clientes ilimitadas", included: true },
        { name: "CRM completo + IA", included: true },
        { name: "Gestão de projetos avançada", included: true },
        { name: "Moodboard colaborativo", included: true },
        { name: "Questionários inteligentes", included: true },
        { name: "Contratos profissionais", included: true },
        { name: "Portal 100% marca branca", included: true },
        { name: "Pagamentos integrados", included: true },
        { name: "Relatórios avançados + BI", included: true },
        { name: "Construtor de pacotes", included: true },
        { name: "Até 3 usuários da equipe", included: true },
        { name: "Automações completas", included: true }
      ],
      limitations: "Taxa reduzida de 1,0% sobre pagamentos",
      cta: "Começar Agora",
      ctaVariant: "hero" as const
    }
  ];

  const faqs = [
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim! Não há fidelidade. Você pode cancelar sua assinatura a qualquer momento através do painel de configurações."
    },
    {
      question: "Como funciona o teste gratuito?",
      answer: "Você tem 14 dias para testar todas as funcionalidades do plano Profissional gratuitamente, sem precisar informar cartão de crédito."
    },
    {
      question: "Vocês oferecem suporte?",
      answer: "Sim! Oferecemos suporte via chat, email e videochamada para todos os planos. O plano Estúdio tem prioridade no atendimento."
    },
    {
      question: "Como funcionam as taxas de pagamento?",
      answer: "As taxas são aplicadas apenas sobre os pagamentos processados pela plataforma. Você recebe o valor líquido diretamente na sua conta."
    },
    {
      question: "Posso migrar entre planos?",
      answer: "Claro! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças são aplicadas no próximo ciclo de cobrança."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <h1 className="font-poppins font-bold text-4xl lg:text-6xl text-foreground">
                Planos que crescem com seu
                <span className="text-primary"> Negócio</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Escolha o plano ideal para o seu momento profissional. 
                Comece grátis e evolua conforme seu negócio cresce.
              </p>
            </div>
            
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-success/10 text-success font-medium text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              14 dias grátis • Sem cartão de crédito • Cancele quando quiser
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative border-border hover:shadow-medium transition-all duration-300 ${
                  plan.badge === "Mais Popular" ? "border-accent shadow-medium scale-105" : ""
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant={plan.badge === "Mais Popular" ? "default" : "secondary"} className="bg-accent text-accent-foreground px-4 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <plan.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-poppins text-2xl text-foreground">
                    {plan.name}
                  </CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        {feature.included ? (
                          <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground"}`}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground">
                        * {plan.limitations}
                      </p>
                    </div>
                  )}

                  <Link to="/cadastro" className="block">
                    <Button variant={plan.ctaVariant} className="w-full" size="lg">
                      {plan.cta}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-poppins font-bold text-3xl lg:text-4xl text-foreground">
              Todos os planos incluem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              "Acesso via web e mobile",
              "Backup automático na nuvem",
              "Segurança LGPD completa",
              "Suporte técnico especializado",
              "Atualizações constantes",
              "Integração com redes sociais",
              "Templates profissionais",
              "Treinamento incluso"
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="font-poppins font-bold text-3xl lg:text-4xl text-foreground">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="border-border">
                  <CardContent className="p-6">
                    <h3 className="font-poppins font-semibold text-lg text-foreground mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                Teste gratuitamente por 14 dias. Sem compromisso, sem cartão de crédito.
              </p>
            </div>

            <Link to="/cadastro">
              <Button variant="accent" size="lg">
                <Building className="h-5 w-5 mr-2" />
                Começar Teste Gratuito
              </Button>
            </Link>

            <div className="text-sm text-primary-foreground/80">
              ✨ Mais de 1.000 maquiadoras já transformaram seus negócios
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Planos;