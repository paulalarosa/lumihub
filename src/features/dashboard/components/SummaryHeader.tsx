import { TrendingUp } from 'lucide-react'

interface MetricItem {
  label: string
  value: string
  subtext?: string // For "Trend" or "Description"
  trend?: 'up' | 'down' | 'neutral' // Optional visual indicator
}

interface SummaryHeaderProps {
  metrics: MetricItem[]
}

export function SummaryHeader({ metrics }: SummaryHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-[#000000] border border-[#222222] p-6 flex flex-col justify-between h-32 hover:border-[#444444] transition-colors duration-300 group"
        >
          <div className="flex justify-between items-start">
            <span className="text-[#666666] font-mono text-[10px] uppercase tracking-widest group-hover:text-[#888888] transition-colors">
              {metric.label}
            </span>
            {metric.trend && (
              <div className="text-[#333333] group-hover:text-[#FFFFFF] transition-colors">
                <TrendingUp className="h-4 w-4" />
              </div>
            )}
          </div>
          <div>
            <div className="text-[#FFFFFF] font-serif text-3xl tracking-tight font-bold">
              {metric.value}
            </div>
            {metric.subtext && (
              <p className="text-[#444444] text-[10px] mt-1 font-mono uppercase group-hover:text-[#666666] transition-colors">
                {metric.subtext}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
