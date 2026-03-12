import { Counter } from './Counter'

export const KeyNumbersSection = () => {
  return (
    <section className="py-24 bg-black border-y border-white/5 relative z-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left">
          {[
            { label: 'CLIENTES ATIVOS', value: '+5K' },
            { label: 'CONTRATOS GERADOS', value: '12K' },
            { label: 'UPTIME SISTEMA', value: '99.9%' },
            { label: 'PROJETOS GERIDOS', value: '8.4K' },
          ].map((stat, i) => (
            <div key={i} className="group">
              <p className="text-8xl font-bold text-white group-hover:text-white transition-colors mb-2">
                <Counter value={stat.value} />
              </p>
              <p className="text-[10px] font-mono text-white/40 tracking-[0.3em]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
