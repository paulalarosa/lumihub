import SEOHead from '@/components/seo/SEOHead'

const DPA = () => {
  return (
    <>
      <SEOHead
        title="ACORDO DE PROCESSAMENTO DE DADOS (DPA) — KONTROL"
        description="Termos de processamento de dados pessoais de terceiros pelo ecossistema KONTROL na qualidade de Operador."
        keywords="dpa, lgpd, processamento de dados, operador, controlador, segurança, beauty crm"
        url="https://khaoskontrol.com.br/dpa"
      />
      <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto border-l border-white/20 pl-8 md:pl-12 py-4">
            <header className="mb-20 space-y-4">
              <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-none text-white">
                ACORDO DE <br /> PROCESSAMENTO (DPA)
              </h1>
              <div className="flex items-center space-x-4 font-mono text-xs uppercase tracking-widest text-white/40">
                <span>VERSÃO: 1.0</span>
                <span>ATUALIZADO: 2026.04.11</span>
                <span>DATA_OPERATOR</span>
              </div>
            </header>

            <div className="space-y-12 font-sans font-light text-gray-300 leading-relaxed text-sm md:text-base">
              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  01. ESCOPO E DEFINIÇÕES
                </h2>
                <p>
                  Este Acordo de Processamento de Dados ("DPA") regula o tratamento de dados pessoais realizado pelo KONTROL ("Operador") em nome do Profissional de Beleza ("Controlador"), referente aos dados de suas respectivas clientes e noivas inseridos na plataforma.
                </p>
                <p>
                  Este documento é um adendo aos Termos de Serviço e garante a conformidade com a Lei Geral de Proteção de Dados (LGPD).
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  02. FUNÇÕES E RESPONSABILIDADES
                </h2>
                <ul className="list-disc pl-4 space-y-2 marker:text-white/50">
                  <li>
                    <strong>O Controlador:</strong> Garante que possui base legal (consentimento ou execução de contrato) para coletar e inserir os dados das clientes no sistema.
                  </li>
                  <li>
                    <strong>O Operador (KONTROL):</strong> Processa os dados exclusivamente para fornecer as ferramentas de gestão, agenda e contratos, seguindo as instruções documentadas pelo Controlador através do uso da plataforma.
                  </li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  03. SEGURANÇA E CONFIDENCIALIDADE
                </h2>
                <p>
                  O Operador compromete-se a:
                </p>
                <ul className="list-disc pl-4 space-y-2 marker:text-white/50">
                  <li>Manter isolamento lógico de dados entre diferentes Controladores via <em>Row Level Security</em>.</li>
                  <li>Assegurar que todos os funcionários com acesso aos dados assinaram termos de confidencialidade rigorosos.</li>
                  <li>Notificar o Controlador em até 48 horas sobre qualquer incidente de segurança confirmado que afete os dados sob sua custódia.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  04. TRANSFERÊNCIA INTERNACIONAL
                </h2>
                <p>
                  O Controlador autoriza o processamento de dados em servidores de infraestrutura global (AWS via Supabase), garantindo que tais provedores mantenham níveis de proteção equivalentes ou superiores aos exigidos pela LGPD.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white mb-6">
                  05. DEVOLUÇÃO E EXCLUSÃO
                </h2>
                <p>
                  Ao encerramento do contrato, o Operador deverá, por instrução do Controlador, excluir ou devolver todos os dados pessoais processados, salvo se houver obrigação legal de retenção por prazos fiscais ou regulatórios.
                </p>
              </section>

              <section className="border-t border-white/10 pt-12 mt-20">
                <p className="font-mono text-xs text-white/30 uppercase tracking-widest text-center">
                  KHAOS KONTROL // DATA PROCESSING ADDENDUM // v1.0
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DPA
