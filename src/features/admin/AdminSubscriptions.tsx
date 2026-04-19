import AdminFinancials from '@/features/admin/AdminFinancials'
import { useAdminSubscriptions } from '@/hooks/useAdminSubscriptions'

export default function AdminSubscriptions() {
  const { stats, loading } = useAdminSubscriptions()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-white font-serif text-3xl tracking-tight">Financeiro & Comissões</h2>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em] mt-1">
          Revenue Intelligence & Payout Management
        </p>
      </div>

      <AdminFinancials stats={stats} loading={loading} />
    </div>
  )
}
