import { motion } from 'framer-motion'
import { BarChart3, ShieldCheck, Rocket, Clock } from 'lucide-react'

export const ProcessSection = () => {
  return (
    <section className="py-40 bg-black relative">
      <div className="container mx-auto px-6 md:px-16 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-20 items-end mb-32">
          <div>
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-10 tracking-tight leading-tight font-serif capitalize">
              Processos{' '}
              <span className="italic font-normal text-white/70">simples</span>
              <br />
              para impérios{' '}
              <span className="italic font-normal text-white/70">reais</span>
            </h2>
            <p className="text-white/50 text-lg md:text-xl max-w-md leading-relaxed font-mono uppercase tracking-wider">
              Automatizamos o que é mecânico para que você foque no que é
              artístico.
            </p>
          </div>
          <div className="flex justify-end">
            <div className="p-8 glass-strong rounded-3xl max-w-sm">
              <Clock className="w-12 h-12 text-white mb-6" />
              <h3 className="text-xl font-bold text-white mb-4 font-serif">
                Economize 15h+ semanais
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Elimine tarefas repetitivas com nossa IA operativa e automações
                inteligentes de contrato.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: BarChart3,
              title: 'Analytics Noir',
              desc: 'Dashboard em alto contraste com métricas vitais da sua carreira em tempo real.',
            },
            {
              icon: ShieldCheck,
              title: 'Legal Kontrol',
              desc: 'Gerador de contratos com validade jurídica e assinatura digital integrada.',
            },
            {
              icon: Rocket,
              title: 'Vendas Pro',
              desc: 'CRM minimalista focado em converter leads em faturamento recorrente.',
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="p-10 card group hover:scale-[1.02] transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <feature.icon className="w-10 h-10 text-white mb-8 opacity-40 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-2xl font-bold text-white mb-4 font-serif">
                {feature.title}
              </h3>
              <p className="text-white/40 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
