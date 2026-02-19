import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Eye,
  Save,
  Upload,
  Plus,
  Trash2,
  Star,
  Image,
  MessageSquare,
} from 'lucide-react'
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

interface ServiceRecord {
  id: string
  name: string
  description: string | null
  price: number | null
  duration_minutes: number | null
  display_order: number
  is_visible: boolean
}

interface GalleryRecord {
  id: string
  image_url: string
  caption: string | null
  category: string | null
  is_featured: boolean
  display_order: number
}

interface TestimonialRecord {
  id: string
  client_name: string
  rating: number | null
  text: string
  event_type: string | null
  is_visible: boolean
  display_order: number
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
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2 mt-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 rounded cursor-pointer border border-neutral-700"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  )
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label>{label}</Label>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function ImageUploader({
  label,
  micrositeId,
  folder,
  onUpload,
}: {
  label: string
  micrositeId?: string
  folder: string
  onUpload: (url: string) => void
}) {
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('microsite-assets')
      .upload(path, file, { upsert: true })
    if (error) {
      toast.error('Erro no upload')
      return
    }

    const { data } = supabase.storage
      .from('microsite-assets')
      .getPublicUrl(path)
    onUpload(data.publicUrl)
    toast.success(`${label} atualizado!`)
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={!micrositeId}
        >
          <Upload className="w-4 h-4 mr-2" />
          {micrositeId ? `Upload ${label}` : 'Salve primeiro'}
        </Button>
      </div>
    </div>
  )
}

function ServicesEditor({ micrositeId }: { micrositeId?: string }) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
  })

  const { data: services, isLoading } = useQuery({
    queryKey: ['microsite-services', micrositeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('microsite_services' as never)
        .select('*')
        .eq('microsite_id', micrositeId!)
        .order('display_order')
      if (error) throw error
      return (data || []) as unknown as ServiceRecord[]
    },
    enabled: !!micrositeId,
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('microsite_services' as never)
        .insert({
          microsite_id: micrositeId,
          name: newService.name,
          description: newService.description || null,
          price: newService.price ? parseFloat(newService.price) : null,
          duration_minutes: newService.duration_minutes
            ? parseInt(newService.duration_minutes)
            : null,
          display_order: (services?.length || 0) + 1,
        } as never)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsite-services'] })
      setIsAdding(false)
      setNewService({
        name: '',
        description: '',
        price: '',
        duration_minutes: '',
      })
      toast.success('Serviço adicionado!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('microsite_services' as never)
        .delete()
        .eq('id', serviceId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsite-services'] })
      toast.success('Serviço removido!')
    },
  })

  if (!micrositeId) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-neutral-400">
            Salve o microsite primeiro para adicionar serviços.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Serviços</CardTitle>
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="py-8 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {services?.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg"
          >
            <div className="flex-1">
              <p className="font-semibold text-white">{service.name}</p>
              {service.description && (
                <p className="text-sm text-neutral-400 mt-0.5">
                  {service.description}
                </p>
              )}
              <div className="flex gap-3 mt-1 text-xs text-neutral-500">
                {service.price != null && <span>R$ {service.price}</span>}
                {service.duration_minutes && (
                  <span>{service.duration_minutes}min</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate(service.id)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}

        {isAdding && (
          <div className="p-4 bg-neutral-900 rounded-lg space-y-3">
            <Input
              placeholder="Nome do serviço *"
              value={newService.name}
              onChange={(e) =>
                setNewService({ ...newService, name: e.target.value })
              }
            />
            <Textarea
              placeholder="Descrição"
              value={newService.description}
              onChange={(e) =>
                setNewService({ ...newService, description: e.target.value })
              }
              rows={2}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Preço (R$)"
                value={newService.price}
                onChange={(e) =>
                  setNewService({ ...newService, price: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Duração (min)"
                value={newService.duration_minutes}
                onChange={(e) =>
                  setNewService({
                    ...newService,
                    duration_minutes: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!newService.name || addMutation.isPending}
              >
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {!isLoading && (!services || services.length === 0) && !isAdding && (
          <div className="text-center py-10">
            <Star className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500">Nenhum serviço cadastrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function GalleryEditor({ micrositeId }: { micrositeId?: string }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: gallery, isLoading } = useQuery({
    queryKey: ['microsite-gallery', micrositeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('microsite_gallery' as never)
        .select('*')
        .eq('microsite_id', micrositeId!)
        .order('display_order')
      if (error) throw error
      return (data || []) as unknown as GalleryRecord[]
    },
    enabled: !!micrositeId,
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split('.').pop()
      const path = `${user!.id}/gallery/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('microsite-assets')
        .upload(path, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('microsite-assets')
        .getPublicUrl(path)

      const { error } = await supabase
        .from('microsite_gallery' as never)
        .insert({
          microsite_id: micrositeId,
          image_url: urlData.publicUrl,
          display_order: (gallery?.length || 0) + 1,
        } as never)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsite-gallery'] })
      toast.success('Imagem adicionada!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('microsite_gallery' as never)
        .delete()
        .eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsite-gallery'] })
      toast.success('Imagem removida!')
    },
  })

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => uploadMutation.mutate(file))
    e.target.value = ''
  }

  if (!micrositeId) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-neutral-400">
            Salve o microsite primeiro para adicionar fotos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Galeria de Fotos</CardTitle>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            <Button
              onClick={() => inputRef.current?.click()}
              size="sm"
              disabled={uploadMutation.isPending}
            >
              <Upload className="w-4 h-4 mr-1" />
              {uploadMutation.isPending ? 'Enviando...' : 'Upload'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="py-8 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {gallery && gallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-lg overflow-hidden aspect-square"
              >
                <img
                  src={item.image_url}
                  alt={item.caption || ''}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : !isLoading ? (
          <div className="text-center py-10">
            <Image className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500">Nenhuma foto na galeria</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function TestimonialsEditor({ micrositeId }: { micrositeId?: string }) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [newTestimonial, setNewTestimonial] = useState({
    client_name: '',
    text: '',
    rating: '5',
    event_type: '',
  })

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['microsite-testimonials', micrositeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('microsite_testimonials' as never)
        .select('*')
        .eq('microsite_id', micrositeId!)
        .order('display_order')
      if (error) throw error
      return (data || []) as unknown as TestimonialRecord[]
    },
    enabled: !!micrositeId,
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('microsite_testimonials' as never)
        .insert({
          microsite_id: micrositeId,
          client_name: newTestimonial.client_name,
          text: newTestimonial.text,
          rating: parseInt(newTestimonial.rating),
          event_type: newTestimonial.event_type || null,
          display_order: (testimonials?.length || 0) + 1,
        } as never)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsite-testimonials'] })
      setIsAdding(false)
      setNewTestimonial({
        client_name: '',
        text: '',
        rating: '5',
        event_type: '',
      })
      toast.success('Depoimento adicionado!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('microsite_testimonials' as never)
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsite-testimonials'] })
      toast.success('Depoimento removido!')
    },
  })

  if (!micrositeId) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-neutral-400">
            Salve o microsite primeiro para adicionar depoimentos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Depoimentos</CardTitle>
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="py-8 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {testimonials?.map((t) => (
          <div
            key={t.id}
            className="flex items-start justify-between p-4 bg-neutral-900 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white">{t.client_name}</p>
                {t.event_type && (
                  <span className="text-xs text-neutral-500">
                    • {t.event_type}
                  </span>
                )}
              </div>
              {t.rating && (
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>
              )}
              <p className="text-sm text-neutral-400 mt-1 italic line-clamp-2">
                &ldquo;{t.text}&rdquo;
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate(t.id)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}

        {isAdding && (
          <div className="p-4 bg-neutral-900 rounded-lg space-y-3">
            <Input
              placeholder="Nome do cliente *"
              value={newTestimonial.client_name}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  client_name: e.target.value,
                })
              }
            />
            <Textarea
              placeholder="Depoimento *"
              value={newTestimonial.text}
              onChange={(e) =>
                setNewTestimonial({ ...newTestimonial, text: e.target.value })
              }
              rows={3}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min="1"
                max="5"
                placeholder="Nota (1-5)"
                value={newTestimonial.rating}
                onChange={(e) =>
                  setNewTestimonial({
                    ...newTestimonial,
                    rating: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Tipo de evento"
                value={newTestimonial.event_type}
                onChange={(e) =>
                  setNewTestimonial({
                    ...newTestimonial,
                    event_type: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => addMutation.mutate()}
                disabled={
                  !newTestimonial.client_name ||
                  !newTestimonial.text ||
                  addMutation.isPending
                }
              >
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {!isLoading &&
          (!testimonials || testimonials.length === 0) &&
          !isAdding && (
            <div className="text-center py-10">
              <MessageSquare className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500">Nenhum depoimento cadastrado</p>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
