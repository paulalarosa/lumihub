import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/hooks/useLanguage'

const navLinks = [
  { label: 'Recursos', path: '/recursos' },
  { label: 'Planos', path: '/planos' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contato', path: '/contato' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'py-4 bg-black/95 backdrop-blur-3xl border-b border-white/5'
          : 'py-6 bg-transparent',
      )}
    >
      <div className="container mx-auto px-6 lg:px-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/favicon-khaoskontrol.webp"
            alt="KHAOS KONTROL"
            className="w-7 h-7 rounded-md group-hover:scale-110 transition-transform object-contain"
          />
          <span className="text-sm font-medium text-foreground tracking-wide uppercase">
            KHAOS KONTROL
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
                    'text-sm transition-colors relative font-medium uppercase tracking-wider',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 right-0 h-[1px] bg-foreground"
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                      }}
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
                    : 'bg-transparent text-foreground hover:bg-foreground/10',
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
                    : 'bg-transparent text-foreground hover:bg-foreground/10',
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
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-background/98 backdrop-blur-2xl border-b border-border/30"
          >
            <nav className="container mx-auto px-6 py-8 flex flex-col gap-1">
              <Link
                to="/"
                className={cn(
                  'px-4 py-3.5 rounded-xl text-sm transition-all uppercase tracking-wider',
                  location.pathname === '/'
                    ? 'bg-foreground/10 text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Home
              </Link>
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
                    {link.label}
                  </Link>
                )
              })}
              <Link
                to="/login"
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
