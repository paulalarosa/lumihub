import SEOHead from '@/components/seo/SEOHead'

const Cookies = () => {
  return (
    <>
      <SEOHead
        title="POLÍTICA DE COOKIES — KONTROL"
        description="Informações sobre o uso de cookies e tecnologias de rastreamento no ecossistema KONTROL."
        keywords="cookies, rastreamento, privacidade, analytics, kontrol"
        url="https://khaoskontrol.com.br/cookies"
      />
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto border-l border-white/20 pl-8 md:pl-12 py-4">
            <header className="mb-20 space-y-4">
              <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-none text-white">
                POLÍTICA DE <br /> COOKIES
              </h1>
              <div className="flex items-center space-x-4 font-mono text-xs uppercase tracking-widest text-white/40">
                <span>VERSÃO: 1.0</span>
                <span>ATUALIZADO: 2026.04.11</span>
                <span>TRACKING_DATA</span>
              </div>
            </header>

            <div className="space-y-12 font-sans font-light text-gray-300 leading-relaxed text-sm md:text-base">
              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  01. O QUE SÃO COOKIES?
                </h2>
                <p>
                  Cookies são pequenos arquivos de texto armazenados no seu navegador para coletar informações sobre sua atividade e identificar você durante sua navegação. No KONTROL, utilizamos cookies para garantir que o sistema funcione com rapidez e segurança.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  02. COOKIES ESSENCIAIS
                </h2>
                <p>
                  Estes cookies são necessários para o funcionamento básico da plataforma e não podem ser desativados:
                </p>
                <ul className="list-disc pl-4 space-y-2 marker:text-white/50">
                  <li>
                    <strong>Autenticação (Supabase):</strong> Mantém sua sessão segura enquanto você navega entre o painel e o calendário.
                  </li>
                  <li>
                    <strong>Preferências:</strong> Armazena escolhas simples como o idioma (PT/EN) e o modo de exibição (Dark/Light).
                  </li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  03. COOKIES DE DESEMPENHO E ANALYTICS
                </h2>
                <p>
                  Utilizamos ferramentas de parceiros para entender como os usuários interagem com o KONTROL e melhorar a interface:
                </p>
                <ul className="list-disc pl-4 space-y-2 marker:text-white/50">
                  <li>
                    <strong>Google Analytics:</strong> Coleta dados anônimos sobre o uso das páginas públicas e do microsite.
                  </li>
                  <li>
                    <strong>Sentry:</strong> Utiliza identificadores temporários para capturar erros técnicos e facilitar correções imediatas.
                  </li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  04. GESTÃO DE PREFERÊNCIAS
                </h2>
                <p>
                  Você pode gerenciar ou bloquear cookies diretamente nas configurações do seu navegador:
                </p>
                <ul className="list-disc pl-4 space-y-2 marker:text-white/50">
                  <li>Google Chrome</li>
                  <li>Mozilla Firefox</li>
                  <li>Safari</li>
                </ul>
                <p className="text-xs italic">
                  *A desativação de cookies essenciais pode impedir o acesso ao painel de controle e ao faturamento.
                </p>
              </section>

              <section className="border-t border-white/10 pt-12 mt-20">
                <p className="font-mono text-xs text-white/30 uppercase tracking-widest text-center">
                  KHAOS KONTROL
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Cookies
