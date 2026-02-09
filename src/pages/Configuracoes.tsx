import MessageTemplatesSettings from '@/components/settings/MessageTemplatesSettings';
import IntegrationsTab from '@/components/settings/IntegrationsTab';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  User,
  CreditCard,
  Building2,
  Smartphone,
  Save,
  Link2,
  MessageSquare,
  Palette,
  Briefcase,
  ShieldCheck,
  Upload,
  Camera
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Types
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
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form state - Profile/Business
  const [businessName, setBusinessName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#ffffff');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Form state - User
  const [fullName, setFullName] = useState('');

  // Form state - Payment
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
      setFullName(user.user_metadata?.full_name || '');
    }
  }, [user]);

  const fetchData = async () => {
    setLoadingData(true);

    // Fetch professional settings from profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('business_name, bio, phone, avatar_url')
      .eq('id', user!.id)
      .maybeSingle();

    if (profileError) {
      console.warn("Profile fetch error:", profileError);
    }

    if (profileData) {
      setBusinessName(profileData.business_name || '');
      setPhone(profileData.phone || '');
      setBio(profileData.bio || '');
      setLogoUrl(profileData.avatar_url);

      // Note: primary_color, instagram, website are not in profiles table yet
      // defaulting to empty/default for now
    }

    // Payment accounts table logic removed due to missing table
    // TODO: Restore when payment_accounts table is created
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // 1. Save Professional Settings to Profiles
      const { error: settingsError } = await supabase
        .from('profiles')
        .update({
          business_name: businessName.trim() || null,
          phone: phone.trim() || null,
          bio: bio.trim() || null,
          avatar_url: logoUrl
          // primary_color, instagram, website not supported in schema yet
        })
        .eq('id', user!.id);

      if (settingsError) throw settingsError;

      // 2. Payment Accounts logic removed
      // TODO: Restore when table exists

      // 3. Update User Metadata (Name) - matches profiles.full_name usually but kept separate here
      if (fullName !== user?.user_metadata?.full_name) {
        const { error: userError } = await supabase.auth.updateUser({
          data: { full_name: fullName }
        });
        if (userError) throw userError;
      }

      toast({ title: "Configurações salvas", description: "Todas as alterações foram aplicadas." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Save error:', error);
      toast({ title: "Erro ao salvar", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingLogo(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars') // Using existing avatar bucket for simplicity
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: "Erro no upload", description: message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-none hover:bg-muted text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-serif font-bold text-foreground tracking-tight">
              SYSTEM CONFIG
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Control Panel // v2.0
            </p>
          </div>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-widest px-6"
        >
          {saving ? 'PROCESSING...' : 'SAVE_CHANGES'}
        </Button>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="perfil" className="w-full space-y-8">
          <TabsList className="w-full flex justify-start border-b border-border bg-transparent p-0 h-auto rounded-none gap-8 overflow-x-auto">
            {['perfil', 'negocio', 'banco', 'automacao', 'integracoes', 'assinatura'].map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors px-2 py-4 font-mono text-xs uppercase tracking-widest"
              >
                {tab === 'negocio' ? 'NEGÓCIO' : tab === 'banco' ? 'DADOS BANCÁRIOS' : tab === 'automacao' ? 'AUTOMAÇÃO' : tab === 'integracoes' ? 'INTEGRAÇÕES' : tab.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 1. PERFIL */}
          <TabsContent value="perfil" className="space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Profile Photo */}
              <Card className="col-span-1 border-border bg-card rounded-none shadow-none">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Avatar</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Avatar className="h-40 w-40 rounded-none border border-border mb-6">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="rounded-none font-mono text-4xl bg-muted text-muted-foreground">
                      {user?.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-muted-foreground font-mono text-center mb-4">
                    SQUARE RATIO <br /> 500x500px RECOMENDADO
                  </p>
                </CardContent>
              </Card>

              {/* Personal Data */}
              <Card className="col-span-2 border-border bg-card rounded-none shadow-none">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Dados Pessoais</CardTitle>
                  <CardDescription className="font-mono text-xs uppercase tracking-widest">Credenciais de Acesso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Nome Completo</Label>
                    <Input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="rounded-none border-border bg-background focus-visible:ring-0 focus-visible:border-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">E-mail (ID)</Label>
                    <Input
                      value={user?.email}
                      disabled
                      className="rounded-none border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <div className="pt-4 border-t border-border">
                    <Button variant="outline" className="rounded-none w-full font-mono text-xs uppercase tracking-widest border-border hover:bg-muted">
                      Redefinir Senha
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 2. NEGOCIO */}
          <TabsContent value="negocio" className="space-y-6 focus-visible:outline-none">
            <Card className="border-border bg-card rounded-none shadow-none">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Identidade Visual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Logo Upload */}
                <div className="flex items-start gap-8">
                  <div className="w-32 h-32 border border-dashed border-border flex items-center justify-center bg-muted/20 relative group">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">Upload</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-muted-foreground">Nome do Negócio</Label>
                      <Input
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        className="rounded-none border-border bg-background font-serif text-lg"
                        placeholder="EX: SILVA BEAUTY STUDIO"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-muted-foreground">Cor da Marca (HEX)</Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 border border-border" style={{ backgroundColor: primaryColor }} />
                        <Input
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="rounded-none border-border bg-background font-mono"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Instagram</Label>
                    <Input value={instagram} onChange={e => setInstagram(e.target.value)} className="rounded-none border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Website</Label>
                    <Input value={website} onChange={e => setWebsite(e.target.value)} className="rounded-none border-border bg-background" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Bio / Sobre</Label>
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} className="rounded-none border-border bg-background min-h-[100px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. DADOS BANCARIOS */}
          <TabsContent value="banco" className="space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PIX */}
              <Card className="border-border bg-card rounded-none shadow-none">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Chave PIX</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase">Principal método de recebimento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Tipo</Label>
                    <select
                      className="w-full h-10 px-3 rounded-none border border-border bg-background text-foreground font-mono text-sm uppercase focus:border-foreground appearance-none"
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value)}
                    >
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
                    <Input
                      value={pixKey}
                      onChange={e => setPixKey(e.target.value)}
                      className="rounded-none border-border bg-background"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* DIGITAL WALLET */}
              <Card className="border-border bg-card rounded-none shadow-none">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Conta Digital</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase">Integração Gateway</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Plataforma</Label>
                    <select
                      className="w-full h-10 px-3 rounded-none border border-border bg-background text-foreground font-mono text-sm uppercase focus:border-foreground appearance-none"
                      value={digitalWalletType}
                      onChange={(e) => setDigitalWalletType(e.target.value)}
                    >
                      <option value="">SELECIONE...</option>
                      <option value="mercado_pago">MERCADO PAGO</option>
                      <option value="pagbank">PAGBANK</option>
                      <option value="nubank">NUBANK</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase text-muted-foreground">Conta / Email</Label>
                    <Input
                      value={digitalWalletAccount}
                      onChange={e => setDigitalWalletAccount(e.target.value)}
                      className="rounded-none border-border bg-background"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* BANK INFO */}
              <Card className="col-span-1 md:col-span-2 border-border bg-card rounded-none shadow-none">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Dados Bancários (TED/DOC)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-muted-foreground">Banco</Label>
                      <Input value={bankName} onChange={e => setBankName(e.target.value)} className="rounded-none border-border bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-muted-foreground">Agência</Label>
                      <Input value={agency} onChange={e => setAgency(e.target.value)} className="rounded-none border-border bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-muted-foreground">Conta</Label>
                      <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="rounded-none border-border bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase text-muted-foreground">Tipo</Label>
                      <select
                        className="w-full h-10 px-3 rounded-none border border-border bg-background text-foreground font-mono text-sm uppercase focus:border-foreground appearance-none"
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                      >
                        <option value="checking">CORRENTE</option>
                        <option value="savings">POUPANÇA</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 4. AUTOMACAO */}
          <TabsContent value="automacao" className="space-y-6 focus-visible:outline-none">
            <MessageTemplatesSettings />
          </TabsContent>

          {/* 5. INTEGRACOES */}
          <TabsContent value="integracoes" className="space-y-6 focus-visible:outline-none">
            <IntegrationsTab />
          </TabsContent>

          {/* 6. ASSINATURA */}
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
                    <span className="inline-block px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 font-mono text-xs uppercase rounded-none">
                      ATIVE
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button variant="outline" className="rounded-none font-mono text-xs uppercase tracking-widest border-border">
                    Gerenciar Assinatura
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
