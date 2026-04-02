import { Link } from 'react-router-dom'
import {
  Instagram,
  Youtube,
  MessageCircle,
  Mail,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'

const footerLinks = [
  {
    title: 'Plataforma',
    links: [
      { label: 'Recursos', href: '/recursos' },
      { label: 'Planos', href: '/planos' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contato', href: '/contato' },
    ],
  },
  {
    title: 'Ferramentas',
    links: [
      { label: 'Agenda Inteligente', href: '/recursos' },
      { label: 'Gestão de Clientes', href: '/recursos' },
      { label: 'Contratos Digitais', href: '/recursos' },
      { label: 'Dashboard', href: '/recursos' },
    ],
  },
  {
    title: 'Suporte',
    links: [
      { label: 'Central de Ajuda', href: '/contato' },
      {
        label: 'WhatsApp',
        href: 'https://wa.me/5521983604870',
        external: true,
      },
      {
        label: 'E-mail',
        href: 'mailto:khaoskontrol07@gmail.com',
        external: true,
      },
    ],
  },
]

const socials = [
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  {
    icon: MessageCircle,
    href: 'https://wa.me/5521983604870',
    label: 'WhatsApp',
  },
  { icon: Mail, href: 'mailto:khaoskontrol07@gmail.com', label: 'E-mail' },
]

export default function Footer() {
  return (
    <footer className="relative border-t border-border/30 bg-background text-foreground">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-[200px] bg-foreground/[0.015] blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-10 relative z-10">
        {}
        <div className="py-24 flex flex-col md:flex-row items-start md:items-center justify-between gap-10 border-b border-border/20">
          <div className="space-y-4 max-w-lg text-left">
            <h3 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight leading-[1.1] text-left">
              Pronto para <span className="italic">começar</span>?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-left">
              Junte-se a profissionais que já transformaram suas operações com o
              KONTROL.
            </p>
          </div>
          <Link
            to="/planos"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-foreground text-background rounded-full text-sm font-medium hover:bg-foreground/90 transition-all group uppercase tracking-wide"
          >
            <Sparkles className="w-4 h-4" />
            Ver Planos
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {}
        <div className="py-16 grid grid-cols-2 md:grid-cols-5 gap-10 text-left">
          {}
          <div className="col-span-2 flex flex-col gap-6 text-left">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <img
                src="/favicon-khaoskontrol.webp"
                alt="KHAOS KONTROL"
                className="w-6 h-6 rounded group-hover:scale-110 transition-transform object-contain"
              />
              <span className="text-sm font-medium text-foreground tracking-widest uppercase">
                KHAOS KONTROL
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">
              Gestão de alta performance para profissionais que buscam o
              extraordinário.
            </p>
            <div className="flex items-center gap-2.5">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-border/30 bg-foreground/[0.03] flex items-center justify-center hover:bg-foreground hover:border-foreground transition-all group"
                  aria-label={social.label}
                >
                  <social.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-background transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {}
          {footerLinks.map((group) => (
            <div key={group.title} className="space-y-4 text-left">
              <h4 className="text-xs font-medium text-foreground tracking-wide uppercase">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) =>
                  link.external ? (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                      >
                        {link.label}
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        {}
        <div className="py-6 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} Khaos Kontrol · Todos os direitos
            reservados
          </p>
          <p className="text-xs text-muted-foreground/30 uppercase tracking-[0.2em]">
            Operações Globais
          </p>
        </div>
      </div>
    </footer>
  )
}
