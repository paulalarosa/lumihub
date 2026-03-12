import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProjectTasks } from './ProjectTasks'
import { ProjectBriefing } from './ProjectBriefing'
import { ProjectFinancials } from './ProjectFinancials'
import { ContractsTab } from '@/features/projects/sections/contratos'

import type {
  Task,
  Contract,
  BriefingWithContent,
  ProjectServiceItem,
  ProjectWithRelations,
  ServiceUI,
} from '@/types/api.types'

interface ProjectTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  t: (key: string) => string

  // Tasks Props
  tasks: Task[]
  newTaskTitle: string
  setNewTaskTitle: (value: string) => void
  addTask: (e: React.FormEvent) => void
  toggleTask: (id: string, currentStatus: string | null) => void
  deleteTask: (id: string) => void

  // Briefing Props
  briefing: (BriefingWithContent & { is_submitted: boolean }) | null
  createDefaultBriefing: () => void
  copyPortalLink: () => void

  // Contracts Props
  projectId: string
  contracts: Contract[]
  setContracts: (val: Contract[]) => void
  project: ProjectWithRelations | null
  projectServices: ProjectServiceItem[]

  // Financials Props
  totalServiceAmount: number
  totalPaidAmount: number
  services: ServiceUI[]
  isServiceDialogOpen: boolean
  setIsServiceDialogOpen: (val: boolean) => void
  selectedServiceId: string
  handleSelectService: (id: string) => void
  serviceQuantity: string
  setServiceQuantity: (val: string) => void
  servicePrice: string
  setServicePrice: (val: string) => void
  addServiceToProject: (e: React.FormEvent) => void
  removeServiceFromProject: (id: string) => void
  isPaymentDialogOpen: boolean
  setIsPaymentDialogOpen: (val: boolean) => void
  paymentServiceId: string
  setPaymentServiceId: (val: string) => void
  paymentAmount: string
  setPaymentAmount: (val: string) => void
  paymentDescription: string
  setPaymentDescription: (val: string) => void
  registerPayment: (e: React.FormEvent) => void
}

// Update component signature and remove visibility props
export const ProjectTabs = ({
  activeTab,
  setActiveTab,
  t,
  // Tasks
  tasks,
  newTaskTitle,
  setNewTaskTitle,
  addTask,
  toggleTask,
  deleteTask,
  // Briefing
  briefing,
  createDefaultBriefing,
  copyPortalLink,
  // Contracts
  projectId,
  contracts,
  setContracts,
  project,
  projectServices,
  // Financials
  totalServiceAmount,
  totalPaidAmount,
  services,
  isServiceDialogOpen,
  setIsServiceDialogOpen,
  selectedServiceId,
  handleSelectService,
  serviceQuantity,
  setServiceQuantity,
  servicePrice,
  setServicePrice,
  addServiceToProject,
  removeServiceFromProject,
  isPaymentDialogOpen,
  setIsPaymentDialogOpen,
  paymentServiceId,
  setPaymentServiceId,
  paymentAmount,
  setPaymentAmount,
  paymentDescription,
  setPaymentDescription,
  registerPayment,
}: ProjectTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="bg-black border border-white/20 p-0 rounded-none h-12 w-full flex justify-start overflow-x-auto">
        <TabsTrigger
          value="tarefas"
          className="data-[state=active]:bg-white data-[state=active]:text-black text-white/60 rounded-none h-full px-6 font-mono text-xs uppercase tracking-widest transition-all"
        >
          {t('dashboard.tasks')}
        </TabsTrigger>
        <div className="w-[1px] h-full bg-white/20"></div>
        <TabsTrigger
          value="briefing"
          className="data-[state=active]:bg-white data-[state=active]:text-black text-white/60 rounded-none h-full px-6 font-mono text-xs uppercase tracking-widest transition-all"
        >
          {t('dashboard.briefing')}
        </TabsTrigger>
        <div className="w-[1px] h-full bg-white/20"></div>
        <TabsTrigger
          value="contratos"
          className="data-[state=active]:bg-white data-[state=active]:text-black text-white/60 rounded-none h-full px-6 font-mono text-xs uppercase tracking-widest transition-all"
        >
          {t('dashboard.contracts')}
        </TabsTrigger>
        <div className="w-[1px] h-full bg-white/20"></div>
        <TabsTrigger
          value="financeiro"
          className="data-[state=active]:bg-white data-[state=active]:text-black text-white/60 rounded-none h-full px-6 font-mono text-xs uppercase tracking-widest transition-all"
        >
          {t('dashboard.financial')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tarefas">
        <ProjectTasks
          tasks={tasks}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          addTask={addTask}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          t={t}
        />
      </TabsContent>

      <TabsContent value="briefing">
        <ProjectBriefing
          briefing={briefing}
          createDefaultBriefing={createDefaultBriefing}
          copyPortalLink={copyPortalLink}
        />
      </TabsContent>

      <TabsContent value="contratos">
        <ContractsTab
          projectId={projectId}
          contracts={contracts}
          setContracts={setContracts}
          project={project}
          projectServices={projectServices}
          totalValue={projectServices.reduce(
            (acc, curr) => acc + (Number(curr.total_price) || 0),
            0,
          )}
        />
      </TabsContent>

      <TabsContent value="financeiro">
        <ProjectFinancials
          totalServiceAmount={totalServiceAmount}
          totalPaidAmount={totalPaidAmount}
          projectServices={projectServices}
          services={services}
          t={t}
          isServiceDialogOpen={isServiceDialogOpen}
          setIsServiceDialogOpen={setIsServiceDialogOpen}
          selectedServiceId={selectedServiceId}
          handleSelectService={handleSelectService}
          serviceQuantity={serviceQuantity}
          setServiceQuantity={setServiceQuantity}
          servicePrice={servicePrice}
          setServicePrice={setServicePrice}
          addServiceToProject={addServiceToProject}
          removeServiceFromProject={removeServiceFromProject}
          isPaymentDialogOpen={isPaymentDialogOpen}
          setIsPaymentDialogOpen={setIsPaymentDialogOpen}
          paymentServiceId={paymentServiceId}
          setPaymentServiceId={setPaymentServiceId}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          paymentDescription={paymentDescription}
          setPaymentDescription={setPaymentDescription}
          registerPayment={registerPayment}
        />
      </TabsContent>
    </Tabs>
  )
}
