import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Assistant } from '../hooks/useAssistants'

interface AssistantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assistant: Assistant | null
  onSave: (data: {
    name: string
    email: string | null
    phone: string | null
  }) => Promise<void>
}

export function AssistantDialog({
  open,
  onOpenChange,
  assistant,
  onSave,
}: AssistantDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (assistant) {
      setName(assistant.name)
      setEmail(assistant.email || '')
      setPhone(assistant.phone || '')
    } else {
      setName('')
      setEmail('')
      setPhone('')
    }
  }, [assistant, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        name,
        email: email || null,
        phone: phone || null,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none bg-[#0A0A0A] border border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif tracking-wide">
            {assistant ? 'Editar Assistente' : 'Nova Assistente'}
          </DialogTitle>
          <p className="text-gray-400 text-xs">
            Insira os dados do profissional parceiro.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-xs uppercase tracking-wider text-gray-400"
            >
              Nome *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="NOME COMPLETO"
              required
              className="bg-white/5 border-white/10 rounded-none text-white focus:border-white/50 focus:ring-0 placeholder:text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs uppercase tracking-wider text-gray-400"
            >
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL@EXEMPLO.COM"
              className="bg-white/5 border-white/10 rounded-none text-white focus:border-white/50 focus:ring-0 placeholder:text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-xs uppercase tracking-wider text-gray-400"
            >
              Telefone
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="bg-white/5 border-white/10 rounded-none text-white focus:border-white/50 focus:ring-0 placeholder:text-gray-700"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-none border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/30 uppercase text-xs tracking-wider"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-none bg-white text-black hover:bg-gray-200 border-none uppercase text-xs tracking-wider font-semibold px-6"
            >
              {saving ? 'Salvando...' : assistant ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
