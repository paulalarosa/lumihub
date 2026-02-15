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
}
