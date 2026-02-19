import { InstagramConnect } from '@/components/instagram/InstagramConnect';
import { PostScheduler } from '@/components/instagram/PostScheduler';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function IntegrationsPage() {
    const [searchParams] = useSearchParams();
    const instagramStatus = searchParams.get('instagram');

    useEffect(() => {
        if (instagramStatus === 'success') {
            toast.success('Instagram conectado com sucesso!');
        } else if (instagramStatus === 'error') {
            toast.error('Erro ao conectar Instagram. Tente novamente.');
        }
    }, [instagramStatus]);

    return (
        <div className="min-h-screen bg-[#000000] text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-serif text-white mb-2">Integrações</h1>
                    <p className="text-neutral-400">Gerencie suas conexões e automatize suas redes sociais.</p>
                </div>

                <div className="grid gap-8">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-medium text-white">Redes Sociais</h2>
                            {/* If connected, show scheduler button */}
                            <PostScheduler />
                        </div>

                        <InstagramConnect />
                    </section>

                    {/* Placeholders for future integrations */}
                    <section className="opacity-50 pointer-events-none">
                        <h2 className="text-xl font-medium text-white mb-4">Google Calendar</h2>
                        <div className="p-6 border border-white/10 rounded bg-white/5">
                            <p>Em breve...</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
