import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/hooks/useLanguage'

const navLinks = [
  { name: 'header_features', path: '/recursos' },
  { name: 'header_plans', path: '/planos' },
  { name: 'header_blog', path: '/blog' },
  { name: 'header_contact', path: '/contato' },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { t, setLanguage, language } = useLanguage()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-6',
        isScrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 py-4'
          : 'bg-transparent',
      )}
    >
      <div className="container mx-auto px-6 lg:px-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/favicon-khaoskontrol.webp"
            alt="Khaos Kontrol"
            className="w-8 h-8 object-contain"
          />
          <span className="font-serif text-xl font-bold tracking-tighter text-foreground decoration-foreground/0 group-hover:decoration-foreground/100 underline transition-all underline-offset-4">
            KHAOS_KONTROL
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative py-2',
                    isActive
                      ? 'text-foreground'
                      : 'text-foreground/50 hover:text-foreground',
                  )}
                >
                  {t(link.name)}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-[1px] bg-foreground"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-6 border-l border-border/50 pl-6">
            <div className="flex items-center border border-border rounded-sm overflow-hidden text-xs font-medium tracking-widest uppercase">
              <button
                onClick={() => setLanguage('pt')}
                className={cn(
                  'px-3 py-1.5 transition-colors',
                  language === 'pt'
                    ? 'bg-foreground text-background'
                    : 'bg-transparent text-foreground hover:bg-foreground/5',
                )}
              >
                PT
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={cn(
                  'px-3 py-1.5 transition-colors',
                  language === 'en'
                    ? 'bg-foreground text-background'
                    : 'bg-transparent text-foreground hover:bg-foreground/5',
                )}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-foreground hover:text-muted-foreground transition-colors p-2 rounded-full hover:bg-foreground/5"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <Link
              to="/login"
              className="px-6 py-2.5 bg-white/10 text-white backdrop-blur-md rounded-[2rem] border border-white/20 text-xs font-bold hover:bg-white/20 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.1)] uppercase tracking-[0.2em]"
            >
              Acesso Kontrol
            </Link>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-foreground/5 transition-colors"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-2xl p-6 md:hidden flex flex-col gap-6"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'px-4 py-3.5 rounded-xl text-sm transition-all uppercase tracking-wider',
                      isActive
                        ? 'bg-foreground/10 text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t(link.name)}
                  </Link>
                )
              })}
              <Link
                to="/planos"
                className="mt-4 text-center px-6 py-3.5 bg-foreground text-background rounded-full text-sm font-medium flex items-center justify-center gap-2 uppercase tracking-[0.2em]"
              >
                Acesso Kontrol
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
