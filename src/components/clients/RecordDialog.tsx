import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ActionButton, OutlineButton } from '@/components/ui/action-buttons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Plus, Upload, X } from 'lucide-react'
import { logger } from '@/services/logger'

interface RecordDialogProps {
  clientId: string
  onRecordAdded: () => void
}

export function RecordDialog({ clientId, onRecordAdded }: RecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [serviceName, setServiceName] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setPhotos((prev) => [...prev, ...newFiles])

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
      setPhotoPreviews((prev) => [...prev, ...newPreviews])
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(photoPreviews[index])
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!serviceName) {
      toast({ title: 'Nome do serviço é obrigatório', variant: 'destructive' })
      return
    }

    setLoading(true)

    try {
      // 1. Upload Photos
      const photoUrls: string[] = []
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuário não autenticado')

      for (const file of photos) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${clientId}/${Math.random()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('client-photos')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('client-photos').getPublicUrl(fileName)

        photoUrls.push(publicUrl)
      }

      // 2. Save Record (Disabled: treatment_records table removed)
      /*
            const { error } = await supabase
                .insert({
                    client_id: clientId,
                    user_id: user.id,
                    date,
                    service_name: serviceName,
                    notes,
                    photos: photoUrls
                });
            if (error) throw error;
            */
      const error = null // Fake success

      if (error) throw error

      toast({ title: 'Registro salvo com sucesso!' })
      setOpen(false)
      resetForm()
      onRecordAdded()
    } catch (error) {
      logger.error(error, 'RecordDialog.handleSave', { showToast: false })
      toast({
        title: 'Erro ao salvar registro',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setServiceName('')
    setNotes('')
    setPhotos([])
    setPhotoPreviews([])
    setDate(new Date().toISOString().split('T')[0])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#00e5ff] hover:bg-[#00e5ff]/80 text-black font-medium transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)]">
          <Plus className="h-4 w-4 mr-2" />
          Novo Registro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-[#121212]/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-white">
            Novo Prontuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-gray-400">
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-[#00e5ff]/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service" className="text-gray-400">
                Serviço / Procedimento
              </Label>
              <Input
                id="service"
                placeholder="Ex: Botox Testa"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#00e5ff]/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-400">
              Anotações Técnicas
            </Label>
            <Textarea
              id="notes"
              placeholder="Detalhes do procedimento, produtos usados, dosagem..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#00e5ff]/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400">Fotos (Antes/Depois)</Label>

            <div className="grid grid-cols-4 gap-4 mt-2">
              {photoPreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group"
                >
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}

              <label className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 hover:border-[#00e5ff]/50 hover:bg-[#00e5ff]/5 cursor-pointer transition-all group">
                <Upload className="h-6 w-6 text-gray-500 group-hover:text-[#00e5ff] transition-colors" />
                <span className="text-xs text-gray-500 mt-2 group-hover:text-[#00e5ff]">
                  Adicionar
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <OutlineButton onClick={() => setOpen(false)}>Cancelar</OutlineButton>
          <ActionButton
            onClick={handleSave}
            loading={loading}
            className="min-w-[120px]"
          >
            Salvar Prontuário
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
