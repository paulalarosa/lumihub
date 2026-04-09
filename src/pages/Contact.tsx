import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  Mail,
  MessageCircle,
  ArrowRight,
  Send,
  ArrowUpRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import SEOHead from '@/components/seo/SEOHead'
import { useLanguage } from '@/hooks/useLanguage'

export default function Contact() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: t('contact.form.error_fields'),
        description: t('contact.form.error_fields_desc'),
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    setTimeout(() => {
      toast({
        title: t('contact.form.success'),
        description: t('contact.form.success_desc'),
      })
      const subject = encodeURIComponent(
        `[KONTROL CONTATO] ${formData.subject || 'Nova Mensagem'}`,
      )
      const body = encodeURIComponent(
        `Nome: ${formData.name}\nEmail: ${formData.email}\n\nMensagem:\n${formData.message}`,
      )
      window.location.href = `mailto:khaoskontrol07@gmail.com?subject=${subject}&body=${body}`
      setLoading(false)
      setFormData({ name: '', email: '', subject: '', message: '' })
    }, 1000)
  }

  return (
    <>
      <SEOHead
        title={t('contact.seo_title')}
        description={t('contact.subtitle')}
        url="https://khaoskontrol.com.br/contato"
        businessName="Khaos Kontrol"
        priceRange="$$"
      />
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {}
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <img
            src="/khaos-uploads/734febb0-c2fc-4623-98e2-bbe5a386408f.png"
            alt="Background Texture"
            className="w-full h-full object-cover grayscale brightness-50"
          />
        </div>
        {}
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30vw] h-[30vw] bg-white/[0.015] blur-[150px] rounded-full pointer-events-none" />

        <main className="container mx-auto px-6 lg:px-10 pt-20 pb-24 relative z-10">
          <div className="max-w-6xl mx-auto space-y-24">
            {}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start"
            >
              {}
              <div className="flex flex-col justify-center space-y-6 lg:sticky lg:top-40 text-left">
                <span className="text-xs text-muted-foreground tracking-widest uppercase">
                  {t('header_contact')}
                </span>
                <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white leading-[1.05] tracking-tight">
                  {t('contact.title_1')}
                  <br />
                  <span className="italic font-serif">{t('contact.title_2')}</span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  {t('contact.subtitle')}
                </p>
                <Link
                  to="/planos"
                  className="inline-flex items-center gap-2.5 px-6 py-3 border border-white/10 bg-white/[0.03] rounded-full text-sm text-white transition-all group w-fit hover:bg-white/[0.06] hover:border-white/20"
                >
                  {t('footer.cta_plans')}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {}
              <div className="p-8 md:p-12 rounded-[2.5rem] border border-white/5 bg-white/[0.02] relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] blur-[100px] rounded-full pointer-events-none" />

                <div className="space-y-3 relative z-10 mb-8">
                  <h2 className="font-serif text-3xl md:text-4xl text-white">
                    {t('contact.form.title')}
                  </h2>
                  <p className="text-xs text-muted-foreground tracking-wide">
                    {t('contact.form.response_time')}
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5 relative z-10"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground ml-3">
                      {t('contact.form.name')}
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Seu nome"
                      className="bg-white/[0.03] border-white/5 text-white placeholder:text-white/20 focus:border-white/20 h-12 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground ml-3">
                        {t('contact.form.email')}
                      </label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@exemplo.com"
                        className="bg-white/[0.03] border-white/5 text-white placeholder:text-white/20 focus:border-white/20 h-12 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground ml-3">
                        {t('contact.form.subject')}
                      </label>
                      <Input
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Assunto da mensagem"
                        className="bg-white/[0.03] border-white/5 text-white placeholder:text-white/20 focus:border-white/20 h-12 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground ml-3">
                      {t('contact.form.message')}
                    </label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t('contact.form.placeholder_message')}
                      className="min-h-[140px] bg-white/[0.03] border-white/5 text-white placeholder:text-white/20 focus:border-white/20 resize-none text-sm"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-full text-sm font-medium"
                    >
                      {loading ? (
                        <span>{t('contact.form.sending')}</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {t('contact.form.submit')} <Send className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.section>

            {}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.a
                  whileHover={{ y: -4 }}
                  href="https://wa.me/5521983604870"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="p-8 md:p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 flex items-center gap-6 text-left">
                    <div className="w-12 h-12 flex items-center text-white/40 group-hover:text-white transition-colors duration-500">
                      <MessageCircle className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">
                        WhatsApp
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('contact.form.support_whatsapp')}
                      </p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                  </div>
                </motion.a>

                <motion.a
                  whileHover={{ y: -4 }}
                  href="mailto:khaoskontrol07@gmail.com"
                  className="block group"
                >
                  <div className="p-8 md:p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 flex items-center gap-6 text-left">
                    <div className="w-12 h-12 flex items-center text-white/40 group-hover:text-white transition-colors duration-500">
                      <Mail className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">{t('contact.form.email')}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('contact.form.support_email')}
                      </p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                  </div>
                </motion.a>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  )
}
