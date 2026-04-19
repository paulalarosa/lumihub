import { useLanguage } from '@/hooks/useLanguage'
import { Link } from 'react-router-dom'
import {
  Instagram,
  MessageCircle,
  Mail,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'

export default function Footer() {
  const { t } = useLanguage()

  const footerLinks = [
    {
      title: 'Explorar',
      links: [
        { label: t('header_features'), href: '/recursos' },
        { label: t('header_plans'), href: '/planos' },
        { label: t('header_blog'), href: '/blog' },
        { label: 'Ajuda', href: '/ajuda' },
        { label: t('header_contact'), href: '/contato' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: t('lgpd.consent_terms'), href: '/termos' },
        { label: t('lgpd.consent_privacy'), href: '/privacidade' },
        { label: t('lgpd.consent_refund'), href: '/reembolso' },
        { label: t('lgpd.consent_security'), href: '/seguranca' },
        { label: t('lgpd.consent_cookies'), href: '/cookies' },
        { label: t('lgpd.consent_dpa'), href: '/dpa' },
      ],
    },
    {
      title: 'Conectar',
      links: [
        {
          label: 'WhatsApp',
          href: 'https://wa.me/5521983604870',
          external: true,
        },
        {
          label: 'Acesso Kontrol',
          href: '/login',
          isButton: true,
        },
      ],
    },
  ]

  const socials = [
    { icon: Instagram, href: 'https://instagram.com/khaoskontrol_', label: 'Instagram' },
    {
      icon: MessageCircle,
      href: 'https://wa.me/5521983604870',
      label: 'WhatsApp',
    },
    { icon: Mail, href: 'mailto:khaoskontrol07@gmail.com', label: 'E-mail' },
  ]

  return (
    <footer className="relative border-t border-border/30 bg-background text-foreground">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-[200px] bg-foreground/[0.015] blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-10 relative z-10">
        {}
        <div className="py-24 flex flex-col md:flex-row items-start md:items-center justify-between gap-10 border-b border-border/20">
          <div className="space-y-4 max-w-lg text-left">
            <h3 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight leading-[1.1] text-left">
              {t('footer.start_title')}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-left">
              {t('footer.start_subtitle')}
            </p>
          </div>
          <Link
            to="/planos"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-foreground text-background rounded-full text-sm font-medium hover:bg-foreground/90 transition-all group uppercase tracking-wide"
          >
            <Sparkles className="w-4 h-4" />
            {t('footer.cta_plans')}
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {}
        <div className="py-16 flex flex-col md:grid md:grid-cols-5 gap-10 text-left">
          {}
          <div className="md:col-span-2 flex flex-col gap-6 text-left">
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
              {t('footer.desc')}
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
              <h4 className="text-[11px] font-bold text-foreground tracking-widest uppercase mb-6">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => {
                  if (link.isButton) {
                    return (
                      <li key={link.label} className="pt-2">
                        <Link
                          to={link.href}
                          className="inline-flex items-center px-4 py-2 bg-foreground text-background rounded-full text-[11px] font-bold hover:bg-foreground/90 transition-all uppercase tracking-widest"
                        >
                          {link.label}
                        </Link>
                      </li>
                    )
                  }

                  return link.external ? (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                      >
                        {link.label}
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {}
        <div className="py-6 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/50">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="text-xs text-muted-foreground/30 uppercase tracking-[0.2em]">
            {t('footer.global_ops')}
          </p>
        </div>
      </div>
    </footer>
  )
}
