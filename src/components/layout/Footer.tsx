import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <span className="text-xl font-serif font-bold text-white">L</span>
              </div>
              <span className="font-serif font-semibold text-2xl">
                Lumi
              </span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              A plataforma premium para profissionais de beleza que desejam 
              elevar sua gestão e oferecer experiências extraordinárias.
            </p>
          </div>

          {/* Produto */}
          <div className="space-y-4">
            <h3 className="font-serif font-semibold text-lg">Produto</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/recursos" 
                  className="text-background/70 hover:text-primary transition-colors text-sm"
                >
                  Recursos
                </Link>
              </li>
              <li>
                <Link 
                  to="/planos" 
                  className="text-background/70 hover:text-primary transition-colors text-sm"
                >
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link 
                  to="/demo" 
                  className="text-background/70 hover:text-primary transition-colors text-sm"
                >
                  Ver Demonstração
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div className="space-y-4">
            <h3 className="font-serif font-semibold text-lg">Empresa</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/blog" 
                  className="text-background/70 hover:text-primary transition-colors text-sm"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-background/70 hover:text-primary transition-colors text-sm"
                >
                  Contato
                </Link>
              </li>
              <li>
                <Link 
                  to="/suporte" 
                  className="text-background/70 hover:text-primary transition-colors text-sm"
                >
                  Suporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-serif font-semibold text-lg">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-background/70 text-sm">
                  contato@lumi.com.br
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-background/70 text-sm">
                  (11) 99999-9999
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-background/70 text-sm">
                  São Paulo, Brasil
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-background/50 text-sm">
            © 2024 Lumi. Todos os direitos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link 
              to="/termos" 
              className="text-background/50 hover:text-primary transition-colors text-sm"
            >
              Termos de Uso
            </Link>
            <Link 
              to="/privacidade" 
              className="text-background/50 hover:text-primary transition-colors text-sm"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;