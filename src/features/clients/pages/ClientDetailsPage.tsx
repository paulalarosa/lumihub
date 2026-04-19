import SEOHead from '@/components/seo/SEOHead'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { format } from 'date-fns/format'
import { ptBR } from 'date-fns/locale'
import { RecordDialog } from '@/features/clients/components/RecordDialog'
import { useClientDetails } from '../hooks/useClientDetails'
import {
  ArrowLeft,
  User,
  Download,
  Mail,
  Phone,
  Instagram,
  Calendar,
  FileText,
  Sparkles,
  Trash2,
  FolderOpen,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PageLoader'
import { EmptyState } from '@/components/ui/empty-state'
import { useState } from 'react'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { NewProjectWizard } from '@/features/projects/components/NewProjectWizard'
import { useQueryClient } from '@tanstack/react-query'

export default function ClientDetailsPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const {
    client,
    records,
    loadingData,
    handleExportPDF,
    deleteRecord,
    fetchData,
  } = useClientDetails(id)
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false)

  const { data: clientProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['client-projects', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, event_type, event_date, status, total_budget')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!id,
  })

  if (loadingData) {
    return <PageLoader />
  }

  if (!client) return null

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black">
      <SEOHead title="Detalhes da Cliente" noindex={true} />
      {}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/clientes">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white hover:text-black rounded-none"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 border border-white flex items-center justify-center bg-black">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl text-white tracking-tight uppercase">
                    {client.name}
                  </h1>
                  <div className="text-[10px] text-gray-500 uppercase tracking-[0.3em]"></div>
                </div>
              </div>
            </div>

            {}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/50 text-white hover:bg-white hover:text-black rounded-none uppercase text-xs tracking-widest font-mono"
                onClick={handleExportPDF}
              >
                <Download className="w-3 h-3 mr-2" />
                Ficha Técnica
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-28 pb-12">
        <Tabs defaultValue="historico" className="space-y-8">
          <TabsList className="bg-black border border-white/20 p-0 rounded-none w-full max-w-xl mx-auto grid grid-cols-3">
            <TabsTrigger
              value="dados"
              className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 font-mono text-xs uppercase tracking-widest rounded-none h-10 transition-all"
            >
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 font-mono text-xs uppercase tracking-widest rounded-none h-10 transition-all"
            >
              Prontuário
            </TabsTrigger>
            <TabsTrigger
              value="projetos"
              className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 font-mono text-xs uppercase tracking-widest rounded-none h-10 transition-all"
            >
              Projetos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="bg-black border border-white/20 p-8 rounded-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className="p-2 border border-white/20 bg-white/5">
                        <Mail className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                          Email
                        </p>
                        <p className="text-white font-mono text-sm">
                          {client.email || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-2 border border-white/20 bg-white/5">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                          Telefone
                        </p>
                        <p className="text-white font-mono text-sm">
                          {client.phone || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-2 border border-white/20 bg-white/5">
                        <Instagram className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                          Instagram
                        </p>
                        <p className="text-white font-mono text-sm">
                          {client.instagram || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className="p-2 border border-white/20 bg-white/5">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                          Cliente Desde
                        </p>
                        <p className="text-white font-mono text-sm">
                          {client.created_at
                            ? format(
                                new Date(client.created_at),
                                'dd.MM.yyyy',
                                { locale: ptBR },
                              )
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {client.notes && (
                      <div className="flex items-start gap-4">
                        <div className="p-2 border border-white/20 bg-white/5">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                            Observações
                          </p>
                          <p className="text-gray-300 font-mono text-xs leading-relaxed whitespace-pre-wrap border-l border-white/20 pl-4">
                            {client.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="historico" className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-serif text-white uppercase tracking-tight">
                  Timeline
                </h2>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                  Procedimentos & Evolução
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsRecordDialogOpen(true)}
                  className="bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest"
                >
                  Novo Registro
                </Button>
                <RecordDialog
                  open={isRecordDialogOpen}
                  onOpenChange={setIsRecordDialogOpen}
                  clientId={client.id}
                  onSuccess={fetchData}
                />
              </div>
            </div>

            <div className="space-y-0 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[1px] before:bg-white/20">
              {records.length === 0 ? (
                <div className="ml-16 py-12">
                  <EmptyState
                    icon={Sparkles}
                    title="SEM REGISTROS"
                    description="O histórico deste paciente está vazio."
                    className="bg-black border border-white/10"
                  />
                </div>
              ) : (
                records.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-16 pb-12 group last:pb-0"
                  >
                    {}
                    <div className="absolute left-[15px] top-6 w-[9px] h-[9px] bg-black border border-white z-10 group-hover:bg-white transition-colors" />

                    <Card className="bg-black border border-white/20 rounded-none hover:bg-white hover:text-black group-hover:border-white transition-all duration-300">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-white text-black px-2 py-0.5 text-[10px] font-mono uppercase font-bold border border-white group-hover:bg-black group-hover:text-white">
                                {record.service_name}
                              </div>
                              <span className="text-gray-500 group-hover:text-black/60 text-xs font-mono">
                                {format(new Date(record.created_at), 'HH:mm')} •
                                ID.{record.id.substring(0, 4)}
                              </span>
                            </div>
                            <h3 className="text-xl font-serif">
                              {record.date
                                ? format(
                                    new Date(record.date),
                                    "dd 'de' MMMM, yyyy",
                                    { locale: ptBR },
                                  )
                                : 'Data inválida'}
                            </h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-red-500 hover:bg-transparent rounded-none -mr-2"
                            onClick={() => deleteRecord(record.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {record.notes && (
                          <p className="text-gray-400 group-hover:text-black/80 font-mono text-xs leading-relaxed mb-6 pl-4 border-l border-white/20 group-hover:border-black/20">
                            {record.notes}
                          </p>
                        )}

                        {record.photos && record.photos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {record.photos.map((photo, i) => (
                              <div
                                key={i}
                                className="aspect-square border border-white/10 relative group/photo overflow-hidden"
                              >
                                <OptimizedImage
                                  src={photo}
                                  alt="Tratamento"
                                  className="w-full h-full object-cover grayscale group-hover/photo:grayscale-0 transition-all duration-500"
                                />
                                <a
                                  href={photo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute inset-0 bg-black/50 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center text-white text-[10px] uppercase font-mono tracking-widest"
                                >
                                  Ver Imagem
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="projetos" className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-serif text-white uppercase tracking-tight">
                  Projetos
                </h2>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                  Eventos & Trabalhos
                </p>
              </div>
              <NewProjectWizard
                preselectedClientId={id}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['client-projects', id] })}
                trigger={
                  <Button className="bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                    <Plus className="w-3 h-3 mr-2" />
                    Novo Projeto
                  </Button>
                }
              />
            </div>

            {projectsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : clientProjects.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="SEM PROJETOS"
                description="Crie o primeiro projeto para esta cliente."
                className="bg-black border border-white/10"
              />
            ) : (
              <div className="border border-white/10">
                <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 border-b border-white/10 bg-white/[0.02]">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">Projeto</span>
                  <span className="font-mono text-[8px] uppercase tracking-widest text-white/30 text-right w-28">Tipo</span>
                  <span className="font-mono text-[8px] uppercase tracking-widest text-white/30 text-right w-28">Data</span>
                  <span className="font-mono text-[8px] uppercase tracking-widest text-white/30 text-right w-20">Status</span>
                </div>
                {clientProjects.map((project, i) => {
                  const d = project.event_date ? new Date(project.event_date + 'T12:00:00') : null
                  const isValid = d && !isNaN(d.getTime())
                  return (
                    <Link
                      key={project.id}
                      to={`/projetos/${project.id}`}
                      className={`flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto] gap-3 md:gap-4 px-5 py-4 border-b border-white/10 hover:bg-white hover:text-black transition-all duration-150 group ${i === clientProjects.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${project.status === 'active' ? 'bg-white group-hover:bg-black' : 'bg-white/20 group-hover:bg-black/30'}`} />
                        <p className="font-serif text-sm uppercase tracking-wide truncate text-white group-hover:text-black">
                          {project.name}
                        </p>
                      </div>
                      <div className="flex items-center md:justify-end md:w-28">
                        {project.event_type ? (
                          <span className="border border-white/20 group-hover:border-black/20 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-white/50 group-hover:text-black/50">
                            {project.event_type}
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] text-white/20 group-hover:text-black/20">—</span>
                        )}
                      </div>
                      <div className="flex items-center md:justify-end md:w-28">
                        <p className="font-mono text-[10px] text-white/60 group-hover:text-black/60">
                          {isValid ? format(d, 'dd MMM yyyy', { locale: ptBR }) : '—'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between md:justify-end md:w-20 gap-3">
                        <span className={`border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest ${project.status === 'active' ? 'border-white/50 text-white/70 group-hover:border-black/40 group-hover:text-black/60' : 'border-white/20 text-white/30 group-hover:border-black/20 group-hover:text-black/30'}`}>
                          {project.status === 'active' ? 'Ativo' : project.status === 'completed' ? 'Concluído' : 'Arquivado'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-black/40 flex-shrink-0" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
