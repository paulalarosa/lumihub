import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Privacidade() {
    return (
        <div className="min-h-screen bg-[#050505] text-[#C0C0C0] font-sans selection:bg-[#00e5ff]/30 selection:text-[#00e5ff]">
            <Header />

            <main className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-8">
                    Política de Privacidade
                </h1>

                <div className="space-y-8 text-lg font-light leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-serif font-semibold text-white">1. Introdução</h2>
                        <p className="text-white/70">
                            A sua privacidade é fundamental para nós. Esta política descreve como o LumiHub coleta,
                            usa e protege suas informações pessoais ao utilizar nossa plataforma.
                            Ao utilizar nossos serviços, você concorda com a coleta e uso de informações de acordo com esta política.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-serif font-semibold text-white">2. Coleta de Dados</h2>
                        <p className="text-white/70">
                            Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail
                            e outras informações de contato ao criar uma conta. Também podemos coletar dados de uso
                            automaticamente para melhorar a performance da plataforma.
                        </p>
                    </section>

                    <div className="p-6 rounded-2xl bg-[#00e5ff]/5 border border-[#00e5ff]/20 shadow-[0_0_30px_rgba(0,229,255,0.05)]">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-serif font-semibold text-white flex items-center gap-2">
                                3. Uso de Dados do Google
                                <span className="text-xs bg-[#00e5ff]/10 text-[#00e5ff] px-2 py-1 rounded-full border border-[#00e5ff]/20 font-sans tracking-wide">
                                    GOOGLE API COMPLIANCE
                                </span>
                            </h2>
                            <p className="text-[#00e5ff]/90 font-medium">
                                O LumiHub utiliza dados da sua Agenda Google apenas para exibir seus compromissos dentro da plataforma.
                                Não armazenamos seus dados externamente nem compartilhamos com terceiros.
                            </p>
                            <p className="text-white/70">
                                O uso das informações recebidas das APIs do Google pelo LumiHub adere à
                                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] hover:underline ml-1">
                                    Política de Dados do Usuário dos Serviços de API do Google
                                </a>, incluindo os requisitos de uso limitado.
                            </p>
                        </section>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-serif font-semibold text-white">4. Segurança</h2>
                        <p className="text-white/70">
                            Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados
                            contra acesso não autorizado, alteração ou destruição. Utilizamos criptografia e protocolos
                            seguros (HTTPS) em todas as comunicações.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-serif font-semibold text-white">5. Seus Direitos</h2>
                        <p className="text-white/70">
                            Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento.
                            Para exercer esses direitos, entre em contato com nosso suporte.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-serif font-semibold text-white">6. Contato</h2>
                        <p className="text-white/70">
                            Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco através
                            da nossa página de <a href="/contato" className="text-[#00e5ff] hover:underline">Contato</a>.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-white/10 text-sm text-white/40">
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
