import SEOHead from '@/components/seo/SEOHead'

const Terms = () => {
  return (
    <>
      <SEOHead
        title="TERMOS DE USO - KONTROL | PROTOCOL"
        description="Termos de uso e condições da plataforma KONTROL."
        keywords="termos, condições, legal, kontrol"
        url="https://khaoskontrol.com.br/termos"
      />
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto border-l border-white/20 pl-8 md:pl-12 py-4">
            <header className="mb-20 space-y-4">
              <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-none text-white">
                TERMOS DE USO
              </h1>
              <div className="flex items-center space-x-4 font-mono text-xs uppercase tracking-widest text-white/40">
                <span>LAST_UPDATE: 2026.01.20</span>
                <span>//</span>
                <span>PROTOCOL_V3</span>
              </div>
            </header>

            <div className="space-y-12 font-sans font-light text-gray-300 leading-relaxed text-sm md:text-base">
              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  01. INTRODUÇÃO
                </h2>
                <p>
                  Ao acessar ou usar a Plataforma KONTROL ("Sistema"), você
                  concorda em cumprir estes Termos de Uso. Estes termos regem o
                  uso do software, serviços e qualquer outro conteúdo
                  disponibilizado pelo KONTROL. Se você não concordar com estes
                  termos, não deverá acessar o Sistema.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  02. LICENÇA DE USO
                </h2>
                <p>
                  O KONTROL concede a você uma licença limitada, não exclusiva,
                  intransferível e revogável para usar o Sistema apenas para
                  seus fins comerciais internos e profissionais.
                </p>
                <p>
                  É estritamente proibido: (a) copiar, modificar ou criar obras
                  derivadas do Sistema; (b) fazer engenharia reversa ou tentar
                  extrair o código-fonte; (c) vender, alugar ou sublicenciar o
                  acesso ao Sistema sem autorização.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  03. RESPONSABILIDADES DA CONTA
                </h2>
                <p>
                  O usuário é o único responsável por manter a confidencialidade
                  de suas credenciais de acesso de "Nível de Comando". Qualquer
                  atividade realizada através da sua conta será de sua total
                  responsabilidade.
                </p>
                <p>
                  O KONTROL reserva-se o direito de suspender terminais (contas)
                  que apresentem atividades suspeitas ou violem nossos
                  protocolos de segurança.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  04. PAGAMENTOS E ASSINATURAS
                </h2>
                <p>
                  Os planos de acesso são cobrados mensalmente. O não pagamento
                  resultará no bloqueio temporário das funcionalidades premium
                  até a regularização. Não há contrato de fidelidade e o
                  cancelamento pode ser solicitado a qualquer momento através do
                  painel de controle.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  05. PROPRIEDADE INTELECTUAL
                </h2>
                <p>
                  Todo o design, código, gráficos e interfaces ("Interface
                  Industrial Noir") são propriedade exclusiva do KONTROL (Khaos
                  Studio). O uso não autorizado destes materiais pode violar
                  leis de direitos autorais e marcas registradas.
                </p>
              </section>

              <section className="border-t border-white/10 pt-12 mt-20">
                <p className="font-mono text-xs text-white/30 uppercase tracking-widest text-center">
                  /// END_OF_FILE
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Terms
