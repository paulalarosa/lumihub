import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ModeToggle } from "@/components/ui/mode-toggle";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  // Check if we're on the home page (dark bg)
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: t("header_features"), href: "/recursos" },
    { name: t("header_plans"), href: "/planos" },
    { name: t("header_blog"), href: "/blog" },
    { name: "Contato", href: "/contato" }, // Keeping generic for now or add to dictionary
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || !isHomePage
        ? 'bg-background/90 backdrop-blur-xl border-b border-border'
        : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-foreground/20 to-foreground/5 border border-foreground/20 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:border-metallic/40">
              <span className="text-xl font-serif font-bold text-foreground">K</span>
            </div>
            <span className="font-serif font-light text-2xl text-foreground tracking-tight">
              KONTROL
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.href} // Changed key to href to be unique regardless of lang
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-light text-sm tracking-wide"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Toggle */}
            <LanguageSwitcher />

            <ModeToggle />

            <div className="flex items-center space-x-4 ml-4">
              <Link to="/auth">
                <Button
                  variant="ghost"
                  className="text-foreground hover:text-foreground hover:bg-foreground/5 font-mono text-xs uppercase tracking-widest"
                >
                  {t("header_login")}
                </Button>
              </Link>
              <Link to="/auth">
                <Button
                  className="bg-foreground text-background hover:bg-foreground/90 border-0 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] rounded-none font-mono text-xs uppercase tracking-widest px-6"
                >
                  {t("header_start")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl text-foreground hover:bg-foreground/10 transition-colors"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in bg-background/95 backdrop-blur-xl">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-light py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex justify-center space-x-6 py-4 border-y border-border">
                <span
                  className={`cursor-pointer font-mono text-xs ${language === 'pt' ? 'text-foreground underline' : 'text-muted-foreground'}`}
                  onClick={() => { setLanguage('pt'); setIsMenuOpen(false); }}
                >
                  PORTUGUÊS
                </span>
                <span
                  className={`cursor-pointer font-mono text-xs ${language === 'en' ? 'text-foreground underline' : 'text-muted-foreground'}`}
                  onClick={() => { setLanguage('en'); setIsMenuOpen(false); }}
                >
                  ENGLISH
                </span>
              </div>
              <div className="flex justify-center py-2">
                <ModeToggle />
              </div>
              <div className="flex flex-col space-y-3 pt-4">
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent border-border text-foreground hover:bg-foreground/5 font-mono uppercase tracking-widest text-xs"
                  >
                    {t("header_login")}
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-foreground text-background hover:bg-foreground/90 font-mono uppercase tracking-widest text-xs">
                    {t("header_start")}
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
