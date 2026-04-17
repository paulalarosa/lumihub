import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ActionButton, OutlineButton } from '@/components/ui/action-buttons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOrganization } from '@/hooks/useOrganization'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { ClientService } from '@/features/clients/api/clientService'
import { handleError } from '@/lib/error-handling'

export default function NewClientDialog({
  onSuccess,
}: {
  onSuccess?: () => void
}) {
  const { user, organizationId } = useOrganization()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    notes: '',
    origin: '',
    referred_by: '',
    is_bride: false,
    access_pin: '',
  })

  useEffect(() => {
    if (open && user?.id) {
      loadClients()
    }
  }, [open, user])

  const loadClients = async () => {
    if (!organizationId) return
    const data = await ClientService.list(organizationId)
    if (data) {
      setClients(data)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value =
      e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('O nome é obrigatório.')
      return
    }

    if (!user) {
      toast.error('Erro de sessão: Faça login novamente.')
      return
    }

    setLoading(true)

    try {
      const payload: Record<string, string | boolean | null> = {
        full_name: formData.name,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        notes: formData.notes || null,
        origin: formData.origin || null,
        user_id: organizationId || user.id,
        is_bride: formData.is_bride,
        access_pin: formData.access_pin || null,
      }

      const newClient = await ClientService.create(payload)

      if (formData.is_bride && newClient && 'id' in newClient) {
        const clientId = newClient.id as string
        const portalLink = `https://khaoskontrol.com.br/portal/${clientId}`

        await ClientService.update(clientId, {
          portal_link: portalLink,
        })
      }

      toast.success(
        formData.is_bride
          ? 'Noiva cadastrada com sucesso!'
          : 'Cliente criado com sucesso!',
      )
      setOpen(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        notes: '',
        origin: '',
        referred_by: '',
        is_bride: false,
        access_pin: '',
      })

      if (onSuccess) onSuccess()
    } catch (error) {
      handleError(error, 'NewClientDialog:handleSave')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-[#1A1A1A] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            Adicionar Novo Cliente
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Preencha os dados abaixo. O cliente será vinculado à sua conta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-white">
              Nome Completo *
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Maria Silva"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-none focus-visible:ring-0 focus-visible:border-white/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="origin" className="text-white">
                Origem
              </Label>
              <Select
                onValueChange={(v) => handleSelectChange('origin', v)}
                value={formData.origin}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-none focus:ring-0 focus:border-white/40">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10 text-white rounded-none">
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.origin === 'indicacao' && (
              <div className="grid gap-2">
                <Label htmlFor="referred_by" className="text-white">
                  Indicado por
                </Label>
                <Select
                  onValueChange={(v) => handleSelectChange('referred_by', v)}
                  value={formData.referred_by}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-none focus:ring-0 focus:border-white/40">
                    <SelectValue placeholder="Selecione Cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10 text-white max-h-60 overflow-y-auto rounded-none">
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.origin !== 'indicacao' && (
              <div className="grid gap-2">
                <Label htmlFor="company_name" className="text-white">
                  Empresa (Opcional)
                </Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Ex: Studio Glam"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-none focus-visible:ring-0 focus-visible:border-white/40"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="maria@email.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-none focus-visible:ring-0 focus-visible:border-white/40"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-white">
                Telefone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-none focus-visible:ring-0 focus-visible:border-white/40"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 my-2">
            <input
              type="checkbox"
              id="is_bride"
              name="is_bride"
              checked={formData.is_bride}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 bg-white/10 text-[#00e5ff] focus:ring-[#00e5ff]"
            />
            <Label
              htmlFor="is_bride"
              className="text-white font-medium cursor-pointer"
            >
              É Noiva? (Gerar Portal)
            </Label>
          </div>

          {formData.is_bride && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="access_pin" className="text-white">
                PIN de Acesso (4 dígitos)
              </Label>
              <Input
                id="access_pin"
                name="access_pin"
                value={formData.access_pin}
                onChange={handleChange}
                maxLength={4}
                placeholder="1234"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-none focus-visible:ring-0 focus-visible:border-white/40 tracking-[0.5em] font-mono"
              />
              <p className="text-xs text-white/50">
                Este PIN será usado para acessar o Portal da Noiva.
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes" className="text-white">
              Observações
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Detalhes extras..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-none focus-visible:ring-0 focus-visible:border-white/40"
            />
          </div>
        </div>
        <DialogFooter>
          <OutlineButton onClick={() => setOpen(false)}>Cancelar</OutlineButton>
          <ActionButton onClick={handleSave} loading={loading}>
            Salvar Cliente
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
