import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, MessageCircle, ArrowRight, Send } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';
import { useLanguage } from '@/hooks/useLanguage';

export default function Contato() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.name || !formData.email || !formData.message) {
            toast({
                title: "CAMPOS OBRIGATÓRIOS",
                description: "POR FAVOR PREENCHA TODOS OS CAMPOS.",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        setTimeout(() => {
            toast({
                title: "MENSAGEM PREPARADA",
                description: "ABRINDO CLIENTE DE EMAIL..."
            });

            const subject = encodeURIComponent(`[KONTROL CONTATO] ${formData.subject || 'NOVA MENSAGEM'}`);
            const body = encodeURIComponent(`NOME: ${formData.name}\nEMAIL: ${formData.email}\n\nMENSAGEM:\n${formData.message}`);

            window.location.href = `mailto:prenata@gmail.com?subject=${subject}&body=${body}`;
            setLoading(false);
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1000);
    };

    return (
        <>
            <SEOHead
                title="CONTATO - KONTROL | SUPORTE"
                description="Entre em contato. Suporte, parcerias e concierge."
                keywords="contato, kontrol, khaos kontrol, suporte, ajuda"
                url="https://khaoskontrol.com.br/contato"
            />
            <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">

                <main className="container mx-auto px-4 py-32">
                    <div className="max-w-6xl mx-auto space-y-24">

                        {/* Section A: Upsell CTA */}
                        <section className="relative border border-white/20 p-12 overflow-hidden">
                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <h1 className="text-4xl md:text-6xl font-serif text-white tracking-tight leading-none">
                                        {t("contact_hero_title")} <br />
                                        <span className="italic font-light opacity-70">{t("contact_hero_subtitle")}</span>
                                    </h1>
                                    <p className="text-sm font-mono uppercase text-white/60 max-w-md leading-relaxed">
                                        {t("contact_hero_desc")}
                                    </p>
                                </div>
                                <div className="flex justify-start lg:justify-end">
                                    <Link to="/planos">
                                        <Button className="h-16 px-8 rounded-none bg-white text-black font-mono text-xs uppercase tracking-widest hover:bg-white/90">
                                            {t("contact_hero_cta")}
                                            <ArrowRight className="ml-4 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start border-t border-white/20 pt-24">
                            {/* Section B: Contact Form */}
                            <section className="space-y-12">
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-serif text-white">{t("contact_title")}</h2>
                                    <p className="font-mono text-xs uppercase text-white/40 tracking-widest">
                                        {t("contact_subtitle")}
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-xs font-mono uppercase tracking-widest text-white/50">{t("contact_name")}</label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder={t("contact_name_placeholder")}
                                            className="bg-black border-white/30 text-white placeholder:text-white/20 focus:border-white h-14 rounded-none font-mono text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-xs font-mono uppercase tracking-widest text-white/50">{t("contact_email")}</label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder={t("contact_email_placeholder")}
                                                className="bg-black border-white/30 text-white placeholder:text-white/20 focus:border-white h-14 rounded-none font-mono text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="subject" className="text-xs font-mono uppercase tracking-widest text-white/50">{t("contact_subject")}</label>
                                            <Input
                                                id="subject"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder={t("contact_subject_placeholder")}
                                                className="bg-black border-white/30 text-white placeholder:text-white/20 focus:border-white h-14 rounded-none font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="message" className="text-xs font-mono uppercase tracking-widest text-white/50">{t("contact_message")}</label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder={t("contact_message_placeholder")}
                                            className="min-h-[150px] bg-black border-white/30 text-white placeholder:text-white/20 focus:border-white resize-none rounded-none font-mono text-sm"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">{t("contact_submitting")}</span>
                                        ) : (
                                            <span className="flex items-center gap-2">{t("contact_submit")} <Send className="w-4 h-4" /></span>
                                        )}
                                    </Button>
                                </form>
                            </section>

                            {/* Section C: Contact Info */}
                            <section className="space-y-12 lg:pl-12 lg:border-l border-white/20 h-full">
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-serif text-white">{t("contact_channels_title")}</h3>
                                    <p className="font-mono text-xs uppercase text-white/60 leading-relaxed tracking-wide">
                                        {t("contact_channels_desc")}
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* WhatsApp Button */}
                                    <a
                                        href="https://wa.me/5521983604870"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block group"
                                    >
                                        <div className="p-8 border border-white/20 flex items-center gap-6 hover:bg-white text-white hover:text-black transition-all duration-300">
                                            <MessageCircle className="w-6 h-6" />
                                            <div>
                                                <h4 className="font-mono text-sm uppercase tracking-widest">{t("contact_whatsapp")}</h4>
                                                <p className="font-mono text-xs opacity-60 mt-1">{t("contact_whatsapp_desc")}</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 ml-auto" />
                                        </div>
                                    </a>

                                    {/* Email Button */}
                                    <a
                                        href="mailto:prenata@gmail.com"
                                        className="block group"
                                    >
                                        <div className="p-8 border border-white/20 flex items-center gap-6 hover:bg-white text-white hover:text-black transition-all duration-300">
                                            <Mail className="w-6 h-6" />
                                            <div>
                                                <h4 className="font-mono text-sm uppercase tracking-widest">{t("contact_email_btn")}</h4>
                                                <p className="font-mono text-xs opacity-60 mt-1">{t("contact_email_desc")}</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 ml-auto" />
                                        </div>
                                    </a>
                                </div>

                                <div className="pt-12 border-t border-white/10">
                                    <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] text-center">
                                        Khaos Kontrol • Operações Globais
                                    </p>
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
