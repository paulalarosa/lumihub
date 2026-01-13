import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#050505] border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/5 border border-white/20 rounded-xl flex items-center justify-center">
                <span className="text-xl font-serif font-bold text-white">L</span>
              </div>
              <span className="font-serif font-light text-2xl text-white">
                Lumi
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed font-light">
              A plataforma premium para profissionais de beleza que desejam 
              elevar sua gestão e oferecer experiências extraordinárias.
            </p>
          </div>

          {/* Produto */}
          <div className="space-y-4">
            <h3 className="font-serif font-light text-lg text-white">Produto</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/recursos" 
                  className="text-white/40 hover:text-[#C0C0C0] transition-colors text-sm font-light"
                >
                  Recursos
                </Link>
              </li>
              <li>
                <Link 
                  to="/planos" 
                  className="text-white/40 hover:text-[#C0C0C0] transition-colors text-sm font-light"
                >
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link 
                  to="/demo" 
                  className="text-white/40 hover:text-[#C0C0C0] transition-colors text-sm font-light"
                >
                  Ver Demonstração
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div className="space-y-4">
            <h3 className="font-serif font-light text-lg text-white">Empresa</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/blog" 
                  className="text-white/40 hover:text-[#C0C0C0] transition-colors text-sm font-light"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-white/40 hover:text-[#C0C0C0] transition-colors text-sm font-light"
                >
                  Contato
                </Link>
              </li>
              <li>
                <Link 
                  to="/suporte" 
                  className="text-white/40 hover:text-[#C0C0C0] transition-colors text-sm font-light"
                >
                  Suporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-serif font-light text-lg text-white">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-[#C0C0C0]" />
                <span className="text-white/40 text-sm font-light">
                  contato@lumi.com.br
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-[#C0C0C0]" />
                <span className="text-white/40 text-sm font-light">
                  (11) 99999-9999
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-[#C0C0C0]" />
                <span className="text-white/40 text-sm font-light">
                  São Paulo, Brasil
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/30 text-sm font-light">
            © 2024 Lumi. Todos os direitos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link 
              to="/termos" 
              className="text-white/30 hover:text-[#C0C0C0] transition-colors text-sm font-light"
            >
              Termos de Uso
            </Link>
            <Link 
              to="/privacidade" 
              className="text-white/30 hover:text-[#C0C0C0] transition-colors text-sm font-light"
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
