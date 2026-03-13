import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Minus } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { useFinancials } from '../hooks/useFinancials'
import { FinancialMetrics } from '../components/FinancialMetrics'
import { CashFlowChart } from '../components/CashFlowChart'
import { TransactionList } from '../components/TransactionList'
import TransactionDialog from '../components/TransactionDialog'
import { PageLoader } from '@/components/ui/LoadingStates'

export default function FinancialPage() {
  const { t } = useLanguage()
  const { metrics, chartData, transactions, isLoading, refetch } =
    useFinancials()

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(
    'income',
  )

  const handleOpenDialog = (type: 'income' | 'expense') => {
    setTransactionType(type)
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-10 space-y-10 selection:bg-white selection:text-black">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/20 pb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-5xl text-white tracking-tighter uppercase mb-2">
            {t('pages.finance.title')}
          </h1>
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
            {t('pages.finance.subtitle')}
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => handleOpenDialog('expense')}
            variant="outline"
            className="rounded-none border-white/20 text-white hover:bg-white hover:text-black transition-all font-mono text-xs uppercase"
          >
            <Minus className="mr-2 h-4 w-4" />
            {t('pages.finance.log_expense')}
          </Button>
          <Button
            onClick={() => handleOpenDialog('income')}
            className="rounded-none bg-white text-black hover:bg-white/80 transition-all font-mono text-xs uppercase"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('pages.finance.add_income')}
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <FinancialMetrics {...metrics} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart data={chartData} />
        <TransactionList transactions={transactions} />
      </div>

      <TransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type={transactionType}
        onSuccess={refetch}
      />
    </div>
  )
}
