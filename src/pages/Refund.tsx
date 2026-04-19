import SEOHead from '@/components/seo/SEOHead'

const Refund = () => {
  return (
    <>
      <SEOHead
        title="POLÍTICA DE REEMBOLSO E CANCELAMENTO — KONTROL"
        description="Diretrizes para cancelamento de assinaturas e solicitações de reembolso no ecossistema KONTROL."
        keywords="reembolso, cancelamento, stripe, cdc, planos, kontrol"
        url="https://khaoskontrol.com.br/reembolso"
      />
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto border-l border-white/20 pl-8 md:pl-12 py-4">
            <header className="mb-20 space-y-4">
              <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-none text-white">
                REEMBOLSO E <br /> CANCELAMENTO
              </h1>
              <div className="flex items-center space-x-4 font-mono text-xs uppercase tracking-widest text-white/40">
                <span>VERSÃO: 1.0</span>
                <span>ATUALIZADO: 2026.04.11</span>
                <span>FINANCIAL_TERMS</span>
              </div>
            </header>

            <div className="space-y-12 font-sans font-light text-gray-300 leading-relaxed text-sm md:text-base">
              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  01. DIREITO DE ARREPENDIMENTO (BRASIL)
                </h2>
                <p>
                  Conforme o Código de Defesa do Consumidor (Art. 49), o usuário tem o direito de desistir da contratação em até <strong>7 (sete) dias corridos</strong> a partir da data de assinatura ou do primeiro pagamento do plano.
                </p>
                <p>
                  A solicitação de estorno total dentro deste prazo deve ser enviada para{' '}
                  <a href="mailto:suporte@khaoskontrol.com.br" className="text-white underline">
                    suporte@khaoskontrol.com.br
                  </a>{' '}
                  ou realizada diretamente através do painel de cobrança.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  02. CANCELAMENTO DE ASSINATURA
                </h2>
                <p>
                  O KONTROL opera em modelo de software como serviço (SaaS) com cobranças recorrentes (mensais ou anuais). O cancelamento pode ser efetuado a qualquer momento em <strong>Configurações &gt; Faturamento</strong>.
                </p>
                <ul className="list-disc pl-4 space-y-2 marker:text-white/50">
                  <li>
                    <strong>Uso Residual:</strong> Ao cancelar, o usuário mantém acesso integral às funcionalidades até o final do período já pago.
                  </li>
                  <li>
                    <strong>Renovação:</strong> O cancelamento impede a próxima cobrança automática no Stripe.
                  </li>
                  <li>
                    <strong>Sem Multas:</strong> Não há multas rescisórias para cancelamentos antecipados em planos mensais.
                  </li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  03. PLANOS ANUAIS
                </h2>
                <p>
                  O plano anual oferece um desconto significativo em troca de um compromisso de 12 meses. Em caso de cancelamento após o prazo de 7 dias de arrependimento:
                </p>
                <p>
                  O serviço continuará ativo até o encerramento do ciclo de 1 ano. <strong>Não realizamos reembolso pró-rata</strong> do valor anual remanescente devido ao desconto já aplicado na contratação.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  04. FALHA TÉCNICA E INDISPONIBILIDADE
                </h2>
                <p>
                  Caso o sistema apresente falhas graves que impeçam o uso conforme nosso SLA (Service Level Agreement), e tais falhas não sejam sanadas em tempo hábil, o usuário poderá solicitar o crédito proporcional ou reembolso do mês vigente, mediante análise técnica da equipe de auditoria.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  05. EXCLUSÃO DE DADOS APÓS CANCELAMENTO
                </h2>
                <p>
                  Após o encerramento da assinatura e do período de acesso residual, os dados da conta poderão ser retidos por até 30 dias para facilitar uma eventual reativação. Após este prazo, os dados serão marcados para exclusão definitiva conforme nossa Política de Privacidade.
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

export default Refund
