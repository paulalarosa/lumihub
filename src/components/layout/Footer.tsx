import { Link } from "react-router-dom";
import { Sparkles, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-poppins font-bold text-xl">
                Lovable Beauty Pro
              </span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              A plataforma completa para maquiadoras profissionais transformarem 
              sua gestão e oferecerem uma experiência premium para suas clientes.
            </p>
          </div>

          {/* Produto */}
          <div className="space-y-4">
            <h3 className="font-poppins font-semibold text-lg">Produto</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/recursos" 
                  className="text-primary-foreground/80 hover:text-accent transition-colors text-sm"
                >
                  Recursos
                </Link>
              </li>
              <li>
                <Link 
                  to="/planos" 
                  className="text-primary-foreground/80 hover:text-accent transition-colors text-sm"
                >
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link 
                  to="/demo" 
                  className="text-primary-foreground/80 hover:text-accent transition-colors text-sm"
                >
                  Ver Demonstração
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div className="space-y-4">
            <h3 className="font-poppins font-semibold text-lg">Empresa</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/blog" 
                  className="text-primary-foreground/80 hover:text-accent transition-colors text-sm"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link 
                  to="/contato" 
                  className="text-primary-foreground/80 hover:text-accent transition-colors text-sm"
                >
                  Contato
                </Link>
              </li>
              <li>
                <Link 
                  to="/suporte" 
                  className="text-primary-foreground/80 hover:text-accent transition-colors text-sm"
                >
                  Suporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-poppins font-semibold text-lg">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-accent" />
                <span className="text-primary-foreground/80 text-sm">
                  contato@lovablebeautypro.com
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-accent" />
                <span className="text-primary-foreground/80 text-sm">
                  (11) 99999-9999
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="text-primary-foreground/80 text-sm">
                  São Paulo, Brasil
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-light/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/60 text-sm">
            © 2024 Lovable Beauty Pro. Todos os direitos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link 
              to="/termos" 
              className="text-primary-foreground/60 hover:text-accent transition-colors text-sm"
            >
              Termos de Uso
            </Link>
            <Link 
              to="/privacidade" 
              className="text-primary-foreground/60 hover:text-accent transition-colors text-sm"
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