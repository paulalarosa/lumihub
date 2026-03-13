import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { Check, RefreshCw, X } from 'lucide-react'

interface GoogleCalendarSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export const GoogleCalendarSettings = ({
  isOpen,
  onClose,
}: GoogleCalendarSettingsProps) => {
  const {
    isConnected,
    isLoading,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  } = useGoogleCalendar()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle>Configurações do Google Calendar</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Gerencie a sincronização com sua agenda do Google.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg border border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full">
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-6 h-6"
                />
              </div>
              <div>
                <h4 className="font-medium text-white">Google Calendar</h4>
                <p className="text-sm text-neutral-400">
                  {isConnected
                    ? 'Conectado e sincronizando eventos'
                    : 'Não conectado'}
                </p>
              </div>
            </div>

            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center text-green-500 text-xs bg-green-900/20 px-2 py-1 rounded border border-green-900">
                  <Check className="w-3 h-3 mr-1" />
                  Ativo
                </span>
              </div>
            ) : (
              <span className="flex items-center text-yellow-500 text-xs bg-yellow-900/20 px-2 py-1 rounded border border-yellow-900">
                Pendente
              </span>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>

            {isConnected ? (
              <Button
                variant="destructive"
                onClick={disconnectGoogleCalendar}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Desconectar
              </Button>
            ) : (
              <Button
                onClick={connectGoogleCalendar}
                disabled={isLoading}
                className="bg-white text-black hover:bg-neutral-200 gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : null}
                Conectar Conta Google
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
