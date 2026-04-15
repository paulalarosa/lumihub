import SEOHead from '@/components/seo/SEOHead'

const Security = () => {
  return (
    <>
      <SEOHead
        title="SEGURANÇA DA INFORMAÇÃO — KONTROL"
        description="Medidas técnicas e organizacionais para proteção de dados e integridade do ecossistema KONTROL."
        keywords="segurança, criptografia, rls, jwt, firewall, kontrol, proteção de dados"
        url="https://khaoskontrol.com.br/seguranca"
      />
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto border-l border-white/20 pl-8 md:pl-12 py-4">
            <header className="mb-20 space-y-4">
              <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-none text-white">
                SEGURANÇA DA <br /> INFORMAÇÃO
              </h1>
              <div className="flex items-center space-x-4 font-mono text-xs uppercase tracking-widest text-white/40">
                <span>VERSÃO: 1.0</span>
                <span>ATUALIZADO: 2026.04.11</span>
                <span>CYBER_SHIELD</span>
              </div>
            </header>

            <div className="space-y-12 font-sans font-light text-gray-300 leading-relaxed text-sm md:text-base">
              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  01. ARQUITETURA DE PROTEÇÃO
                </h2>
                <p>
                  O KONTROL foi construído com uma mentalidade <em>Security-by-Design</em>. Toda a nossa infraestrutura reside na nuvem da AWS via Supabase, utilizando padrões globais de segurança física e lógica.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  02. ROW LEVEL SECURITY (RLS)
                </h2>
                <p>
                  Diferente de sistemas legados, o KONTROL utiliza segurança a nível de linha diretamente no banco de dados. Isso significa que é tecnicamente impossível um usuário acessar dados de outro profissional, mesmo em caso de falha no código do frontend, pois a permissão é verificada pelo próprio núcleo do banco de dados (PostgreSQL).
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  03. CRIPTOGRAFIA E TRÂNSITO
                </h2>
                <ul className="list-disc pl-4 space-y-2 marker:text-white/50">
                  <li>
                    <strong>SSL/TLS 1.3:</strong> Todos os dados em trânsito entre seu navegador e nossos servidores são protegidos por criptografia de nível militar.
                  </li>
                  <li>
                    <strong>AES-256:</strong> Dados sensíveis e backups em repouso são criptografados utilizando o padrão Advanced Encryption Standard.
                  </li>
                  <li>
                    <strong>Tokens JWT:</strong> A autenticação é realizada via tokens assinados digitalmente, prevenindo sequestro de sessões.
                  </li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  04. PAGAMENTOS E PCI
                </h2>
                <p>
                  Não armazenamos dados de cartão de crédito em nossos servidores. Todos os fluxos financeiros são processados pelo <strong>Stripe</strong>, que possui certificação PCI-DSS Nível 1, o padrão mais rigoroso da indústria de pagamentos.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  05. MONITORAMENTO E INCIDENTES
                </h2>
                <p>
                  Operamos com monitoramento em tempo real via <strong>Sentry</strong> e logs de auditoria interna. Qualquer anomalia ou tentativa de acesso não autorizado dispara alertas imediatos para nossa equipe de engenharia.
                </p>
              </section>

              <section className="border-t border-white/10 pt-12 mt-20">
                <p className="font-mono text-xs text-white/30 uppercase tracking-widest text-center">
                  KHAOS KONTROL // SECURITY POLICY // v1.0
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Security
