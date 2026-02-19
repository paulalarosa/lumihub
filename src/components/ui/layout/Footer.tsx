import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-[#050505] border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/5 border border-white/20 rounded-xl flex items-center justify-center overflow-hidden relative">
                <img
                  src="/favicon-khaoskontrol.webp"
                  alt="K"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-serif font-light text-2xl text-white">
                KHAOS KONTROL
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed font-light">
              A plataforma premium para profissionais de beleza que desejam
              elevar sua gestão e oferecer experiências extraordinárias.
            </p>
          </div>

          {/* Produto */}
          <div className="space-y-4">
            <h3 className="font-serif font-light text-lg text-white">
              Produto
            </h3>
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
            </ul>
          </div>

          {/* Empresa */}
          <div className="space-y-4">
            <h3 className="font-serif font-light text-lg text-white">
              Empresa
            </h3>
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
                  to="/contato"
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
            <h3 className="font-serif font-light text-lg text-white">
              Fale Conosco
            </h3>
            <div className="space-y-3">
              <a
                href="mailto:khaoskontrol07@gmail.com"
                className="flex items-center space-x-3 group"
              >
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#00e5ff]/10 group-hover:border-[#00e5ff]/30 transition-all">
                  <Mail className="h-4 w-4 text-[#C0C0C0] group-hover:text-[#00e5ff]" />
                </div>
                <span className="text-white/40 text-sm font-light group-hover:text-white transition-colors">
                  Enviar E-mail
                </span>
              </a>

              <a
                href="https://wa.me/5521983604870"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 group"
              >
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#00e5ff]/10 group-hover:border-[#00e5ff]/30 transition-all">
                  <MessageCircle className="h-4 w-4 text-[#C0C0C0] group-hover:text-[#00e5ff]" />
                </div>
                <span className="text-white/40 text-sm font-light group-hover:text-white transition-colors">
                  WhatsApp
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/30 text-sm font-light">
            © 2026 KHAOS KONTROL. Todos os direitos reservados.
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
  )
}

export default Footer
