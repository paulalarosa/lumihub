import { useMemo, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { FileText, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { exportCsv } from '@/lib/csvExport'
import { logger } from '@/services/logger'
import { useMonthlyFinancials } from '../hooks/useMonthlyFinancials'
import { FinancialReportPDF } from './FinancialReportPDF'

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const currency = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n)

export function FinancialReportExporter() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [generating, setGenerating] = useState(false)

  const years = useMemo(() => {
    const yrs: number[] = []
    for (let y = currentYear; y >= currentYear - 3; y--) yrs.push(y)
    return yrs
  }, [currentYear])

  const { data, isLoading } = useMonthlyFinancials(year, month)

  const handleDownloadPdf = async () => {
    if (!data) return
    setGenerating(true)
    try {
      const blob = await pdf(<FinancialReportPDF data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `financeiro-${year}-${String(month + 1).padStart(2, '0')}.pdf`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('PDF gerado')
    } catch (err) {
      toast.error('Erro ao gerar PDF')
      logger.error(err, 'FinancialReportExporter.handleDownloadPdf')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadCsv = () => {
    if (!data) return
    exportCsv(
      `financeiro-${year}-${String(month + 1).padStart(2, '0')}`,
      data.topUsers,
      [
        { key: 'name', header: 'Usuária', value: (u) => u.full_name ?? '' },
        { key: 'email', header: 'Email', value: (u) => u.email ?? '' },
        {
          key: 'revenue',
          header: 'Receita bruta (R$)',
          value: (u) => u.revenue.toFixed(2),
        },
        {
          key: 'paid',
          header: 'Recebido (R$)',
          value: (u) => u.paid.toFixed(2),
        },
      ],
    )
  }

  return (
    <section className="border border-white/10 bg-white/[0.02]">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-white/40" />
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/60">
            Relatório financeiro
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-36 h-8 rounded-none bg-black border-white/10 text-white font-mono text-[10px] uppercase">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border border-white/10 text-white rounded-none">
              {MONTH_NAMES.map((name, idx) => (
                <SelectItem
                  key={idx}
                  value={String(idx)}
                  className="font-mono text-[10px] uppercase"
                >
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24 h-8 rounded-none bg-black border-white/10 text-white font-mono text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border border-white/10 text-white rounded-none">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)} className="font-mono text-[10px]">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="p-5 space-y-5">
        {isLoading || !data ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-px bg-white/5">
              <SummaryTile label="Receita bruta" value={currency(data.revenueGross)} />
              <SummaryTile
                label="Receita líquida"
                value={currency(data.revenueNet)}
                accent="green"
              />
              <SummaryTile
                label="Faturas"
                value={`${data.invoicesPaid}/${data.invoicesTotal}`}
                hint="pagas / total"
              />
            </div>

            {data.planBreakdown.length > 0 && (
              <div className="border border-white/5 p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-3">
                  Por plano
                </p>
                <div className="space-y-2">
                  {data.planBreakdown.map((p) => (
                    <div
                      key={p.plan}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-white/80 capitalize">{p.plan}</span>
                      <span className="font-mono text-white/60 text-xs">
                        {p.subscribers} assinantes ·{' '}
                        <span className="text-white">{currency(p.mrr)}/mês</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={handleDownloadPdf}
                disabled={generating || data.invoicesTotal === 0}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Baixar PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadCsv}
                disabled={data.topUsers.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV top usuárias
              </Button>
              <span className="font-mono text-[9px] text-white/30 tracking-widest uppercase ml-auto">
                {data.period}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function SummaryTile({
  label,
  value,
  accent,
  hint,
}: {
  label: string
  value: string
  accent?: 'green'
  hint?: string
}) {
  const color = accent === 'green' ? 'text-green-400' : 'text-white'
  return (
    <div className="bg-black p-4 space-y-1">
      <p className="font-mono text-[9px] uppercase tracking-widest text-white/40">
        {label}
      </p>
      <p className={`font-serif text-xl ${color}`}>{value}</p>
      {hint && (
        <p className="font-mono text-[9px] text-white/30 uppercase tracking-wider">
          {hint}
        </p>
      )}
    </div>
  )
}
