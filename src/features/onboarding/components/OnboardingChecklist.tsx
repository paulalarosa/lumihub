import { Link } from 'react-router-dom'
import { Check, ArrowRight, X } from 'lucide-react'
import { useOnboardingChecklist } from '../hooks/useOnboardingChecklist'

export function OnboardingChecklist() {
  const { data, dismiss, isDismissing } = useOnboardingChecklist()

  if (!data || data.isDismissed || data.total === 0 || data.isAllDone) {
    return null
  }

  return (
    <section className="border border-white/10 bg-white/[0.02] mb-8">
      <header className="flex items-start justify-between gap-4 p-6 border-b border-white/5">
        <div className="flex-1 space-y-1">
          <p className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
            Configure sua conta
          </p>
          <h2 className="font-serif text-2xl text-white">
            {data.completed} de {data.total} passos concluídos
          </h2>
          <p className="text-white/40 text-sm">
            Complete sua configuração para liberar todo o potencial do Khaos
            Kontrol.
          </p>
        </div>
        <button
          onClick={() => dismiss()}
          disabled={isDismissing}
          className="p-2 text-white/30 hover:text-white/60 transition-colors"
          aria-label="Dispensar checklist"
          title="Não mostrar mais"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="relative h-1 bg-white/5">
        <div
          className="absolute left-0 top-0 h-full bg-white/60 transition-all duration-500"
          style={{ width: `${data.percentage}%` }}
        />
      </div>

      <ul>
        {data.steps.map((step) => (
          <li key={step.id}>
            <Link
              to={step.href}
              className="flex items-center gap-4 p-5 border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors group"
            >
              <span
                className={`flex-shrink-0 w-8 h-8 flex items-center justify-center border ${
                  step.done
                    ? 'border-white/40 bg-white/10'
                    : 'border-white/15 bg-transparent'
                }`}
              >
                {step.done ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <span className="font-mono text-xs text-white/40">—</span>
                )}
              </span>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${step.done ? 'text-white/40 line-through' : 'text-white'}`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  {step.description}
                </p>
              </div>

              {!step.done && (
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
