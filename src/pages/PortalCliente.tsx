import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Calendar, MapPin, CheckSquare, Image, ClipboardList,
  FileText, DollarSign, Send, Check, Loader2, CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePortalCliente } from '@/hooks/usePortalCliente';

export default function PortalCliente() {
  const { token } = useParams<{ token: string }>();
  const portal = usePortalCliente(token);

  if (portal.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (portal.notFound || !portal.project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Projeto não encontrado</h2>
            <p className="text-muted-foreground">O link pode estar incorreto ou o projeto foi removido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = portal.settings?.primary_color || '#5A7D7C';
  const businessName = portal.settings?.business_name || 'Beauty Pro';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b py-6" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-3">
            {portal.settings?.logo_url ? (
              <img src={portal.settings.logo_url} alt={businessName} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="font-poppins font-bold text-xl" style={{ color: primaryColor }}>{businessName}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{portal.project.name}</CardTitle>
            <div className="flex items-center justify-center gap-4 text-muted-foreground mt-2">
              {portal.project.event_type && <Badge variant="outline">{portal.project.event_type}</Badge>}
              {portal.project.event_date && (
                <span className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(portal.project.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              )}
              {portal.project.event_location && (
                <span className="flex items-center gap-1 text-sm">
                  <MapPin className="h-4 w-4" />
                  {portal.project.event_location}
                </span>
              )}
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="checklist" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="checklist" className="text-xs sm:text-sm">
              <CheckSquare className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Checklist</span>
            </TabsTrigger>
            <TabsTrigger value="moodboard" className="text-xs sm:text-sm">
              <Image className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Moodboard</span>
            </TabsTrigger>
            <TabsTrigger value="briefing" className="text-xs sm:text-sm">
              <ClipboardList className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Briefing</span>
            </TabsTrigger>
            <TabsTrigger value="contrato" className="text-xs sm:text-sm">
              <FileText className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Contrato</span>
            </TabsTrigger>
            <TabsTrigger value="pagamento" className="text-xs sm:text-sm">
              <DollarSign className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Pagamento</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklist">
            <Card>
              <CardHeader>
                <CardTitle>Suas Tarefas</CardTitle>
                <CardDescription>Acompanhe e complete suas tarefas</CardDescription>
              </CardHeader>
              <CardContent>
                {portal.tasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma tarefa disponível ainda</p>
                ) : (
                  <div className="space-y-3">
                    {portal.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-4 border rounded-lg">
                        <Checkbox
                          checked={task.is_completed}
                          onCheckedChange={(checked) => {
                            if (task.visibility === 'client') portal.toggleClientTask(task.id, checked as boolean);
                          }}
                          disabled={task.visibility !== 'client'}
                        />
                        <span className={task.is_completed ? 'line-through text-muted-foreground' : ''}>{task.title}</span>
                        {task.is_completed && <Check className="h-4 w-4 text-green-500 ml-auto" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moodboard">
            <Card>
              <CardHeader>
                <CardTitle>Moodboard</CardTitle>
                <CardDescription>Referências visuais para o seu look</CardDescription>
              </CardHeader>
              <CardContent>
                {portal.moodboard.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma imagem adicionada ainda</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portal.moodboard.map((img) => (
                      <div key={img.id} className="relative">
                        <img src={img.image_url} alt={img.caption || 'Referência'} className="w-full aspect-square object-cover rounded-lg" />
                        {img.caption && <p className="text-sm text-muted-foreground mt-1 text-center">{img.caption}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="briefing">
            <Card>
              <CardHeader>
                <CardTitle>Questionário de Briefing</CardTitle>
                <CardDescription>
                  {portal.briefing?.is_submitted ? 'Suas respostas foram enviadas' : 'Responda as perguntas abaixo para personalizarmos seu atendimento'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!portal.briefing ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum questionário disponível</p>
                ) : portal.briefing.is_submitted ? (
                  <div className="space-y-4">
                    {portal.briefing.questions.map((q) => (
                      <div key={q.id} className="p-4 bg-muted/50 rounded-lg">
                        <p className="font-medium mb-1">{q.question}</p>
                        <p className="text-muted-foreground">{portal.briefing!.answers[q.id] || 'Não respondido'}</p>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5" /><span>Respostas enviadas com sucesso!</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {portal.briefing.questions.map((q) => (
                      <div key={q.id} className="space-y-2">
                        <label className="font-medium">{q.question}</label>
                        <Textarea
                          value={portal.briefingAnswers[q.id] || ''}
                          onChange={(e) => portal.setBriefingAnswers({ ...portal.briefingAnswers, [q.id]: e.target.value })}
                          placeholder="Sua resposta..."
                          rows={2}
                        />
                      </div>
                    ))}
                    <Button onClick={portal.submitBriefing} className="w-full">
                      <Send className="h-4 w-4 mr-2" />Enviar Respostas
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contrato">
            <Card>
              <CardHeader>
                <CardTitle>Contrato</CardTitle>
                <CardDescription>Visualize e assine seu contrato</CardDescription>
              </CardHeader>
              <CardContent>
                {portal.contracts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum contrato disponível</p>
                ) : (
                  <div className="space-y-4">
                    {portal.contracts.map((contract) => (
                      <div key={contract.id} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">{contract.title}</h3>
                          <Badge variant={contract.status === 'signed' ? 'default' : 'secondary'}>
                            {contract.status === 'signed' ? 'Assinado' : 'Pendente'}
                          </Badge>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg">{contract.content}</pre>
                        </div>
                        {contract.status !== 'signed' && <Button className="w-full mt-4">Assinar Contrato</Button>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagamento">
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos</CardTitle>
                <CardDescription>Visualize e pague suas faturas</CardDescription>
              </CardHeader>
              <CardContent>
                {portal.invoices.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma fatura disponível</p>
                ) : (
                  <div className="space-y-4">
                    {portal.invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-semibold text-lg">R$ {Number(invoice.amount).toFixed(2)}</p>
                          {invoice.description && <p className="text-sm text-muted-foreground">{invoice.description}</p>}
                          {invoice.due_date && (
                            <p className="text-xs text-muted-foreground">Vence: {format(new Date(invoice.due_date), 'dd/MM/yyyy')}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                            {invoice.status === 'paid' ? 'Pago' : invoice.status === 'overdue' ? 'Vencido' : 'Pendente'}
                          </Badge>
                          {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                            <Button size="sm" className="mt-2" onClick={() => portal.handlePayment(invoice)} disabled={portal.payingInvoiceId === invoice.id}>
                              {portal.payingInvoiceId === invoice.id ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</>
                              ) : (
                                <><CreditCard className="h-4 w-4 mr-2" />Pagar com Mercado Pago</>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Portal exclusivo • {businessName}</p>
          {portal.settings?.instagram && <p className="mt-1">Instagram: {portal.settings.instagram}</p>}
        </footer>
      </main>
    </div>
  );
}
