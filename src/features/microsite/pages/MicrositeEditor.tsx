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
import { ColorPicker } from '../components/components/ColorPicker'
import { SettingToggle } from '../components/components/SettingToggle'
import { ImageUploader } from '../components/components/ImageUploader'
import { ServicesEditor } from '../components/components/ServicesEditor'
import { GalleryEditor } from '../components/components/GalleryEditor'
import { TestimonialsEditor } from '../components/components/TestimonialsEditor'

import { PageLoader } from '@/components/ui/page-loader'

import { Eye, Save, CheckCircle2 } from 'lucide-react'
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
  const { organizationId } = useOrganization()
  const queryClient = useQueryClient()

  const { data: microsite, isLoading } = useQuery({
    queryKey: ['my-microsite', organizationId || user?.id],
    queryFn: async () => {
      if (!organizationId && !user) return null
      const { data, error } = await supabase
        .from('microsites' as never)
        .select('*')
        .eq('user_id', organizationId || user!.id)
        .maybeSingle()

      if (error) throw error
      return data | null
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
          .eq('user_id', organizationId || user!.id)
          .maybeSingle()

        const { error } = await supabase.from('microsites' as never).insert({
          ...data,
          user_id: organizationId || user!.id,
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
    return <PageLoader />
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
                currentUrl={formData.logo_url}
                onUpload={(url) => updateField('logo_url', url)}
                onRemove={() => updateField('logo_url', '')}
              />
              <ImageUploader
                label="Imagem de Capa"
                micrositeId={microsite?.id}
                folder="covers"
                currentUrl={formData.hero_image_url}
                onUpload={(url) => updateField('hero_image_url', url)}
                onRemove={() => updateField('hero_image_url', '')}
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
                  label="Site Publicado"
                  description="Tornar acessível publicamente"
                  checked={formData.is_published}
                  onChange={(v) => updateField('is_published', v)}
                />
                {formData.is_published && micrositeUrl && (
                  <div className="mt-3 bg-green-950/50 border border-green-800 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <p className="text-green-400 text-sm">
                      Seu site está no ar: {micrositeUrl}
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
}

