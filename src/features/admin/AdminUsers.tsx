import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/services/logger'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  LogIn,
  Shield,
  User,
  Users,
  AlertCircle,
  MoreHorizontal,
  Lock,
  RefreshCw,
  Search,
  ShieldOff,
  CreditCard,
  Building2,
  X,
  CheckSquare,
  Loader2,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useAdminUsers } from './hooks/useAdminUsers'
import { Skeleton } from '@/components/ui/skeleton'
import { exportCsv } from '@/lib/csvExport'
import { Download } from 'lucide-react'
import { UserDetailsSheet } from './components/UserDetailsSheet'

const PLAN_OPTIONS = [
  { value: 'free', label: 'Gratuito' },
  { value: 'essencial', label: 'Essencial' },
  { value: 'profissional', label: 'Profissional' },
  { value: 'studio', label: 'Studio' },
]

export default function AdminUsers() {
  const { user: adminUser } = useAuth()
  const { toast } = useToast()
  const { data: users, isLoading, isError, refetch } = useAdminUsers()

  const [searchQuery, setSearchQuery] = useState('')
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const [planDialog, setPlanDialog] = useState<{
    open: boolean
    userId: string
    userName: string
    currentPlan: string
  }>({ open: false, userId: '', userName: '', currentPlan: '' })
  const [selectedPlan, setSelectedPlan] = useState('')

  const [planFilter, setPlanFilter] = useState<string>('all')
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkPlan, setBulkPlan] = useState<string>('')
  const [bulkRunning, setBulkRunning] = useState(false)

  const filteredUsers =
    users?.filter((u) => {
      const lowerQuery = searchQuery.toLowerCase().trim()
      const matchesSearch = lowerQuery === '' ||
        (u.full_name?.toLowerCase() || '').includes(lowerQuery) ||
        (u.email?.toLowerCase() || '').includes(lowerQuery) ||
        (u.id?.toLowerCase() || '').includes(lowerQuery)

      const matchesPlan = planFilter === 'all' ||
        (u.plan?.toLowerCase() || 'free') === planFilter.toLowerCase()

      return matchesSearch && matchesPlan
    }) || []

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const allIds = filteredUsers
        .filter((u) => u.id !== adminUser?.id)
        .map((u) => u.id)
      if (prev.size === allIds.length) return new Set()
      return new Set(allIds)
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const selectedUsers = filteredUsers.filter((u) => selectedIds.has(u.id))

  const handleBulkExport = () => {
    if (selectedUsers.length === 0) return
    handleExport(selectedUsers)
  }

  const handleBulkPlanChange = async () => {
    if (!bulkPlan || selectedUsers.length === 0) return
    setBulkRunning(true)
    let success = 0
    let failed = 0
    for (const u of selectedUsers) {
      try {
        const { error } = await (supabase.rpc as CallableFunction)(
          'admin_update_user_plan',
          { p_user_id: u.id, p_new_plan: bulkPlan },
        )
        if (error) throw error
        success++
      } catch (err) {
        logger.error('AdminUsers.bulkPlan', err)
        failed++
      }
    }
    toast({
      title: 'Alteração em massa concluída',
      description: `${success} atualizadas, ${failed} com erro.`,
    })
    setBulkRunning(false)
    setBulkPlan('')
    clearSelection()
    refetch()
  }

  const handleBulkBlock = async (block: boolean) => {
    if (selectedUsers.length === 0) return
    setBulkRunning(true)
    let success = 0
    let failed = 0
    for (const u of selectedUsers) {
      if (u.id === adminUser?.id) continue
      try {
        const { error } = await (supabase.rpc as CallableFunction)(
          'admin_block_user',
          { p_user_id: u.id, p_blocked: block },
        )
        if (error) throw error
        success++
      } catch (err) {
        logger.error('AdminUsers.bulkBlock', err)
        failed++
      }
    }
    toast({
      title: block ? 'Usuárias suspensas' : 'Usuárias reativadas',
      description: `${success} atualizadas, ${failed} com erro.`,
    })
    setBulkRunning(false)
    clearSelection()
    refetch()
  }

  const handleExport = (list: typeof filteredUsers) => {
    exportCsv(
      `usuarias-${new Date().toISOString().split('T')[0]}`,
      list,
      [
        { key: 'id', header: 'ID', value: (u) => u.id ?? '' },
        { key: 'name', header: 'Nome', value: (u) => u.full_name ?? '' },
        { key: 'email', header: 'Email', value: (u) => u.email ?? '' },
        { key: 'plan', header: 'Plano', value: (u) => u.plan ?? 'free' },
        { key: 'role', header: 'Role', value: (u) => u.role ?? '' },
        {
          key: 'created_at',
          header: 'Criada em',
          value: (u) => u.created_at ?? '',
        },
      ],
    )
  }

  const handleImpersonate = async (targetUserId: string) => {
    try {
      setImpersonating(targetUserId)

      const { data, error } = await supabase.functions.invoke(
        'admin-ghost-login',
        {
          body: { target_user_id: targetUserId },
        },
      )

      if (error) throw error

      if (data?.session_url) {
        window.open(data.session_url, '_blank')
      }

      toast({
        title: 'Ghost Login',
        description: `Sessão iniciada para ${targetUserId.slice(-8)}`,
      })
    } catch (error) {
      logger.error('AdminUsers.handleImpersonate', error)
      toast({
        title: 'Erro',
        description:
          'Falha ao iniciar ghost session. Verifique a Edge Function.',
        variant: 'destructive',
      })
    } finally {
      setImpersonating(null)
    }
  }

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast({
        title: 'Email enviado',
        description: `Link de recuperação enviado para ${email}`,
      })
    } catch (error) {
      logger.error('AdminUsers.handleResetPassword', error)
      toast({
        title: 'Erro',
        description: 'Falha ao enviar email de recuperação.',
        variant: 'destructive',
      })
    }
  }

  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      const { data, error } = await (supabase.rpc as CallableFunction)('admin_block_user', {
        p_user_id: userId,
        p_blocked: block,
      })

      if (error) throw error

      toast({
        title: block ? 'Usuário bloqueado' : 'Usuário desbloqueado',
        description: data?.user_name || userId.slice(-8),
      })

      refetch()
    } catch (error) {
      logger.error('AdminUsers.handleBlockUser', error)
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status do usuário.',
        variant: 'destructive',
      })
    }
  }

  const handleChangePlan = async () => {
    try {
      const { data, error } = await (supabase.rpc as CallableFunction)(
        'admin_update_user_plan',
        {
          p_user_id: planDialog.userId,
          p_new_plan: selectedPlan,
        },
      )

      if (error) throw error

      toast({
        title: 'Plano atualizado',
        description: `${data?.user_name}: ${data?.old_plan} → ${data?.new_plan}`,
      })

      setPlanDialog({ open: false, userId: '', userName: '', currentPlan: '' })
      refetch()
    } catch (error) {
      logger.error('AdminUsers.handleChangePlan', error)
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar plano.',
        variant: 'destructive',
      })
    }
  }

  const handleStudioTag = async (userId: string, isStudio: boolean) => {
    try {
      const { data, error } = await (supabase.rpc as CallableFunction)('admin_set_studio_tag', {
        p_user_id: userId,
        p_is_studio: isStudio,
      })
      if (error) throw error
      toast({
        title: isStudio ? 'Acesso KAOS ativado' : 'Acesso KAOS removido',
        description: `O terminal de agenda KAOS foi ${(data as { is_studio?: boolean })?.is_studio ? 'habilitado' : 'desabilitado'}.`,
      })
      refetch()
    } catch (error) {
      logger.error('AdminUsers.handleStudioTag', error)
      toast({ title: 'Erro ao alterar modo KAOS', variant: 'destructive' })
    }
  }

  const getPlanLabel = (plan: string) => {
    return PLAN_OPTIONS.find((p) => p.value === plan.toLowerCase())?.label || plan
  }

  const isBlocked = (u: { subscription_status?: string | null }) => u.subscription_status === 'blocked'

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <p className="text-muted-foreground font-mono text-xs uppercase animate-pulse">
          Scanning_User_Database...
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive font-mono border border-destructive/20 bg-destructive/5">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        Failed to load user database.
        <p className="text-[10px] mt-2 text-destructive/70 max-w-sm mx-auto">
          NOTE: If you are seeing "Unauthorized" in logs, your user ID might not have 'admin' role in the profiles table.
        </p>
        <Button
          variant="link"
          onClick={() => refetch()}
          className="text-destructive block mx-auto mt-2 font-bold"
        >
          &gt; Retry Connection
        </Button>
      </div>
    )
  }

  if (filteredUsers.length === 0 && searchQuery === '' && planFilter === 'all') {
    return (
      <div className="p-12 text-center font-mono border border-zinc-800 bg-zinc-900/10">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p className="text-zinc-500 uppercase tracking-widest text-xs">User Database Empty or Access Restricted</p>
        <div className="mt-8 p-4 border border-yellow-900/30 bg-yellow-900/5 text-yellow-500/80 text-left max-w-2xl mx-auto">
          <p className="text-sm font-bold mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> RECOMENDAÇÃO:
          </p>
          <p className="text-xs leading-relaxed">
            Se você sabe que existem usuários mas não os vê, isso indica que sua conta não tem o cargo (role) 'admin' na tabela 'profiles' do banco de dados oficial.
            <br /><br />
            Para resolver, execute este SQL no painel SQL do Supabase:
            <code className="block bg-black p-2 mt-2 border border-white/5 text-white select-all">
              UPDATE profiles SET role = 'admin' WHERE email = '{adminUser?.email}';
            </code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />
            <Input
              className="pl-9 bg-zinc-900/50 border-zinc-800 text-white rounded-none focus:border-white focus:ring-0 font-mono text-xs h-10 tracking-tight"
              placeholder="SEARCH USER..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-full md:w-48 h-10 rounded-none border-zinc-800 bg-zinc-900/50 text-white font-mono text-[10px] uppercase tracking-widest focus:ring-1 focus:ring-white">
              <SelectValue placeholder="FILTER_BY_PLAN" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-zinc-800 bg-zinc-950 text-white">
              <SelectItem value="all" className="font-mono text-[10px] uppercase focus:bg-white focus:text-black rounded-none">ALL_PLANS</SelectItem>
              {PLAN_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value} className="font-mono text-[10px] uppercase focus:bg-white focus:text-black rounded-none">
                  {p.label.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-bold">
            {filteredUsers.length} telemetry_records
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport(filteredUsers)}
            disabled={filteredUsers.length === 0}
            className="rounded-none border-zinc-800 bg-zinc-900/50 hover:bg-white hover:text-black font-mono text-[10px] tracking-widest transition-all"
          >
            <Download className="h-3 w-3 mr-2" />
            EXPORT_CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-none border-zinc-800 bg-zinc-900/50 hover:bg-white hover:text-black font-mono text-[10px] tracking-widest transition-all"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            SYNC_DB
          </Button>
        </div>
      </div>

      <Card className="bg-black/40 border border-zinc-800 rounded-none overflow-hidden backdrop-blur-sm shadow-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left py-4 px-4 w-8">
                    <Checkbox
                      checked={
                        selectedIds.size > 0 &&
                        selectedIds.size ===
                          filteredUsers.filter((u) => u.id !== adminUser?.id)
                            .length
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todas"
                      className="rounded-none border-zinc-700"
                    />
                  </th>
                  <th className="text-left py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                    User
                  </th>
                  <th className="text-left py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                    Access_Level
                  </th>
                  <th className="text-left py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                    SaaS_Tier
                  </th>
                  <th className="text-left py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                    State
                  </th>
                  <th className="text-left py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                    Registered
                  </th>
                  <th className="text-right py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                    Operations
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setDetailsUserId(u.id)}
                    className={`border-b border-zinc-900 hover:bg-white/[0.02] transition-colors group cursor-pointer ${
                      isBlocked(u) ? 'bg-red-900/5' : ''
                    } ${selectedIds.has(u.id) ? 'bg-white/[0.04]' : ''}`}
                  >
                    <td
                      className="py-5 px-4 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.has(u.id)}
                        onCheckedChange={() => toggleSelect(u.id)}
                        disabled={u.id === adminUser?.id}
                        aria-label={`Selecionar ${u.full_name || u.email}`}
                        className="rounded-none border-zinc-700"
                      />
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors">
                            {(u.full_name || '?').charAt(0)}
                          </div>
                          <span className="font-serif text-white text-sm tracking-tight group-hover:text-yellow-500 transition-colors">
                            {u.full_name || 'Anonymous User'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600 pl-10 tracking-tighter">
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <Badge
                        variant="outline"
                        className={`rounded-none font-mono text-[9px] uppercase tracking-widest border-zinc-800 ${
                          u.role === 'admin'
                            ? 'bg-white text-black font-bold'
                            : 'text-zinc-500'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <Shield className="h-2.5 w-2.5 mr-1.5" />
                        ) : (
                          <User className="h-2.5 w-2.5 mr-1.5" />
                        )}
                        {u.role || 'user'}
                      </Badge>
                    </td>
                    <td className="py-5 px-6">
                      <Select
                        value={u.plan?.toLowerCase() || 'free'}
                        onValueChange={(newPlan) => {
                          setPlanDialog({
                            open: false,
                            userId: u.id,
                            userName: u.full_name || u.email || '',
                            currentPlan: u.plan || 'free',
                          })
                          setSelectedPlan(newPlan)

                          const updatePlan = async () => {
                            try {
                              const { data, error } = await (supabase.rpc as CallableFunction)(
                                'admin_update_user_plan',
                                {
                                  p_user_id: u.id,
                                  p_new_plan: newPlan,
                                },
                              )
                              if (error) throw error
                              toast({
                                title: 'Plano atualizado',
                                description: `${data?.user_name || u.email}: ${getPlanLabel(data?.old_plan || 'free')} → ${getPlanLabel(data?.new_plan || newPlan)}`,
                              })
                              refetch()
                            } catch (error) {
                              logger.error('AdminUsers.directUpdate', error)
                              toast({ title: 'Erro ao atualizar plano', variant: 'destructive' })
                            }
                          }
                          updatePlan()
                        }}
                      >
                        <SelectTrigger className="h-8 rounded-none border-zinc-800 bg-zinc-900/50 text-[11px] font-mono uppercase tracking-tight w-[140px] focus:ring-1 focus:ring-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-zinc-800 bg-zinc-950 text-white">
                          {PLAN_OPTIONS.map((p) => (
                            <SelectItem
                              key={p.value}
                              value={p.value}
                              className="font-mono text-[10px] uppercase focus:bg-white focus:text-black rounded-none py-1.5"
                            >
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-5 px-6">
                      <Badge
                        variant="outline"
                        className={`rounded-none font-mono text-[9px] uppercase tracking-[0.15em] ${
                          isBlocked(u)
                            ? 'bg-red-950/30 border-red-900 text-red-500 animate-pulse'
                            : u.subscription_status === 'active'
                              ? 'border-green-900/50 text-green-500'
                              : 'border-zinc-800 text-zinc-600'
                        }`}
                      >
                        {isBlocked(u)
                          ? 'SUSPENDED'
                          : u.subscription_status || 'offline'}
                      </Badge>
                    </td>
                    <td className="py-5 px-6 text-zinc-600 text-[10px] font-mono uppercase">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                    <td className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-zinc-800 rounded-none text-zinc-500 hover:text-white transition-all"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-zinc-950 border border-zinc-800 rounded-none w-56 p-1 shadow-2xl backdrop-blur-xl"
                        >
                          <DropdownMenuLabel className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-600 px-3 py-2">
                            User Operations
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-zinc-900" />
                          <DropdownMenuItem
                            className="cursor-pointer rounded-none font-mono text-[10px] uppercase tracking-widest text-zinc-400 focus:bg-white focus:text-black py-2"
                            onClick={() => handleImpersonate(u.id)}
                            disabled={
                              impersonating === u.id || u.id === adminUser?.id
                            }
                          >
                            <LogIn className="mr-2 h-3 w-3" />
                            {impersonating === u.id
                              ? 'STABLISHING_LINK...'
                              : 'GHOST_LOGIN'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer rounded-none font-mono text-[10px] uppercase tracking-widest text-zinc-400 focus:bg-white focus:text-black py-2"
                            onClick={() => {
                              setPlanDialog({
                                open: true,
                                userId: u.id,
                                userName: u.full_name || u.email || '',
                                currentPlan: u.plan || 'free',
                              })
                              setSelectedPlan(u.plan || 'free')
                            }}
                          >
                            <CreditCard className="mr-2 h-3 w-3" />
                            UPGRADE_TIER
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer rounded-none font-mono text-[10px] uppercase tracking-widest text-zinc-400 focus:bg-white focus:text-black py-2"
                            onClick={() => handleResetPassword(u.email || '')}
                          >
                            <Lock className="mr-2 h-3 w-3" />
                            RESET_ACCESS
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer rounded-none font-mono text-[10px] uppercase tracking-widest text-zinc-400 focus:bg-white focus:text-black py-2"
                            onClick={() => handleStudioTag(u.id, u.subscription_tier !== 'studio')}
                          >
                            <Building2 className="mr-2 h-3 w-3" />
                            {u.subscription_tier === 'studio' ? 'REMOVE_KAOS_MODE' : 'GIVE_KAOS_MODE'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-900" />
                          {isBlocked(u) ? (
                            <DropdownMenuItem
                              className="cursor-pointer rounded-none font-mono text-[10px] uppercase tracking-widest text-green-500 focus:bg-green-500 focus:text-black py-2"
                              onClick={() => handleBlockUser(u.id, false)}
                            >
                              <ShieldOff className="mr-2 h-3 w-3" />
                              RESTORE_LINK
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="cursor-pointer rounded-none font-mono text-[10px] uppercase tracking-widest text-red-500 focus:bg-red-500 focus:text-black py-2"
                              onClick={() => handleBlockUser(u.id, true)}
                              disabled={u.id === adminUser?.id}
                            >
                              <Shield className="mr-2 h-3 w-3" />
                              SEVER_LINK
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={planDialog.open}
        onOpenChange={(open) => setPlanDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 rounded-none max-w-sm p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] border-t-2 border-t-white/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl tracking-tight text-white mb-2">
              Modify Subscription Tier
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4 border-y border-zinc-900 my-2">
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-bold">
                TARGET_USER
              </p>
              <p className="text-sm font-serif text-white">
                {planDialog.userName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-bold">
                CURRENT_TIER
              </p>
              <p className="text-xs font-mono text-yellow-500 uppercase font-bold tracking-tight">
                {getPlanLabel(planDialog.currentPlan)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-bold">
                NEW_ASSIGNMENT
              </p>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="rounded-none border-zinc-800 bg-zinc-900 text-white font-mono text-xs uppercase h-10 ring-offset-zinc-950 focus:ring-1 focus:ring-white">
                  <SelectValue placeholder="Select new tier" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-zinc-800 bg-zinc-950 text-white">
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem
                      key={p.value}
                      value={p.value}
                      className="font-mono text-xs uppercase focus:bg-white focus:text-black rounded-none py-2"
                    >
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              className="rounded-none border-zinc-800 font-mono text-[10px] h-10 px-6 tracking-widest uppercase hover:bg-zinc-900 hover:text-white"
              onClick={() =>
                setPlanDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Abort
            </Button>
            <Button
              className="rounded-none bg-white text-black font-mono text-[10px] h-10 px-6 tracking-widest uppercase hover:bg-zinc-300 font-bold"
              onClick={handleChangePlan}
              disabled={selectedPlan === planDialog.currentPlan}
            >
              Commit_Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserDetailsSheet
        userId={detailsUserId}
        onClose={() => setDetailsUserId(null)}
      />

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-950 border border-white/20 shadow-2xl rounded-none flex items-center gap-3 px-4 py-3 min-w-[520px]">
          <div className="flex items-center gap-2 border-r border-zinc-800 pr-4">
            <CheckSquare className="w-3.5 h-3.5 text-white" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white">
              {selectedIds.size} selecionada{selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkExport}
            disabled={bulkRunning}
            className="rounded-none border-zinc-800 bg-transparent hover:bg-white hover:text-black font-mono text-[10px] tracking-widest h-8"
          >
            <Download className="w-3 h-3 mr-2" />
            EXPORTAR CSV
          </Button>

          <div className="flex items-center gap-1">
            <Select value={bulkPlan} onValueChange={setBulkPlan}>
              <SelectTrigger className="w-[140px] h-8 rounded-none border-zinc-800 bg-transparent text-[10px] font-mono uppercase tracking-widest">
                <SelectValue placeholder="MUDAR PLANO" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-zinc-800 bg-zinc-950 text-white">
                {PLAN_OPTIONS.map((p) => (
                  <SelectItem
                    key={p.value}
                    value={p.value}
                    className="font-mono text-[10px] uppercase focus:bg-white focus:text-black rounded-none"
                  >
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleBulkPlanChange}
              disabled={!bulkPlan || bulkRunning}
              className="rounded-none bg-white text-black hover:bg-zinc-200 h-8 font-mono text-[10px] tracking-widest"
            >
              {bulkRunning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                'APLICAR'
              )}
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkBlock(true)}
            disabled={bulkRunning}
            className="rounded-none border-red-900/50 bg-transparent text-red-500 hover:bg-red-500 hover:text-black font-mono text-[10px] tracking-widest h-8"
          >
            <Shield className="w-3 h-3 mr-2" />
            SUSPENDER
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkBlock(false)}
            disabled={bulkRunning}
            className="rounded-none border-green-900/50 bg-transparent text-green-500 hover:bg-green-500 hover:text-black font-mono text-[10px] tracking-widest h-8"
          >
            <ShieldOff className="w-3 h-3 mr-2" />
            REATIVAR
          </Button>

          <button
            onClick={clearSelection}
            disabled={bulkRunning}
            className="ml-auto text-zinc-500 hover:text-white transition-colors"
            aria-label="Limpar seleção"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
