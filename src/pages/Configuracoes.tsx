import MessageTemplatesSettings from '@/components/settings/MessageTemplatesSettings';
import IntegrationsTab from '@/components/settings/IntegrationsTab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Upload, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';

export default function Configuracoes() {
  const cfg = useConfiguracoes();

  if (cfg.loading || cfg.loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-background px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-none hover:bg-muted text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-serif font-bold text-foreground tracking-tight">SYSTEM CONFIG</h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Control Panel // v2.0</p>
          </div>
        </div>
        <Button onClick={cfg.saveSettings} disabled={cfg.saving}
          className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-widest px-6">
          {cfg.saving ? 'PROCESSING...' : 'SAVE_CHANGES'}
        </Button>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="perfil" className="w-full space-y-8">
          <TabsList className="w-full flex justify-start border-b border-border bg-transparent p-0 h-auto rounded-none gap-8 overflow-x-auto">
            {['perfil', 'negocio', 'banco', 'automacao', 'integracoes', 'assinatura'].map(tab => (
              <TabsTrigger key={tab} value={tab}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors px-2 py-4 font-mono text-xs uppercase tracking-widest">
                {tab === 'negocio' ? 'NEGÓCIO' : tab === 'banco' ? 'DADOS BANCÁRIOS' : tab === 'automacao' ? 'AUTOMAÇÃO' : tab === 'integracoes' ? 'INTEGRAÇÕES' : tab.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="perfil" className="space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="col-span-1 border-border bg-card rounded-none shadow-none">
                <CardHeader><CardTitle className="font-serif text-lg">Avatar</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Avatar className="h-40 w-40 rounded-none border border-border mb-6">
                    <AvatarImage src={cfg.user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="rounded-none font-mono text-4xl bg-muted text-muted-foreground">
                      {cfg.user?.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-muted-foreground font-mono text-center mb-4">SQUARE RATIO <br /> 500x500px RECOMENDADO</p>
                </CardContent>
              </Card>

              <Card className="col-span-2 border-border bg-card rounded-none shadow-none">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Dados Pessoais</CardTitle>
                  <CardDescription className="font-mono text-xs uppercase tracking-widest">Credenciais de Acesso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Nome Completo</Label>
                    <Input value={cfg.fullName} onChange={e => cfg.setFullName(e.target.value)}
                      className="rounded-none border-border bg-background focus-visible:ring-0 focus-visible:border-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">E-mail (ID)</Label>
                    <Input value={cfg.user?.email} disabled className="rounded-none border-border bg-muted/50 text-muted-foreground cursor-not-allowed" />
                  </div>
                  <div className="pt-4 border-t border-border">
                    <Button variant="outline" className="rounded-none w-full font-mono text-xs uppercase tracking-widest border-border hover:bg-muted">Redefinir Senha</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="negocio" className="space-y-6 focus-visible:outline-none">
            <Card className="border-border bg-card rounded-none shadow-none">
              <CardHeader><CardTitle className="font-serif text-lg">Identidade Visual</CardTitle></CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-start gap-8">
                  <div className="w-32 h-32 border border-dashed border-border flex items-center justify-center bg-muted/20 relative group">
                    {cfg.logoUrl ? (
                      <img src={cfg.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">Upload</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={cfg.handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {cfg.uploadingLogo && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-muted-foreground">Nome do Negócio</Label>
                      <Input value={cfg.businessName} onChange={e => cfg.setBusinessName(e.target.value)}
                        className="rounded-none border-border bg-background font-serif text-lg" placeholder="EX: SILVA BEAUTY STUDIO" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-muted-foreground">Cor da Marca (HEX)</Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 border border-border" style={{ backgroundColor: cfg.primaryColor }} />
                        <Input value={cfg.primaryColor} onChange={e => cfg.setPrimaryColor(e.target.value)}
                          className="rounded-none border-border bg-background font-mono" placeholder="#000000" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Instagram</Label>
                    <Input value={cfg.instagram} onChange={e => cfg.setInstagram(e.target.value)} className="rounded-none border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Website</Label>
                    <Input value={cfg.website} onChange={e => cfg.setWebsite(e.target.value)} className="rounded-none border-border bg-background" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Bio / Sobre</Label>
                    <Textarea value={cfg.bio} onChange={e => cfg.setBio(e.target.value)} className="rounded-none border-border bg-background min-h-[100px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banco" className="space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border bg-card rounded-none shadow-none">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Chave PIX</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase">Principal método de recebimento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Tipo</Label>
                    <select className="w-full h-10 px-3 rounded-none border border-border bg-background text-foreground font-mono text-sm uppercase focus:border-foreground appearance-none"
                      value={cfg.pixKeyType} onChange={e => cfg.setPixKeyType(e.target.value)}>
                      <option value="">SELECIONE...</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-MAIL</option>
                      <option value="phone">TELEFONE</option>
                      <option value="random">ALEATÓRIA</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Chave</Label>
                    <Input value={cfg.pixKey} onChange={e => cfg.setPixKey(e.target.value)} className="rounded-none border-border bg-background" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card rounded-none shadow-none">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Conta Digital</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase">Integração Gateway</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Plataforma</Label>
                    <select className="w-full h-10 px-3 rounded-none border border-border bg-background text-foreground font-mono text-sm uppercase focus:border-foreground appearance-none"
                      value={cfg.digitalWalletType} onChange={e => cfg.setDigitalWalletType(e.target.value)}>
                      <option value="">SELECIONE...</option>
                      <option value="mercado_pago">MERCADO PAGO</option>
                      <option value="pagbank">PAGBANK</option>
                      <option value="nubank">NUBANK</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Conta / Email</Label>
                    <Input value={cfg.digitalWalletAccount} onChange={e => cfg.setDigitalWalletAccount(e.target.value)} className="rounded-none border-border bg-background" />
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1 md:col-span-2 border-border bg-card rounded-none shadow-none">
                <CardHeader><CardTitle className="font-serif text-lg">Dados Bancários (TED/DOC)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-muted-foreground">Banco</Label>
                      <Input value={cfg.bankName} onChange={e => cfg.setBankName(e.target.value)} className="rounded-none border-border bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-muted-foreground">Agência</Label>
                      <Input value={cfg.agency} onChange={e => cfg.setAgency(e.target.value)} className="rounded-none border-border bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-muted-foreground">Conta</Label>
                      <Input value={cfg.accountNumber} onChange={e => cfg.setAccountNumber(e.target.value)} className="rounded-none border-border bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-muted-foreground">Tipo</Label>
                      <select className="w-full h-10 px-3 rounded-none border border-border bg-background text-foreground font-mono text-sm uppercase focus:border-foreground appearance-none"
                        value={cfg.accountType} onChange={e => cfg.setAccountType(e.target.value)}>
                        <option value="checking">CORRENTE</option>
                        <option value="savings">POUPANÇA</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automacao" className="space-y-6 focus-visible:outline-none">
            <MessageTemplatesSettings />
          </TabsContent>

          <TabsContent value="integracoes" className="space-y-6 focus-visible:outline-none">
            <IntegrationsTab />
          </TabsContent>

          <TabsContent value="assinatura" className="space-y-6 focus-visible:outline-none">
            <Card className="border-border bg-card rounded-none shadow-none">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Seu Plano</CardTitle>
                <CardDescription className="font-mono text-xs uppercase tracking-widest">Detalhes da Assinatura</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 border border-border bg-muted/20 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-5 w-5 text-foreground" />
                      <span className="font-serif text-2xl font-bold">PRO</span>
                    </div>
                    <p className="text-muted-foreground text-sm font-mono max-w-md">
                      Acesso total a todas as funcionalidades, suporte prioritário e taxas reduzidas.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground font-mono uppercase mb-1">Status</p>
                    <span className="inline-block px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 font-mono text-xs uppercase rounded-none">ATIVE</span>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button variant="outline" className="rounded-none font-mono text-xs uppercase tracking-widest border-border">Gerenciar Assinatura</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
