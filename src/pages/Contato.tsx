import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, MessageCircle, ArrowRight, Sparkles, Send } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';

export default function Contato() {
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
                title: "Campos obrigatórios",
                description: "Por favor, preencha todos os campos obrigatórios.",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        // Simulate success and open mailto
        setTimeout(() => {
            toast({
                title: "Mensagem preparada!",
                description: "Abrindo seu cliente de email para enviar..."
            });

            const subject = encodeURIComponent(`[Contato Site] ${formData.subject || 'Nova Mensagem'}`);
            const body = encodeURIComponent(`Nome: ${formData.name}\nEmail: ${formData.email}\n\nMensagem:\n${formData.message}`);

            window.location.href = `mailto:prenata@gmail.com?subject=${subject}&body=${body}`;
            setLoading(false);

            // Clear form
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1000);
    };

    const contactJsonLd = {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "name": "Contato Lumi",
        "description": "Entre em contato com a equipe Lumi para dúvidas, suporte ou parcerias",
        "url": "https://lumihub.lovable.app/contato",
        "mainEntity": {
            "@type": "Organization",
            "name": "Lumi",
            "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": ["Portuguese", "English"]
            }
        }
    };

    return (
        <>
            <SEOHead
                title="Contato - Lumi | Fale Conosco"
                description="Entre em contato com a equipe Lumi. Tire suas dúvidas sobre a plataforma de gestão para profissionais de beleza."
                keywords="contato lumi, suporte maquiadores, falar com lumi, dúvidas plataforma beleza"
                url="https://lumihub.lovable.app/contato"
                jsonLd={contactJsonLd}
            />
            <div className="min-h-screen bg-[#050505] text-[#C0C0C0] font-sans selection:bg-[#00e5ff]/30 selection:text-[#00e5ff]">


            <main className="container mx-auto px-4 py-20 lg:py-32">
                <div className="max-w-6xl mx-auto space-y-24">

                    {/* Section A: Upsell CTA */}
                    <section className="relative">
                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[150%] bg-[#00e5ff]/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

                        <div className="lumi-card p-12 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
                                <Sparkles className="w-64 h-64 text-white" />
                            </div>

                            <div className="relative z-10 text-center space-y-8">
                                <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">
                                    Pronto para elevar o nível <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#C0C0C0]">do seu negócio?</span>
                                </h1>
                                <p className="text-xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
                                    Descubra como a tecnologia pode transformar sua gestão e encantar suas clientes.
                                    O futuro dos studios de beleza já chegou.
                                </p>
                                <div className="flex justify-center">
                                    <Link to="/planos">
                                        <Button className="h-14 px-8 rounded-full bg-[#00e5ff] text-black font-semibold text-lg hover:bg-[#00e5ff]/90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                                            Ver Planos
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        {/* Section B: Contact Form */}
                        <section className="space-y-8">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-serif font-semibold text-white">Envie uma mensagem</h2>
                                <p className="text-white/40 font-light">Estamos aqui para ajudar você a crescer.</p>
                            </div>

                            <div className="lumi-card p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium text-white/70">Nome *</label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Seu nome completo"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#00e5ff]/50 h-12"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-sm font-medium text-white/70">Email *</label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="seu@email.com"
                                                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#00e5ff]/50 h-12"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="subject" className="text-sm font-medium text-white/70">Assunto</label>
                                            <Input
                                                id="subject"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder="Sobre o que quer falar?"
                                                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#00e5ff]/50 h-12"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="message" className="text-sm font-medium text-white/70">Mensagem *</label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Como podemos ajudar?"
                                            className="min-h-[150px] bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#00e5ff]/50 resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-12 bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">Enviando...</span>
                                        ) : (
                                            <span className="flex items-center gap-2">Enviar E-mail <Send className="w-4 h-4" /></span>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </section>

                        {/* Section C: Masked Contact Info */}
                        <section className="space-y-10 lg:pl-10 lg:pt-20">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-serif font-medium text-white">Canais de Atendimento</h3>
                                <p className="text-white/60 font-light leading-relaxed">
                                    Prefere uma conversa mais direta? Nossa equipe de concierge está disponível para tirar todas as suas dúvidas sobre a plataforma e os planos.
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
                                    <div className="lumi-card p-6 flex items-center gap-6 group-hover:border-[#00e5ff]/50 group-hover:bg-[#00e5ff]/5 transition-all duration-300">
                                        <div className="w-14 h-14 rounded-full bg-[#00e5ff]/10 flex items-center justify-center border border-[#00e5ff]/20 group-hover:scale-110 transition-transform">
                                            <MessageCircle className="w-6 h-6 text-[#00e5ff]" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-medium text-white group-hover:text-[#00e5ff] transition-colors">Conversar no WhatsApp</h4>
                                            <p className="text-sm text-white/40 group-hover:text-white/60">Fale com nosso concierge em tempo real</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-white/20 ml-auto group-hover:text-[#00e5ff] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </a>

                                {/* Email Button */}
                                <a
                                    href="mailto:prenata@gmail.com"
                                    className="block group"
                                >
                                    <div className="lumi-card p-6 flex items-center gap-6 group-hover:border-white/30 group-hover:bg-white/5 transition-all duration-300">
                                        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                            <Mail className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-medium text-white">Enviar E-mail</h4>
                                            <p className="text-sm text-white/40 group-hover:text-white/60">Resposta em até 24 horas úteis</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-white/20 ml-auto group-hover:text-white transition-all" />
                                    </div>
                                </a>
                            </div>

                            {/* No physical address displayed as per request */}
                            <div className="pt-8 border-t border-white/10">
                                <p className="text-xs text-white/20 text-center font-light uppercase tracking-widest">
                                    Lumi Beauty Tech • Global Operations
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
