import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'

interface FinancialMetricsProps {
  income: number
  expense: number
  profit: number
  loading?: boolean
}

export function FinancialMetrics({
  income,
  expense,
  profit,
  _loading,
}: FinancialMetricsProps) {
  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard
        label="RECEITAS"
        value={`R$ ${formatCurrency(income)}`}
        icon={TrendingUp}
        delay={0.1}
      />
      <MetricCard
        label="DESPESAS"
        value={`R$ ${formatCurrency(expense)}`}
        icon={TrendingDown}
        delay={0.2}
      />
      <MetricCard
        label="LUCRO LÍQUIDO"
        value={`R$ ${formatCurrency(profit)}`}
        icon={Wallet}
        delay={0.3}
      />
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  delay,
}: {
  label: string
  value: string
  icon: React.ElementType
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="bg-black border border-white/20 rounded-none group hover:border-white transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 border border-white/10 group-hover:bg-white group-hover:text-black transition-colors duration-300">
              <Icon className="h-5 w-5" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50 border border-white/10 px-2 py-1">
              {label}
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-3xl text-white tracking-tight">
              {value}
            </h3>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
