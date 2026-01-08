import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  User,
  Palette,
  Package,
  CreditCard,
  Save,
  Plus,
  Trash2,
  Edit,
  GripVertical,
  Wallet,
  Building2,
  QrCode,
  Smartphone,
  Link2
} from 'lucide-react';
import IntegrationsTab from '@/components/settings/IntegrationsTab';
import { useToast } from '@/hooks/use-toast';

interface ProfessionalSettings {
  id: string;
  business_name: string | null;
  logo_url: string | null;
  primary_color: string;
  phone: string | null;
  instagram: string | null;
  website: string | null;
  bio: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number | null;
  is_active: boolean;
  sort_order: number;
}

interface PaymentAccount {
  id: string;
  pix_key_type: string | null;
  pix_key: string | null;
  bank_name: string | null;
  bank_code: string | null;
  account_type: string | null;
  agency: string | null;
  account_number: string | null;
  account_holder_name: string | null;
  account_holder_document: string | null;
  digital_wallet_type: string | null;
  digital_wallet_account: string | null;
  preferred_method: string;
}

export default function Configuracoes() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<ProfessionalSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  
  // Form state
  const [businessName, setBusinessName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#5A7D7C');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  
  // Service form
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  
  // Payment account form
  const [pixKeyType, setPixKeyType] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountType, setAccountType] = useState('');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountHolderDocument, setAccountHolderDocument] = useState('');
  const [digitalWalletType, setDigitalWalletType] = useState('');
  const [digitalWalletAccount, setDigitalWalletAccount] = useState('');
  const [preferredMethod, setPreferredMethod] = useState('pix');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoadingData(true);
    
    // Fetch settings
    const { data: settingsData } = await supabase
      .from('professional_settings')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (settingsData) {
      setSettings(settingsData);
      setBusinessName(settingsData.business_name || '');
      setPrimaryColor(settingsData.primary_color || '#5A7D7C');
      setPhone(settingsData.phone || '');
      setInstagram(settingsData.instagram || '');
      setWebsite(settingsData.website || '');
      setBio(settingsData.bio || '');
    }

    // Fetch services
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user!.id)
      .order('sort_order');
    
    setServices(servicesData || []);
    
    // Fetch payment account
    const { data: paymentData } = await supabase
      .from('payment_accounts')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();
    
    if (paymentData) {
      setPaymentAccount(paymentData);
      setPixKeyType(paymentData.pix_key_type || '');
      setPixKey(paymentData.pix_key || '');
      setBankName(paymentData.bank_name || '');
      setBankCode(paymentData.bank_code || '');
      setAccountType(paymentData.account_type || '');
      setAgency(paymentData.agency || '');
      setAccountNumber(paymentData.account_number || '');
      setAccountHolderName(paymentData.account_holder_name || '');
      setAccountHolderDocument(paymentData.account_holder_document || '');
      setDigitalWalletType(paymentData.digital_wallet_type || '');
      setDigitalWalletAccount(paymentData.digital_wallet_account || '');
      setPreferredMethod(paymentData.preferred_method || 'pix');
    }
    
    setLoadingData(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from('professional_settings')
      .upsert({
        user_id: user!.id,
        business_name: businessName.trim() || null,
        primary_color: primaryColor,
        phone: phone.trim() || null,
        instagram: instagram.trim() || null,
        website: website.trim() || null,
        bio: bio.trim() || null
      }, { onConflict: 'user_id' });

    if (error) {
      toast({ title: "Erro ao salvar configurações", variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas!" });
    }
    setSaving(false);
  };

  const resetServiceForm = () => {
    setServiceName('');
    setServiceDescription('');
    setServicePrice('');
    setServiceDuration('');
    setEditingService(null);
  };

  const openEditService = (service: Service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceDescription(service.description || '');
    setServicePrice(service.price?.toString() || '');
    setServiceDuration(service.duration_minutes?.toString() || '');
    setIsServiceDialogOpen(true);
  };

  const saveService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceName.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    const serviceData = {
      name: serviceName.trim(),
      description: serviceDescription.trim() || null,
      price: servicePrice ? parseFloat(servicePrice) : null,
      duration_minutes: serviceDuration ? parseInt(serviceDuration) : null,
      user_id: user!.id,
      sort_order: editingService?.sort_order || services.length
    };

    if (editingService) {
      const { error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', editingService.id);

      if (error) {
        toast({ title: "Erro ao atualizar serviço", variant: "destructive" });
      } else {
        toast({ title: "Serviço atualizado!" });
        setIsServiceDialogOpen(false);
        resetServiceForm();
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('services')
        .insert(serviceData);

      if (error) {
        toast({ title: "Erro ao criar serviço", variant: "destructive" });
      } else {
        toast({ title: "Serviço adicionado!" });
        setIsServiceDialogOpen(false);
        resetServiceForm();
        fetchData();
      }
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    
    const { error } = await supabase.from('services').delete().eq('id', id);
    
    if (!error) {
      toast({ title: "Serviço excluído!" });
      fetchData();
    }
  };

  const toggleServiceActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('services')
      .update({ is_active: isActive })
      .eq('id', id);
    
    if (!error) {
      setServices(services.map(s => s.id === id ? { ...s, is_active: isActive } : s));
    }
  };

  const savePaymentAccount = async () => {
    setSavingPayment(true);
    
    const paymentData = {
      user_id: user!.id,
      pix_key_type: pixKeyType || null,
      pix_key: pixKey.trim() || null,
      bank_name: bankName.trim() || null,
      bank_code: bankCode.trim() || null,
      account_type: accountType || null,
      agency: agency.trim() || null,
      account_number: accountNumber.trim() || null,
      account_holder_name: accountHolderName.trim() || null,
      account_holder_document: accountHolderDocument.trim() || null,
      digital_wallet_type: digitalWalletType || null,
      digital_wallet_account: digitalWalletAccount.trim() || null,
      preferred_method: preferredMethod
    };

    const { error } = await supabase
      .from('payment_accounts')
      .upsert(paymentData, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving payment account:', error);
      toast({ title: "Erro ao salvar dados bancários", variant: "destructive" });
    } else {
      toast({ title: "Dados bancários salvos!" });
    }
    setSavingPayment(false);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <span className="font-poppins font-bold text-xl text-foreground">
                Configurações
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="perfil">
          <TabsList className="mb-6">
            <TabsTrigger value="perfil" className="gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="marca" className="gap-2">
              <Palette className="h-4 w-4" />
              Marca
            </TabsTrigger>
            <TabsTrigger value="servicos" className="gap-2">
              <Package className="h-4 w-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-2">
              <Wallet className="h-4 w-4" />
              Recebimentos
            </TabsTrigger>
            <TabsTrigger value="integracoes" className="gap-2">
              <Link2 className="h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="plano" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Plano
            </TabsTrigger>
          </TabsList>

          {/* PERFIL */}
          <TabsContent value="perfil">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>Configure suas informações de contato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Nome do Negócio</Label>
                  <Input 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex: Maria Makeup Artist"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone/WhatsApp</Label>
                  <Input 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input 
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@seuperfil"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://seusite.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio / Sobre você</Label>
                  <Textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte um pouco sobre você e seu trabalho..."
                    rows={4}
                  />
                </div>
                <Button onClick={saveSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MARCA */}
          <TabsContent value="marca">
            <Card>
              <CardHeader>
                <CardTitle>Personalização da Marca</CardTitle>
                <CardDescription>
                  Personalize a aparência do Portal da Cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Cor Principal</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <Input 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Esta cor será usada no portal da cliente
                  </p>
                </div>

                <div className="p-6 rounded-lg border" style={{ backgroundColor: `${primaryColor}10` }}>
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold" style={{ color: primaryColor }}>
                      {businessName || 'Seu Negócio'}
                    </span>
                  </div>
                </div>

                <Button onClick={saveSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SERVIÇOS */}
          <TabsContent value="servicos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cardápio de Serviços</CardTitle>
                  <CardDescription>
                    Cadastre seus serviços e preços
                  </CardDescription>
                </div>
                <Dialog open={isServiceDialogOpen} onOpenChange={(open) => {
                  setIsServiceDialogOpen(open);
                  if (!open) resetServiceForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Serviço
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={saveService} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome do Serviço *</Label>
                        <Input 
                          value={serviceName}
                          onChange={(e) => setServiceName(e.target.value)}
                          placeholder="Ex: Maquiagem para Noiva"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea 
                          value={serviceDescription}
                          onChange={(e) => setServiceDescription(e.target.value)}
                          placeholder="Descreva o serviço..."
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Preço (R$)</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={servicePrice}
                            onChange={(e) => setServicePrice(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duração (min)</Label>
                          <Input 
                            type="number"
                            value={serviceDuration}
                            onChange={(e) => setServiceDuration(e.target.value)}
                            placeholder="60"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full">
                        {editingService ? 'Salvar Alterações' : 'Adicionar Serviço'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum serviço cadastrado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div 
                        key={service.id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${!service.is_active ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {service.price && <span>R$ {service.price.toFixed(2)}</span>}
                              {service.duration_minutes && <span>• {service.duration_minutes} min</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={service.is_active}
                            onCheckedChange={(checked) => toggleServiceActive(service.id, checked)}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditService(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteService(service.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FINANCEIRO / RECEBIMENTOS */}
          <TabsContent value="financeiro">
            <div className="space-y-6">
              {/* PIX */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Chave PIX
                  </CardTitle>
                  <CardDescription>
                    Configure sua chave PIX para receber pagamentos instantâneos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Chave</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={pixKeyType}
                        onChange={(e) => setPixKeyType(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Chave Aleatória</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Chave PIX</Label>
                      <Input 
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        placeholder={
                          pixKeyType === 'cpf' ? '000.000.000-00' :
                          pixKeyType === 'cnpj' ? '00.000.000/0000-00' :
                          pixKeyType === 'email' ? 'email@exemplo.com' :
                          pixKeyType === 'phone' ? '+55 11 99999-9999' :
                          'Cole sua chave aleatória'
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conta Bancária */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Conta Bancária
                  </CardTitle>
                  <CardDescription>
                    Dados para transferência bancária (TED/DOC)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Banco</Label>
                      <Input 
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Ex: Banco do Brasil, Itaú, Nubank..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Código do Banco</Label>
                      <Input 
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        placeholder="Ex: 001, 341, 260..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Conta</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        <option value="checking">Conta Corrente</option>
                        <option value="savings">Conta Poupança</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Agência</Label>
                      <Input 
                        value={agency}
                        onChange={(e) => setAgency(e.target.value)}
                        placeholder="0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Conta (com dígito)</Label>
                      <Input 
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="00000-0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Titular</Label>
                      <Input 
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="Nome completo conforme conta"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF/CNPJ do Titular</Label>
                      <Input 
                        value={accountHolderDocument}
                        onChange={(e) => setAccountHolderDocument(e.target.value)}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conta Digital */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Conta Digital
                  </CardTitle>
                  <CardDescription>
                    Configure sua conta digital para recebimentos (integração futura)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plataforma</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={digitalWalletType}
                        onChange={(e) => setDigitalWalletType(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        <option value="mercado_pago">Mercado Pago</option>
                        <option value="pagbank">PagBank</option>
                        <option value="picpay">PicPay</option>
                        <option value="nubank">Nubank</option>
                        <option value="inter">Banco Inter</option>
                        <option value="c6">C6 Bank</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail ou ID da Conta</Label>
                      <Input 
                        value={digitalWalletAccount}
                        onChange={(e) => setDigitalWalletAccount(e.target.value)}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferência de Recebimento */}
              <Card>
                <CardHeader>
                  <CardTitle>Método Preferido de Recebimento</CardTitle>
                  <CardDescription>
                    Escolha como você prefere receber os pagamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'pix', label: 'PIX', icon: QrCode },
                      { value: 'bank', label: 'Conta Bancária', icon: Building2 },
                      { value: 'digital_wallet', label: 'Conta Digital', icon: Smartphone }
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPreferredMethod(method.value)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                          preferredMethod === method.value 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <method.icon className="h-5 w-5" />
                        {method.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button onClick={savePaymentAccount} disabled={savingPayment} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {savingPayment ? 'Salvando...' : 'Salvar Dados Bancários'}
              </Button>
            </div>
          </TabsContent>

          {/* INTEGRAÇÕES */}
          <TabsContent value="integracoes">
            <IntegrationsTab />
          </TabsContent>

          {/* PLANO */}
          <TabsContent value="plano">
            <Card>
              <CardHeader>
                <CardTitle>Seu Plano</CardTitle>
                <CardDescription>
                  Gerencie sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 border rounded-lg bg-muted/30 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Plano atual</p>
                      <p className="text-2xl font-bold">Gratuito</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Você está usando o plano gratuito com recursos limitados.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Upgrade para desbloquear:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      Clientes ilimitados
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      Portal 100% marca branca
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      Pagamentos integrados
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      Automações de pós-venda
                    </li>
                  </ul>
                  <Link to="/planos">
                    <Button className="w-full mt-4">
                      Ver Planos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
