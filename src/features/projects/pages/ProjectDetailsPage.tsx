import SEOHead from '@/components/seo/SEOHead'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { useLanguage } from '@/hooks/useLanguage'
import { useProjectDetails } from '@/features/projects/hooks/useProjectDetails'
import { useProjectActions } from '@/features/projects/hooks/useProjectActions'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, FileText, ClipboardList, MessageCircle } from 'lucide-react'
import { WhatsAppButtons } from '@/components/whatsapp/WhatsAppButtons'

import type {
  Task,
  Contract,
  BriefingWithContent,
  BriefingContent,
  ProjectServiceItem,
  ServiceUI,
} from '@/types/api.types'
import { ProjectHeader } from '@/features/projects/components/details/ProjectHeader'
import { ProjectStats } from '@/features/projects/components/details/ProjectStats'
import { ProjectTabs } from '@/features/projects/components/details/ProjectTabs'
import { PageLoader } from '@/components/ui/page-loader'

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { organizationId: _organizationId, loading: orgLoading } =
    useOrganization()
  const { t } = useLanguage()

  const { data: projectDetails, isLoading, refetch } = useProjectDetails(id)
  const project = projectDetails?.project || null

  const [tasks, setTasks] = useState<Task[]>([])
  const [briefing, setBriefing] = useState<
    (BriefingWithContent & { is_submitted: boolean }) | null
  >(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [projectServices, setProjectServices] = useState<ProjectServiceItem[]>(
    [],
  )
  const [services, setServices] = useState<ServiceUI[]>([])
  const [transactions, setTransactions] = useState<
    { type: string; amount: number }[]
  >([])

  const [activeTab, setActiveTab] = useState('tarefas')
  const [viewMode, setViewMode] = useState<'internal' | 'preview'>('internal')

  useEffect(() => {
    if (projectDetails) {
      setTasks(projectDetails.tasks as Task[])

      if (projectDetails.briefing) {
        const rawBriefing = projectDetails.briefing
        const content = rawBriefing.content as BriefingContent | null
        setBriefing({
          ...rawBriefing,
          questions: rawBriefing.questions || content?.questions || [],
          answers: rawBriefing.answers || content?.answers || {},
          is_submitted: rawBriefing.status === 'submitted',
        })
      }

      setContracts(projectDetails.contracts as Contract[])

      setProjectServices(
        (projectDetails.projectServices || []).map((ps) => ({
          ...ps,
          quantity: Number(ps.quantity || 1),
          paid_amount: 0,
          notes: null,
          service: ps.service
            ? {
                ...ps.service,
                description: ps.service.description || '',
              }
            : undefined,
        })),
      )

      setServices(
        (projectDetails.services || []).map((s) => ({
          ...s,
          description: s.description || '',
        })),
      )

      setTransactions(projectDetails.transactions || [])
    }
  }, [projectDetails])

  const actions = useProjectActions({
    projectId: id,
    project,
    tasks,
    setTasks,
    services,
    projectServices,
    refetch,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth')
    }
  }, [user, authLoading, navigate])

  if (authLoading || orgLoading || isLoading) {
    return <PageLoader />
  }

  if (!project) return null

  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const totalServiceAmount = projectServices.reduce((acc, curr) => {
    const quantity = Number(curr.quantity || 0)
    const unitPrice = Number(curr.unit_price || curr.price || 0)
    return acc + quantity * unitPrice
  }, 0)
  const totalReceived = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const remainingAmount = totalServiceAmount - totalReceived

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black">
      <SEOHead title="Detalhes do Projeto" noindex={true} />
      <ProjectHeader
        project={project}
        viewMode={viewMode}
        setViewMode={setViewMode}
        copyPortalLink={actions.copyPortalLink}
        copied={actions.copied}
        handleSendReminder={actions.handleSendReminder}
        t={t}
      />

      <main className="container mx-auto px-4 py-8">
        {viewMode === 'preview' ? (
          <div className="max-w-3xl mx-auto">
            <Card className="mb-6 bg-black border border-white/20 rounded-none">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-white font-serif uppercase tracking-wide">
                  <Eye className="h-5 w-5" />
                  CLIENT_PORTAL_PREVIEW
                </CardTitle>
                <CardDescription className="text-white/40 font-mono text-xs uppercase tracking-widest">
                  SIMULATION_MODE :: VIEW_AS_CLIENT
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="space-y-6">
              <Card className="bg-black border border-white/20 rounded-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white font-serif uppercase tracking-wide">
                    <FileText className="h-5 w-5" />
                    CONTRACTS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contracts.filter(
                    (c) => c.status === 'sent' || c.status === 'signed',
                  ).length === 0 ? (
                    <p className="text-white/40 font-mono text-xs uppercase">
                      NO_CONTRACTS_AVAILABLE
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {contracts
                        .filter(
                          (c) => c.status === 'sent' || c.status === 'signed',
                        )
                        .map((contract) => (
                          <div
                            key={contract.id}
                            className="p-4 border border-white/10 rounded-none bg-white/5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm text-white">
                                {contract.title}
                              </span>
                              <Badge
                                variant="outline"
                                className={`rounded-none font-mono text-[9px] uppercase tracking-widest ${contract.status === 'signed' ? 'bg-white text-black border-white' : 'text-white border-white/40'}`}
                              >
                                {contract.status === 'signed'
                                  ? 'SIGNED'
                                  : 'PENDING'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-black border border-white/20 rounded-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white font-serif uppercase tracking-wide">
                    <ClipboardList className="h-5 w-5" />
                    BRIEFING_DATA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!briefing ? (
                    <p className="text-white/40 font-mono text-xs uppercase">
                      NO_DATA_AVAILABLE
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <Badge
                        variant="outline"
                        className={`rounded-none font-mono text-[9px] uppercase tracking-widest ${briefing.is_submitted ? 'bg-white text-black border-white' : 'text-white border-white/40'}`}
                      >
                        {briefing.is_submitted ? 'COMPLETED' : 'WAITING_INPUT'}
                      </Badge>
                      {briefing.is_submitted && (
                        <div className="space-y-3 mt-4">
                          {(
                            briefing.questions as Array<{
                              id: string
                              question: string
                            }>
                          ).map((q) => (
                            <div key={q.id} className="text-sm font-mono">
                              <p className="text-white/60 mb-1 uppercase tracking-wide text-xs">
                                {q.question}
                              </p>
                              <p className="text-white border-l border-white/20 pl-3">
                                {(briefing.answers[q.id] as string) || '-'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <>
            {}
            <Card className="mb-6 bg-black border border-white/20 rounded-none">
              <CardHeader className="border-b border-white/10 pb-3">
                <CardTitle className="flex items-center gap-2 text-white font-serif uppercase tracking-wide text-lg">
                  <MessageCircle className="h-4 w-4" />
                  Comunicação com Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <WhatsAppButtons
                  phone={project.client?.phone || ''}
                  clientName={
                    project.client?.full_name ||
                    project.client?.name ||
                    'Cliente'
                  }
                  eventDate={new Date(project.event_date || new Date())}
                  eventTime={project.event_time || undefined}
                  eventLocation={project.event_location || undefined}
                  serviceType={project.event_type || 'social'}
                />
              </CardContent>
            </Card>

            <ProjectStats
              completedTasks={completedTasks}
              totalTasks={tasks.length}
              totalServiceAmount={totalServiceAmount}
              totalReceived={totalReceived}
              remainingAmount={remainingAmount}
              t={t}
            />

            <ProjectTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              t={t}
              tasks={tasks}
              newTaskTitle={actions.newTaskTitle}
              setNewTaskTitle={actions.setNewTaskTitle}
              addTask={actions.addTask}
              toggleTask={actions.toggleTask}
              deleteTask={actions.deleteTask}
              briefing={briefing}
              createDefaultBriefing={actions.createDefaultBriefing}
              copyPortalLink={actions.copyPortalLink}
              projectId={id || ''}
              contracts={contracts}
              setContracts={setContracts}
              project={project}
              projectServices={projectServices}
              totalServiceAmount={totalServiceAmount}
              totalPaidAmount={totalReceived}
              services={services}
              isServiceDialogOpen={actions.isServiceDialogOpen}
              setIsServiceDialogOpen={actions.setIsServiceDialogOpen}
              selectedServiceId={actions.selectedServiceId}
              handleSelectService={actions.handleSelectService}
              serviceQuantity={actions.serviceQuantity}
              setServiceQuantity={actions.setServiceQuantity}
              servicePrice={actions.servicePrice}
              setServicePrice={actions.setServicePrice}
              addServiceToProject={actions.addServiceToProject}
              removeServiceFromProject={actions.removeServiceFromProject}
              isPaymentDialogOpen={actions.isPaymentDialogOpen}
              setIsPaymentDialogOpen={actions.setIsPaymentDialogOpen}
              paymentServiceId={actions.paymentServiceId}
              setPaymentServiceId={actions.setPaymentServiceId}
              paymentAmount={actions.paymentAmount}
              setPaymentAmount={actions.setPaymentAmount}
              paymentDescription={actions.paymentDescription}
              setPaymentDescription={actions.setPaymentDescription}
              registerPayment={actions.registerPayment}
            />
          </>
        )}
      </main>
    </div>
  )
}

