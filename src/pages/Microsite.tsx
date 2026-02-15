import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// import { Layout } from '@/components/layout/Layout'; // Assuming standard layout, or usage without layout
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Calendar, Instagram } from 'lucide-react';
import { Helmet } from 'react-helmet'; // Use Helmet if SEO component not robust enough or just inline
import { PublicBookingForm } from '@/components/PublicBookingForm';

import { Microsite as IMicrosite } from '@/types/microsite';

export const Microsite = () => {
    const { slug } = useParams();

    const { data: site, isLoading } = useQuery({
        queryKey: ['microsite', slug],
        queryFn: async () => {
            if (!slug) return null;
            const { data, error } = await supabase
                .from('microsites' as any)
                .select('*')
                .eq('slug', slug)
                .eq('is_published', true)
                .single();

            if (error) throw error;

            const siteData = data as unknown as IMicrosite;

            console.log("Found site:", siteData.id);
            // Increment view count (fire and forget)
            await supabase.rpc('increment_microsite_views' as any, { site_id: siteData.id });

            return siteData;
        },
        retry: false,
    });

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Carregando...</div>;

    // Custom 404 for microsite
    if (!site) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Site não encontrado</h1>
            <p className="text-neutral-400">O endereço solicitado não existe ou não está publicado.</p>
        </div>
    );

    // Default colors if not present
    const primaryColor = site.primary_color || '#8B5CF6';
    // const secondaryColor = site.secondary_color || '#10B981';

    return (
        <>
            <Helmet>
                <title>{site.meta_title || `${site.business_name} - Maquiadora Profissional`}</title>
                <meta name="description" content={site.meta_description || site.tagline || `Conheça os serviços de ${site.business_name}`} />
                {site.cover_image_url && <meta property="og:image" content={site.cover_image_url} />}
            </Helmet>

            <div className="min-h-screen bg-neutral-950 font-sans">
                {/* Hero Section */}
                <section
                    className="relative h-[80vh] flex items-center justify-center bg-cover bg-center"
                    style={{
                        backgroundImage: site.cover_image_url
                            ? `url(${site.cover_image_url})`
                            : `linear-gradient(135deg, ${primaryColor}40 0%, #000 100%)`,
                    }}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                    <div className="relative z-10 text-center text-white px-4 animate-in fade-in zoom-in duration-700">
                        {site.logo_url && (
                            <img
                                src={site.logo_url}
                                alt={site.business_name}
                                className="w-40 h-40 mx-auto mb-8 rounded-full border-4 border-white/10 shadow-2xl object-cover"
                            />
                        )}
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">{site.business_name}</h1>
                        {site.tagline && (
                            <p className="text-xl md:text-2xl text-neutral-200 mb-10 font-light max-w-2xl mx-auto">{site.tagline}</p>
                        )}
                        <div className="flex flex-wrap gap-4 justify-center">
                            {site.enable_booking && (
                                <Button
                                    size="lg"
                                    onClick={() => {
                                        document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="text-lg px-8 py-6 rounded-full font-semibold shadow-lg hover:brightness-110 transition-all"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Calendar className="w-5 h-5 mr-3" />
                                    Agendar Horário
                                </Button>
                            )}
                            {site.whatsapp_link && (
                                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full border-white/20 hover:bg-white/10 text-white" asChild>
                                    <a href={site.whatsapp_link} target="_blank" rel="noopener noreferrer">
                                        <Phone className="w-5 h-5 mr-3" />
                                        WhatsApp
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                {/* About Section */}
                {site.about_text && (
                    <section className="py-24 px-4 bg-black">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">Sobre Mim</h2>
                            <p className="text-neutral-300 text-lg md:text-xl leading-relaxed whitespace-pre-wrap text-center font-light">
                                {site.about_text}
                            </p>
                        </div>
                    </section>
                )}

                {/* Services Section */}
                {site.services && Array.isArray(site.services) && site.services.length > 0 && (
                    <section className="py-24 px-4 bg-neutral-900/50">
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">Serviços</h2>
                            <div className="grid md:grid-cols-3 gap-8">
                                {site.services.map((service: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-300 shadow-xl"
                                    >
                                        <h3 className="text-2xl font-semibold text-white mb-4">{service.name}</h3>
                                        <p className="text-neutral-400 mb-6 leading-relaxed min-h-[3rem]">{service.description}</p>
                                        {site.show_prices && service.price && (
                                            <div className="pt-6 border-t border-neutral-800">
                                                <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                                                    R$ {service.price}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Portfolio Section */}
                {site.portfolio_images && Array.isArray(site.portfolio_images) && site.portfolio_images.length > 0 && (
                    <section className="py-24 px-4 bg-black">
                        <div className="max-w-7xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">Portfólio</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {site.portfolio_images.map((url: string, idx: number) => (
                                    <div key={idx} className="aspect-square overflow-hidden rounded-xl bg-neutral-900 cursor-pointer group">
                                        <img
                                            src={url}
                                            alt={`Portfolio ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            onClick={() => window.open(url, '_blank')}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Imagem+Indispon%C3%ADvel';
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Booking Section */}
                {site.enable_booking && (
                    <section id="booking" className="py-24 px-4 bg-neutral-900 relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
                            style={{ background: `radial-gradient(circle at 50% 50%, ${primaryColor}, transparent 70%)` }} />

                        <div className="max-w-3xl mx-auto relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
                                Agende seu Horário
                            </h2>
                            <div className="bg-neutral-950/80 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 md:p-12 shadow-2xl">
                                <PublicBookingForm micrositeId={site.id} />
                            </div>
                        </div>
                    </section>
                )}

                {/* Contact Footer */}
                <footer className="py-20 px-4 bg-black border-t border-neutral-900">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-white mb-12">Vamos Conversar?</h2>
                        <div className="flex flex-wrap gap-8 justify-center mb-16">
                            {site.phone && (
                                <a
                                    href={`tel:${site.phone}`}
                                    className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors text-lg"
                                >
                                    <div className="p-3 bg-neutral-900 rounded-full">
                                        <Phone className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    {site.phone}
                                </a>
                            )}
                            {site.email && (
                                <a
                                    href={`mailto:${site.email}`}
                                    className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors text-lg"
                                >
                                    <div className="p-3 bg-neutral-900 rounded-full">
                                        <Mail className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    {site.email}
                                </a>
                            )}
                            {site.instagram_handle && (
                                <a
                                    href={`https://instagram.com/${site.instagram_handle.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors text-lg"
                                >
                                    <div className="p-3 bg-neutral-900 rounded-full">
                                        <Instagram className="w-6 h-6" style={{ color: primaryColor }} />
                                    </div>
                                    @{site.instagram_handle.replace('@', '')}
                                </a>
                            )}
                        </div>

                        {site.address && (
                            <div className="mb-12 flex justify-center">
                                <div className="inline-flex items-center gap-3 text-neutral-400 bg-neutral-900/50 px-6 py-3 rounded-full">
                                    <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                                    {site.address}
                                </div>
                            </div>
                        )}

                        <div className="pt-8 border-t border-neutral-900 text-neutral-600 text-sm">
                            <p className="mb-2">
                                © {new Date().getFullYear()} {site.business_name}. Todos os direitos reservados.
                            </p>
                            <p>
                                Powered by <span className="text-white font-bold tracking-wider">KHAOS KONTROL</span>
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};
