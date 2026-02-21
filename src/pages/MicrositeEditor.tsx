<<<<<<< HEAD
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Eye, Save, Upload, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export const MicrositeEditor = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'general' | 'content' | 'images'>('general');

    const { data: microsite, isLoading } = useQuery({
        queryKey: ['my-microsite'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('microsites' as any)
                .select('*')
                .eq('user_id', user?.id)
                .maybeSingle(); // Changed from single() to maybeSingle() to handle null gracefully

            if (error) throw error;
            return (data as any) || createDefaultMicrosite();
        },
        enabled: !!user?.id,
    });

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            // Remove ID if it's new (handled by upsert but good practice to clean)
            const cleanData = { ...data };
            if (!cleanData.user_id) cleanData.user_id = user?.id;

            // Ensure array fields are arrays
            if (!Array.isArray(cleanData.services)) cleanData.services = [];
            if (!Array.isArray(cleanData.portfolio_images)) cleanData.portfolio_images = [];

            const { error } = await supabase.from('microsites' as any).upsert({
                ...cleanData,
                user_id: user?.id,
                updated_at: new Date().toISOString(),
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-microsite'] });
            toast.success('Microsite salvo com sucesso!');
        },
        onError: (error) => {
            toast.error(`Erro ao salvar: ${error.message}`);
        }
    });

    const handleImageUpload = async (file: File, field: string) => {
        try {
            toast.loading('Fazendo upload...');
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${field}-${Date.now()}.${fileExt}`;
            const filePath = `microsites/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public') // Assuming 'public' bucket exists and is public
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('public').getPublicUrl(filePath);

            // Optimistic update
            const updatedSite = { ...microsite, [field]: data.publicUrl };
            saveMutation.mutate(updatedSite);
            toast.dismiss();
        } catch (error: any) {
            toast.dismiss();
            toast.error(`Erro no upload: ${error.message}`);
        }
    };

    const handlePortfolioUpload = async (file: File) => {
        try {
            toast.loading('Fazendo upload para portfolio...');
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-portfolio-${Date.now()}.${fileExt}`;
            const filePath = `microsites/portfolio/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('public').getPublicUrl(filePath);

            const currentImages = microsite.portfolio_images || [];
            const updatedSite = { ...microsite, portfolio_images: [...currentImages, data.publicUrl] };
            saveMutation.mutate(updatedSite);
            toast.dismiss();

        } catch (error: any) {
            toast.dismiss();
            toast.error(`Erro no upload: ${error.message}`);
        }
    }

    if (isLoading) return <div className="p-8 text-white">Carregando editor...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 animate-in fade-in duration-500 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Meu Microsite</h1>
                    <p className="text-neutral-400">Configure sua página pública personalizada</p>
                </div>

                <div className="flex gap-2">
                    {microsite.slug && (
                        <Button variant="outline" asChild className="border-neutral-700 text-white hover:bg-neutral-800">
                            <a href={`/${microsite.slug}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                            </a>
                        </Button>
                    )}
                    <Button
                        onClick={() => saveMutation.mutate(microsite)}
                        disabled={saveMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saveMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Sidebar / Navigation (for larger screens or structure) could go here but using tabs/cards */}

                <div className="lg:col-span-2 space-y-6">
                    {/* BRANDING CARD */}
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader>
                            <CardTitle className="text-white">Identidade & Branding</CardTitle>
                            <CardDescription>Informações principais do seu negócio</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="text-white mb-2 block">Nome do Negócio *</Label>
                                <Input
                                    value={microsite.business_name}
                                    onChange={(e) => {
                                        // Simple slug auto-gen if empty/new
                                        const newName = e.target.value;
                                        const updates: any = { business_name: newName };
                                        if (!microsite.slug && newName) {
                                            updates.slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                        }
                                        // We don't mutate immediately here, just update local 'data' if we were using state
                                        // Since we rely on query data, we should probably set local state or rely on optimistic cache updates.
                                        // NOTE: For this simple implementation, we edit the 'microsite' object directly in the UI but it's immutable from Query.
                                        // We really should have a local state copy. 
                                        // FIX: We will rely on queryClient.setQueryData or similar, but for simplicity let's assume we copy to local state in a real app.
                                        // For now, let's just cheat and trigger mutation on blur or manual save, but inputs need local state to be editable without jitter.
                                        // Due to architectural limits of this snippet, I will modify the `data` in place via queryClient manually or just use a state wrapper.
                                        // Let's wrap in a parent state component logic or just force update via setQueryData.
                                        queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, ...updates }));
                                    }}
                                    className="bg-neutral-800 border-neutral-700 text-white"
                                />
                            </div>

                            <div>
                                <Label className="text-white mb-2 block">URL Personalizada</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-neutral-500 bg-neutral-900/50 p-2 rounded-l border border-neutral-700 border-r-0">khaoskontrol.com.br/</span>
                                    <Input
                                        value={microsite.slug}
                                        onChange={(e) => queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, slug: e.target.value.toLowerCase() }))}
                                        className="bg-neutral-800 border-neutral-700 text-white rounded-l-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-white mb-2 block">Slogan / Tagline</Label>
                                <Input
                                    value={microsite.tagline || ''}
                                    onChange={(e) => queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, tagline: e.target.value }))}
                                    placeholder="Realçando sua beleza natural"
                                    className="bg-neutral-800 border-neutral-700 text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-white mb-2 block">Logo</Label>
                                    <div className="flex items-center gap-4">
                                        {microsite.logo_url && (
                                            <img src={microsite.logo_url} alt="Logo" className="w-16 h-16 rounded-full object-cover border border-neutral-700" />
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(file, 'logo_url');
                                            }}
                                            className="bg-neutral-800 border-neutral-700 text-white text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-white mb-2 block">Capa (Hero Image)</Label>
                                    <div className="flex items-center gap-4">
                                        {microsite.cover_image_url && (
                                            <img src={microsite.cover_image_url} alt="Cover" className="w-24 h-16 rounded object-cover border border-neutral-700" />
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(file, 'cover_image_url');
                                            }}
                                            className="bg-neutral-800 border-neutral-700 text-white text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CONTENT CARD */}
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader>
                            <CardTitle className="text-white">Conteúdo & Portfólio</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="text-white mb-2 block">Sobre Mim</Label>
                                <Textarea
                                    value={microsite.about_text || ''}
                                    onChange={(e) => queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, about_text: e.target.value }))}
                                    rows={6}
                                    placeholder="Conte sua história..."
                                    className="bg-neutral-800 border-neutral-700 text-white"
                                />
                            </div>

                            <div>
                                <Label className="text-white mb-2 block">Portfólio (Adicionar imagens)</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                        // Handle single file for now or loop
                                        const file = e.target.files?.[0];
                                        if (file) handlePortfolioUpload(file);
                                    }}
                                    className="bg-neutral-800 border-neutral-700 text-white mb-4"
                                />
                                <div className="grid grid-cols-4 gap-2">
                                    {microsite.portfolio_images?.map((url: string, idx: number) => (
                                        <div key={idx} className="relative group aspect-square">
                                            <img src={url} className="w-full h-full object-cover rounded border border-neutral-700" />
                                            <button
                                                className="absolute top-1 right-1 bg-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    const newImages = microsite.portfolio_images.filter((_: any, i: number) => i !== idx);
                                                    queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, portfolio_images: newImages }));
                                                }}
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Services Editor Mockup */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label className="text-white block">Serviços Listados</Label>
                                    <Button size="sm" variant="secondary" onClick={() => {
                                        const newService = { name: "Novo Serviço", description: "", price: "0,00" };
                                        const services = microsite.services || [];
                                        queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, services: [...services, newService] }));
                                    }}>
                                        <Plus className="w-4 h-4 mr-2" /> Adicionar
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {microsite.services?.map((service: any, idx: number) => (
                                        <div key={idx} className="bg-neutral-800 p-3 rounded border border-neutral-700 flex flex-col gap-2">
                                            <Input
                                                value={service.name}
                                                onChange={(e) => {
                                                    const newServices = [...microsite.services];
                                                    newServices[idx].name = e.target.value;
                                                    queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, services: newServices }));
                                                }}
                                                className="bg-neutral-900 border-neutral-600 h-8"
                                                placeholder="Nome do serviço"
                                            />
                                            <Input
                                                value={service.description}
                                                onChange={(e) => {
                                                    const newServices = [...microsite.services];
                                                    newServices[idx].description = e.target.value;
                                                    queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, services: newServices }));
                                                }}
                                                className="bg-neutral-900 border-neutral-600 h-8"
                                                placeholder="Descrição"
                                            />
                                            <div className="flex gap-2">
                                                <Input
                                                    value={service.price}
                                                    onChange={(e) => {
                                                        const newServices = [...microsite.services];
                                                        newServices[idx].price = e.target.value;
                                                        queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, services: newServices }));
                                                    }}
                                                    className="bg-neutral-900 border-neutral-600 h-8 w-1/3"
                                                    placeholder="Preço"
                                                />
                                                <Button variant="ghost" size="sm" className="ml-auto text-red-400 hover:text-red-300 h-8"
                                                    onClick={() => {
                                                        const newServices = microsite.services.filter((_: any, i: number) => i !== idx);
                                                        queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, services: newServices }));
                                                    }}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!microsite.services || microsite.services.length === 0) && (
                                        <p className="text-sm text-neutral-500 italic">Nenhum serviço cadastrado.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Configuration Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader>
                            <CardTitle className="text-white">Configurações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="text-white mb-2 block">Contato</Label>
                                <div className="space-y-2">
                                    <Input
                                        value={microsite.phone || ''}
                                        onChange={(e) => queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, phone: e.target.value }))}
                                        placeholder="Telefone / WhatsApp"
                                        className="bg-neutral-800 border-neutral-700 text-white"
                                    />
                                    <Input
                                        value={microsite.whatsapp_link || ''}
                                        onChange={(e) => queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, whatsapp_link: e.target.value }))}
                                        placeholder="Link WhatsApp (https://wa.me/...)"
                                        className="bg-neutral-800 border-neutral-700 text-white"
                                    />
                                    <Input
                                        value={microsite.email || ''}
                                        onChange={(e) => queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, email: e.target.value }))}
                                        placeholder="Email"
                                        className="bg-neutral-800 border-neutral-700 text-white"
                                    />
                                    <Input
                                        value={microsite.instagram_handle || ''}
                                        onChange={(e) => queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, instagram_handle: e.target.value }))}
                                        placeholder="@instagram"
                                        className="bg-neutral-800 border-neutral-700 text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-neutral-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-white">Mostrar Preços</Label>
                                        <p className="text-xs text-neutral-500">Exibir valores publicamente</p>
                                    </div>
                                    <Switch
                                        checked={microsite.show_prices}
                                        onCheckedChange={(checked) => queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, show_prices: checked }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-white">Agendamento Online</Label>
                                        <p className="text-xs text-neutral-500">Permitir solicitações pelo site</p>
                                    </div>
                                    <Switch
                                        checked={microsite.enable_booking}
                                        onCheckedChange={(checked) => queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, enable_booking: checked }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded bg-green-900/10 border border-green-900/30">
                                    <div>
                                        <Label className="text-green-400">Publicar Site</Label>
                                        <p className="text-xs text-green-600/70">Tornar visível para todos</p>
                                    </div>
                                    <Switch
                                        checked={microsite.is_published}
                                        onCheckedChange={(checked) => queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, is_published: checked }))}
                                        className="data-[state=checked]:bg-green-600"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-neutral-800">
                                <Label className="text-white mb-2 block">Cores do Tema</Label>
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-xs text-neutral-500 mb-1">Primária</p>
                                        <Input
                                            type="color"
                                            value={microsite.primary_color || '#8B5CF6'}
                                            onChange={(e) => queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, primary_color: e.target.value }))}
                                            className="w-12 h-12 p-1 bg-neutral-800 border-neutral-700"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-500 mb-1">Secundária</p>
                                        <Input
                                            type="color"
                                            value={microsite.secondary_color || '#10B981'}
                                            onChange={(e) => queryClient.setQueryData(['my-microsite'], (old: any) => ({ ...old, secondary_color: e.target.value }))}
                                            className="w-12 h-12 p-1 bg-neutral-800 border-neutral-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

function createDefaultMicrosite() {
    return {
        business_name: '',
        slug: '',
        primary_color: '#8B5CF6',
        secondary_color: '#10B981',
        show_prices: false,
        enable_booking: true,
        is_published: false,
        services: [],
        portfolio_images: [],
        about_text: '',
    };
=======
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ColorPicker } from './microsite-editor/components/ColorPicker'
import { SettingToggle } from './microsite-editor/components/SettingToggle'
import { ImageUploader } from './microsite-editor/components/ImageUploader'
import { ServicesEditor } from './microsite-editor/components/ServicesEditor'
import { GalleryEditor } from './microsite-editor/components/GalleryEditor'
import { TestimonialsEditor } from './microsite-editor/components/TestimonialsEditor'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Eye, Save } from 'lucide-react'
import { toast } from 'sonner'

interface MicrositeFormData {
  business_name: string
  tagline: string
  bio: string
  slug: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  email: string
  phone: string
  whatsapp: string
  instagram_handle: string
  show_prices: boolean
  enable_booking: boolean
  enable_gallery: boolean
  enable_services: boolean
  enable_about: boolean
  enable_contact: boolean
  enable_reviews: boolean
  is_published: boolean
}

interface MicrositeRecord {
  id: string
  slug: string
  business_name: string
  tagline: string | null
  bio: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  instagram_handle: string | null
  show_prices: boolean
  enable_booking: boolean
  enable_gallery: boolean
  enable_services: boolean
  enable_about: boolean
  enable_contact: boolean
  enable_reviews: boolean
  is_published: boolean
  view_count: number
}

const defaultFormData: MicrositeFormData = {
  business_name: '',
  tagline: '',
  bio: '',
  slug: '',
  primary_color: '#8B5CF6',
  secondary_color: '#10B981',
  accent_color: '#F59E0B',
  background_color: '#0a0a0a',
  text_color: '#ffffff',
  email: '',
  phone: '',
  whatsapp: '',
  instagram_handle: '',
  show_prices: false,
  enable_booking: true,
  enable_gallery: true,
  enable_services: true,
  enable_about: true,
  enable_contact: true,
  enable_reviews: true,
  is_published: false,
}

export default function MicrositeEditor() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: microsite, isLoading } = useQuery({
    queryKey: ['my-microsite', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('microsites' as never)
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()

      if (error) throw error
      return data as unknown as MicrositeRecord | null
    },
    enabled: !!user,
  })

  const [formData, setFormData] = useState<MicrositeFormData>(defaultFormData)

  useEffect(() => {
    if (microsite) {
      setFormData({
        business_name: microsite.business_name || '',
        tagline: microsite.tagline || '',
        bio: microsite.bio || '',
        slug: microsite.slug || '',
        primary_color: microsite.primary_color || '#8B5CF6',
        secondary_color: microsite.secondary_color || '#10B981',
        accent_color: microsite.accent_color || '#F59E0B',
        background_color: microsite.background_color || '#0a0a0a',
        text_color: microsite.text_color || '#ffffff',
        email: microsite.email || '',
        phone: microsite.phone || '',
        whatsapp: microsite.whatsapp || '',
        instagram_handle: microsite.instagram_handle || '',
        show_prices: microsite.show_prices,
        enable_booking: microsite.enable_booking,
        enable_gallery: microsite.enable_gallery,
        enable_services: microsite.enable_services,
        enable_about: microsite.enable_about,
        enable_contact: microsite.enable_contact,
        enable_reviews: microsite.enable_reviews,
        is_published: microsite.is_published,
      })
    }
  }, [microsite])

  const saveMutation = useMutation({
    mutationFn: async (data: MicrositeFormData) => {
      if (microsite?.id) {
        const { error } = await supabase
          .from('microsites' as never)
          .update(data as never)
          .eq('id', microsite.id)
        if (error) throw error
      } else {
        const { data: artist } = await supabase
          .from('makeup_artists')
          .select('id')
          .eq('user_id', user!.id)
          .maybeSingle()

        const { error } = await supabase.from('microsites' as never).insert({
          ...data,
          user_id: user!.id,
          makeup_artist_id: artist?.id,
        } as never)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-microsite'] })
      toast.success('Microsite salvo!')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const updateField = useCallback(
    <K extends keyof MicrositeFormData>(
      key: K,
      value: MicrositeFormData[K],
    ) => {
      setFormData((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const micrositeUrl = microsite?.slug
    ? `${window.location.origin}/${microsite.slug}`
    : ''

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Editor de Microsite</h1>
          {micrositeUrl && (
            <p className="text-neutral-400 mt-1 text-sm">
              <a
                href={micrositeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                {micrositeUrl}
              </a>
              {microsite && (
                <span className="ml-3 text-neutral-600">
                  {microsite.view_count} visualizações
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {micrositeUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(micrositeUrl, '_blank')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          <Button
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending || !formData.business_name}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basics" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="basics">Básico</TabsTrigger>
          <TabsTrigger value="branding">Visual</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="gallery">Galeria</TabsTrigger>
          <TabsTrigger value="testimonials">Depoimentos</TabsTrigger>
          <TabsTrigger value="settings">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="basics">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome do Negócio *</Label>
                <Input
                  value={formData.business_name}
                  onChange={(e) => updateField('business_name', e.target.value)}
                  placeholder="Studio Glam Makeup"
                />
              </div>
              <div>
                <Label>Slogan</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  placeholder="Realçando sua beleza natural"
                />
              </div>
              <div>
                <Label>Sobre Você</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  rows={6}
                  placeholder="Conte sobre você, experiência, especialidades..."
                />
              </div>
              <div>
                <Label>URL Personalizada</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-neutral-700 bg-neutral-900 text-neutral-500 text-sm">
                    khaoskontrol.com.br/
                  </span>
                  <Input
                    value={formData.slug}
                    onChange={(e) =>
                      updateField(
                        'slug',
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      )
                    }
                    placeholder="seu-nome"
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>E-mail</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    type="email"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => updateField('whatsapp', e.target.value)}
                    placeholder="+5511999999999"
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={formData.instagram_handle}
                    onChange={(e) =>
                      updateField('instagram_handle', e.target.value)
                    }
                    placeholder="seuperfil"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Identidade Visual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUploader
                label="Logo"
                micrositeId={microsite?.id}
                folder="logos"
                onUpload={(_url) =>
                  updateField('business_name', formData.business_name)
                }
              />
              <ImageUploader
                label="Imagem de Capa"
                micrositeId={microsite?.id}
                folder="covers"
                onUpload={(_url) =>
                  updateField('business_name', formData.business_name)
                }
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ColorPicker
                  label="Primária"
                  value={formData.primary_color}
                  onChange={(v) => updateField('primary_color', v)}
                />
                <ColorPicker
                  label="Secundária"
                  value={formData.secondary_color}
                  onChange={(v) => updateField('secondary_color', v)}
                />
                <ColorPicker
                  label="Destaque"
                  value={formData.accent_color}
                  onChange={(v) => updateField('accent_color', v)}
                />
                <ColorPicker
                  label="Fundo"
                  value={formData.background_color}
                  onChange={(v) => updateField('background_color', v)}
                />
                <ColorPicker
                  label="Texto"
                  value={formData.text_color}
                  onChange={(v) => updateField('text_color', v)}
                />
              </div>
              <div
                className="mt-4 p-4 rounded-xl"
                style={{
                  backgroundColor: formData.background_color,
                  border: `1px solid ${formData.text_color}20`,
                }}
              >
                <p
                  className="text-sm mb-2"
                  style={{ color: formData.text_color, opacity: 0.6 }}
                >
                  Preview
                </p>
                <h3
                  className="text-xl font-bold"
                  style={{ color: formData.primary_color }}
                >
                  Título de Exemplo
                </h3>
                <p style={{ color: formData.text_color }}>
                  Texto de corpo normal
                </p>
                <span
                  className="inline-block mt-2 px-3 py-1 rounded text-sm font-medium"
                  style={{
                    backgroundColor: formData.accent_color,
                    color: formData.background_color,
                  }}
                >
                  Botão
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <ServicesEditor micrositeId={microsite?.id} />
        </TabsContent>

        <TabsContent value="gallery">
          <GalleryEditor micrositeId={microsite?.id} />
        </TabsContent>

        <TabsContent value="testimonials">
          <TestimonialsEditor micrositeId={microsite?.id} />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <SettingToggle
                label="Mostrar Preços"
                description="Exibir valores dos serviços"
                checked={formData.show_prices}
                onChange={(v) => updateField('show_prices', v)}
              />
              <SettingToggle
                label="Agendamento"
                description="Botão de agendar via WhatsApp"
                checked={formData.enable_booking}
                onChange={(v) => updateField('enable_booking', v)}
              />
              <SettingToggle
                label="Seção Sobre"
                description="Mostrar biografia"
                checked={formData.enable_about}
                onChange={(v) => updateField('enable_about', v)}
              />
              <SettingToggle
                label="Serviços"
                description="Mostrar lista de serviços"
                checked={formData.enable_services}
                onChange={(v) => updateField('enable_services', v)}
              />
              <SettingToggle
                label="Galeria"
                description="Mostrar portfólio de fotos"
                checked={formData.enable_gallery}
                onChange={(v) => updateField('enable_gallery', v)}
              />
              <SettingToggle
                label="Depoimentos"
                description="Mostrar avaliações de clientes"
                checked={formData.enable_reviews}
                onChange={(v) => updateField('enable_reviews', v)}
              />
              <SettingToggle
                label="Contato"
                description="Seção de contato e redes sociais"
                checked={formData.enable_contact}
                onChange={(v) => updateField('enable_contact', v)}
              />

              <div className="border-t border-neutral-800 pt-5 mt-5">
                <SettingToggle
                  label="🌐 Site Publicado"
                  description="Tornar acessível publicamente"
                  checked={formData.is_published}
                  onChange={(v) => updateField('is_published', v)}
                />
                {formData.is_published && micrositeUrl && (
                  <div className="mt-3 bg-green-950/50 border border-green-800 rounded-lg p-3">
                    <p className="text-green-400 text-sm">
                      ✅ Seu site está no ar: {micrositeUrl}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
>>>>>>> aef15b389676cb9989b70b2e5a35dfa4a86317ec
}
