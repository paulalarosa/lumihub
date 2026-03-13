import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
} from 'lucide-react'
import AdminFinancials from '@/features/admin/AdminFinancials'
import { useAdminSubscriptions } from '@/hooks/useAdminSubscriptions'

export default function AdminSubscriptions() {
  const { users, stats, loading, handleUpdatePlan } = useAdminSubscriptions()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <AdminFinancials stats={stats} loading={loading} />

      <Card className="bg-[#1A1A1A] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">
            Gerenciamento de Assinaturas
          </CardTitle>
          <CardDescription className="text-gray-400">
            Controle manual de planos e acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="py-3 px-4 text-gray-400 font-medium text-sm">
                    Usuário
                  </th>
                  <th className="py-3 px-4 text-gray-400 font-medium text-sm">
                    Plano Atual
                  </th>
                  <th className="py-3 px-4 text-gray-400 font-medium text-sm">
                    Status
                  </th>
                  <th className="py-3 px-4 text-gray-400 font-medium text-sm text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando usuários...
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">
                            {user.full_name || 'Sem nome'}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`
                        ${
                          user.plan === 'empire'
                            ? 'border-amber-500 text-amber-500'
                            : user.plan === 'pro'
                              ? 'border-[#00e5ff] text-[#00e5ff]'
                              : 'border-gray-600 text-gray-400'
                        }
                      `}
                        >
                          {(user.plan || 'free').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {user.plan && user.plan !== 'free' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-green-500 text-sm">
                                Ativo
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-500 text-sm">
                                Gratuito
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {user.plan !== 'pro' && user.plan !== 'empire' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[#00e5ff] border-[#00e5ff]/30 hover:bg-[#00e5ff]/10"
                              onClick={() => handleUpdatePlan(user.id, 'pro')}
                            >
                              <ArrowUpCircle className="w-4 h-4 mr-1" />
                              Dar Pro
                            </Button>
                          )}
                          {(user.plan === 'pro' || user.plan === 'empire') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => handleUpdatePlan(user.id, 'free')}
                            >
                              <ArrowDownCircle className="w-4 h-4 mr-1" />
                              Remover
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
