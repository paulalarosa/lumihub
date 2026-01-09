import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function Contact() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [challenge, setChallenge] = useState('');
  const [loading, setLoading] = useState(false);

  // Force light theme for this page
  const themeAttr = { 'data-theme': 'light' } as any;

  const sendApplication = async (payload: any) => {
    // This function posts to an internal endpoint which should call Resend (server-side)
    // Implement serverless function at: /api/resend/send-application
    try {
      setLoading(true);
      const res = await fetch('/functions/v1/send-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Falha no envio');
      toast({ title: 'Aplicação enviada', description: 'Entraremos em contato em breve.' });
      // Optionally navigate to a thank-you page
      // navigate('/thank-you');
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível enviar sua aplicação', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return toast({ title: 'Campos obrigatórios', description: 'Por favor, preencha Nome e Email', variant: 'destructive' });

    const payload = { name, email, instagram, challenge, submitted_at: new Date().toISOString() };
    await sendApplication(payload);
  };

  return (
    <div {...themeAttr} className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left persuasive column */}
          <section className="space-y-8">
            <div className="max-w-xl">
              <h1 className="lumi-title text-5xl mb-4">Eleve sua carreira hoje</h1>
              <p className="lumi-text text-lg text-[hsl(var(--muted-foreground))]">
                Aplicação exclusiva para studios que desejam entrar no plano Studio Pro. Nossa equipe de Concierge vai avaliar sua inscrição e te orientar pessoalmente para uma implementação premium.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="lumi-label">O que oferecemos</h3>
              <ul className="list-disc pl-5 text-[hsl(var(--muted-foreground))] space-y-2">
                <li>Onboarding dedicado com consultoria de processos</li>
                <li>Prioridade no suporte e integrações</li>
                <li>Material e templates profissionais para seu studio</li>
              </ul>
            </div>

            <div>
              {/* WhatsApp button - do NOT display the number anywhere */}
              <a
                href="https://wa.me/5521983604870"
                target="_blank"
                rel="noreferrer"
                className="inline-block"
                aria-label="Falar com Concierge Lumi"
              >
                <Button className="lumi-button">
                  Falar com Concierge Lumi
                </Button>
              </a>
            </div>
          </section>

          {/* Right form column */}
          <section>
            <div className="lumi-card p-8">
              <h2 className="lumi-title text-2xl mb-6">Aplicação para Studio Pro</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm lumi-label block mb-2">Nome</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-[hsl(var(--surface-border))] py-2 px-0 focus:ring-0 focus:border-[hsl(var(--metallic))] outline-none"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="text-sm lumi-label block mb-2">Email Corporativo</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="w-full bg-transparent border-0 border-b border-[hsl(var(--surface-border))] py-2 px-0 focus:ring-0 focus:border-[hsl(var(--metallic))] outline-none"
                    placeholder="seunome@seudominio.com"
                  />
                </div>

                <div>
                  <label className="text-sm lumi-label block mb-2">Instagram Profissional</label>
                  <input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-[hsl(var(--surface-border))] py-2 px-0 focus:ring-0 focus:border-[hsl(var(--metallic))] outline-none"
                    placeholder="@seu_instagram"
                  />
                </div>

                <div>
                  <label className="text-sm lumi-label block mb-2">Qual seu maior desafio hoje?</label>
                  <textarea
                    value={challenge}
                    onChange={(e) => setChallenge(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent border-0 border-b border-[hsl(var(--surface-border))] py-2 px-0 focus:ring-0 focus:border-[hsl(var(--metallic))] outline-none resize-none"
                    placeholder="Conte-nos brevemente o que mais te atrapalha hoje"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Button type="submit" className="lumi-button" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Aplicação'}
                  </Button>
                  <a href="/" className="text-sm text-[hsl(var(--muted-foreground))]
                    hover:text-foreground transition-colors">Voltar</a>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
