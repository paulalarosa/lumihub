import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)

      const isInstalled = window.matchMedia(
        '(display-mode: standalone)',
      ).matches
      if (!isInstalled) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { _outcome } = await deferredPrompt.userChoice

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-neutral-900 border border-neutral-700 rounded-lg p-4 shadow-xl z-50">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">
            Instalar Khaos Kontrol
          </h3>
          <p className="text-neutral-400 text-sm mb-3">
            Adicione à tela inicial para acesso rápido e trabalhe offline!
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar
            </Button>
            <Button
              onClick={() => setShowPrompt(false)}
              variant="outline"
              size="sm"
            >
              Depois
            </Button>
          </div>
        </div>

        <button
          onClick={() => setShowPrompt(false)}
          className="text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
