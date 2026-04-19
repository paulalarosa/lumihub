import { Link } from 'react-router-dom'
import SEOHead from '@/components/seo/SEOHead'

const Privacy = () => {
  return (
    <>
      <SEOHead
        title="POLÍTICA DE PRIVACIDADE — KONTROL"
        description="Política de privacidade e proteção de dados do KONTROL conforme a LGPD (Lei 13.709/2018)."
        keywords="privacidade, dados, lgpd, segurança, kontrol, proteção de dados"
        url="https://khaoskontrol.com.br/privacidade"
      />
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto border-l border-white/20 pl-8 md:pl-12 py-4">
            <header className="mb-20 space-y-4">
              <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-none text-white">
                POLÍTICA DE <br /> PRIVACIDADE
              </h1>
              <div className="flex items-center space-x-4 font-mono text-xs uppercase tracking-widest text-white/40">
                <span>VERSÃO: 2.0</span>
                <span>ATUALIZADO: 2026.04.02</span>
                <span>LGPD_COMPLIANT</span>
              </div>
            </header>

            <div className="space-y-12 font-sans font-light text-gray-300 leading-relaxed text-sm md:text-base">
              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  01. CONTROLADOR DE DADOS
                </h2>
                <p>
                  O KONTROL (khaoskontrol.com.br) é o controlador dos seus dados
                  pessoais nos termos da Lei Geral de Proteção de Dados (Lei
                  13.709/2018 — LGPD). Para qualquer questão relacionada a
                  privacidade, entre em contato pelo email:{' '}
                  <a
                    href="mailto:privacidade@khaoskontrol.com.br"
                    className="text-white underline"
                  >
                    privacidade@khaoskontrol.com.br
                  </a>
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  02. DADOS COLETADOS
                </h2>
                <p>Coletamos as seguintes categorias de dados pessoais:</p>
                <ul className="list-disc pl-4 space-y-2 marker:text-white/50">
                  <li>
                    <strong>Dados de cadastro:</strong> nome, email, telefone,
                    CPF/CNPJ, endereço, data de nascimento;
                  </li>
                  <li>
                    <strong>Dados de clientes:</strong> informações das noivas e
                    clientes cadastradas por você na plataforma;
                  </li>
                  <li>
                    <strong>Dados financeiros:</strong> informações de pagamento
                    processadas via Stripe (não armazenamos dados de cartão);
                  </li>
                  <li>
                    <strong>Dados de uso:</strong> logs de acesso, páginas
                    visitadas, ações realizadas na plataforma;
                  </li>
                  <li>
                    <strong>Dados de integrações:</strong> tokens de acesso ao
                    Google Calendar e Instagram (armazenados de forma
                    criptografada).
                  </li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  03. BASE LEGAL E FINALIDADES
                </h2>
                <p>
                  O tratamento dos seus dados se baseia nas seguintes hipóteses
                  legais da LGPD (Art. 7):
                </p>
                <ul className="list-disc pl-4 space-y-2 marker:text-white/50">
                  <li>
                    <strong>Execução de contrato (Art. 7, V):</strong> para
                    fornecer os serviços contratados;
                  </li>
                  <li>
                    <strong>Consentimento (Art. 7, I):</strong> para envio de
                    emails de marketing e uso de analytics;
                  </li>
                  <li>
                    <strong>Legítimo interesse (Art. 7, IX):</strong> para
                    melhoria da plataforma e prevenção de fraudes;
                  </li>
                  <li>
                    <strong>Obrigação legal (Art. 7, II):</strong> para
                    cumprimento de obrigações fiscais e regulatórias.
                  </li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  04. COMPARTILHAMENTO
                </h2>
                <p>
                  Compartilhamos dados apenas com parceiros essenciais para a
                  operação, todos sujeitos a acordos de proteção de dados:
                </p>
                <ul className="list-disc pl-4 space-y-2 marker:text-white/50">
                  <li>
                    <strong>Supabase:</strong> banco de dados e autenticação
                    (servidores na AWS);
                  </li>
                  <li>
                    <strong>Stripe:</strong> processamento de pagamentos
                    (PCI-DSS compliant);
                  </li>
                  <li>
                    <strong>Amazon SES:</strong> envio de emails transacionais;
                  </li>
                  <li>
                    <strong>Google:</strong> integração de calendário (mediante
                    consentimento explícito);
                  </li>
                  <li>
                    <strong>Sentry:</strong> monitoramento de erros (dados
                    anonimizados).
                  </li>
                </ul>
                <p>
                  O KONTROL <strong>não vende</strong> dados pessoais a
                  terceiros.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  05. SEUS DIREITOS (LGPD Art. 18)
                </h2>
                <p>
                  Você pode exercer os seguintes direitos a qualquer momento
                  através das{' '}
                  <Link to="/settings" className="text-white underline">
                    Configurações de Privacidade
                  </Link>{' '}
                  da sua conta:
                </p>
                <ul className="list-disc pl-4 space-y-2 marker:text-white/50">
                  <li>
                    <strong>Acesso:</strong> visualizar todos os dados que temos
                    sobre você;
                  </li>
                  <li>
                    <strong>Portabilidade:</strong> exportar seus dados em
                    formato JSON;
                  </li>
                  <li>
                    <strong>Correção:</strong> solicitar a retificação de dados
                    incorretos;
                  </li>
                  <li>
                    <strong>Eliminação:</strong> solicitar a exclusão dos seus
                    dados pessoais;
                  </li>
                  <li>
                    <strong>Revogação do consentimento:</strong> retirar
                    consentimento para marketing e analytics;
                  </li>
                  <li>
                    <strong>Informação:</strong> saber com quem seus dados são
                    compartilhados.
                  </li>
                </ul>
                <p>
                  Solicitações de exclusão são processadas em até 15 dias úteis.
                  Dados necessários para cumprimento de obrigações legais podem
                  ser retidos conforme permitido pela LGPD.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  06. SEGURANÇA
                </h2>
                <p>
                  Implementamos medidas técnicas e organizacionais para proteger
                  seus dados, incluindo: criptografia SSL/TLS em todas as
                  transmissões, Row Level Security (RLS) no banco de dados,
                  autenticação com tokens JWT, monitoramento contínuo de
                  segurança e backups criptografados.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  07. COOKIES
                </h2>
                <p>
                  Utilizamos cookies essenciais para autenticação e
                  funcionamento da plataforma. Cookies de analytics (Google
                  Analytics) são utilizados apenas mediante seu consentimento,
                  que pode ser revogado a qualquer momento nas Configurações de
                  Privacidade.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  08. RETENÇÃO DE DADOS
                </h2>
                <p>
                  Seus dados são mantidos enquanto sua conta estiver ativa. Após
                  exclusão da conta, dados pessoais são anonimizados em até 15
                  dias úteis. Dados financeiros são retidos por 5 anos conforme
                  legislação fiscal. Logs de auditoria são retidos por 1 ano
                  para fins de segurança.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  09. INTEGRAÇÃO GOOGLE
                </h2>
                <p>
                  O uso de informações recebidas das APIs do Google adere à{' '}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
                    target="_blank"
                    rel="noopener"
                    className="text-white underline"
                  >
                    Política de Dados do Usuário dos Serviços de API do Google
                  </a>
                  , incluindo os requisitos de Uso Limitado. Utilizamos o escopo{' '}
                  <em>calendar.events.readonly</em> apenas para exibir seus
                  eventos dentro do painel.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  10. ALTERAÇÕES
                </h2>
                <p>
                  Esta política pode ser atualizada periodicamente.
                  Notificaremos sobre mudanças significativas por email ou
                  através da plataforma. A continuidade do uso após alterações
                  constitui aceitação da versão atualizada.
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

export default Privacy
