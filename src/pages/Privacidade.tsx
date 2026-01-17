import SEOHead from "@/components/seo/SEOHead";

const Privacidade = () => {
    return (
        <>
            <SEOHead
                title="POLÍTICA DE PRIVACIDADE - LUMI | SECURE"
                description="Protocolos de proteção de dados e privacidade da Lumi."
                keywords="privacidade, dados, lgpd, segurança, lumi"
                url="https://lumihub.lovable.app/privacidade"
            />
            <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black pt-32 pb-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto border-l border-white/20 pl-8 md:pl-12 py-4">
                        <header className="mb-20 space-y-4">
                            <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-none text-white">
                                POLÍTICA DE <br /> PRIVACIDADE
                            </h1>
                            <div className="flex items-center space-x-4 font-mono text-xs uppercase tracking-widest text-white/40">
                                <span>LAST_UPDATE: 2026.01.16</span>
                                <span>//</span>
                                <span>DATA_PROTECTION_PROTOCOL</span>
                            </div>
                        </header>

                        <div className="space-y-12 font-sans font-light text-gray-300 leading-relaxed text-sm md:text-base">
                            <section className="space-y-4">
                                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">01. COLETA DE DADOS</h2>
                                <p>
                                    Coletamos informações essenciais para a operação do Sistema ("Data Points"), incluindo: dados de cadastro
                                    (nome, email, telefone), dados financeiros para processamento de pagamentos e dados de uso da plataforma
                                    para melhoria contínua da experiência.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">02. USO DAS INFORMAÇÕES</h2>
                                <p>
                                    As informações coletadas são utilizadas exclusivamente para:
                                </p>
                                <ul className="list-disc pl-4 space-y-2 marker:text-white/50">
                                    <li>Fornecer e manter os serviços operacionais;</li>
                                    <li>Processar transações financeiras com segurança;</li>
                                    <li>Notificar sobre atualizações do sistema (System Updates);</li>
                                    <li>Prevenir fraudes e garantir a segurança da rede.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">03. COMPARTILHAMENTO DE DADOS</h2>
                                <p>
                                    A Lumi não vende ou aluga seus dados pessoais. O compartilhamento ocorre apenas com parceiros essenciais
                                    para a execução do serviço (ex: gateways de pagamento, serviços de hospedagem), que são obrigados contratualmente
                                    a manter o sigilo e segurança das informações.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">04. SEGURANÇA (ENCRYPTION)</h2>
                                <p>
                                    Implementamos medidas de segurança técnicas e organizacionais ("Military Grade") para proteger seus dados
                                    contra acesso não autorizado, alteração, divulgação ou destruição. Utilizamos criptografia SSL em todas
                                    as transmissões de dados.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">05. COOKIES & RASTREAMENTO</h2>
                                <p>
                                    Utilizamos cookies e tecnologias similares para rastrear a atividade em nosso Sistema e manter certas
                                    informações. Você pode instruir seu navegador a recusar todos os cookies, mas isso pode limitar
                                    funcionalidades da plataforma.
                                </p>
                            </section>

                            <section className="border-t border-white/10 pt-12 mt-20">
                                <p className="font-mono text-xs text-white/30 uppercase tracking-widest text-center">
                                    /// SECURE_CONNECTION_ESTABLISHED
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Privacidade;
