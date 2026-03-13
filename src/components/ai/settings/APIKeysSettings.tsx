import { useState } from 'react'
import { useAIStore } from '@/stores/useAIStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  Info,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

export const APIKeysSettings = () => {
  const { userAPIKeys, setUserAPIKey, clearUserAPIKey } = useAIStore()

  const [geminiKey, setGeminiKey] = useState(userAPIKeys.gemini || '')
  const [openaiKey, setOpenaiKey] = useState(userAPIKeys.openai || '')
  const [showGemini, setShowGemini] = useState(false)
  const [showOpenAI, setShowOpenAI] = useState(false)

  const handleSaveGemini = () => {
    if (!geminiKey.startsWith('AIza')) {
      toast.error('Chave do Gemini inválida (deve começar com "AIza")')
      return
    }

    setUserAPIKey('gemini', geminiKey)
    toast.success('Protocol_Key: Gemini_Assigned')
  }

  const handleSaveOpenAI = () => {
    if (!openaiKey.startsWith('sk-')) {
      toast.error('Chave da OpenAI inválida (deve começar com "sk-")')
      return
    }

    setUserAPIKey('openai', openaiKey)
    toast.success('Protocol_Key: OpenAI_Assigned')
  }

  const handleClearGemini = () => {
    clearUserAPIKey('gemini')
    setGeminiKey('')
    toast.info('Protocol_Key: Gemini_Revoked')
  }

  const handleClearOpenAI = () => {
    clearUserAPIKey('openai')
    setOpenaiKey('')
    toast.info('Protocol_Key: OpenAI_Revoked')
  }

  return (
    <div className="space-y-8 font-mono">
      {/* Information Header */}
      <Alert className="bg-blue-500/5 border-blue-500/20 rounded-none">
        <Info className="w-4 h-4 text-blue-400" />
        <AlertDescription className="text-[10px] uppercase tracking-widest leading-relaxed">
          <p className="text-white font-bold mb-1">
            BYOK - Bring Your Own Key Protocol
          </p>
          <p className="text-zinc-500">
            Utilize your own enterprise keys to optimize costs and bypass
            centralized limits. All keys are encrypted and stored within your{' '}
            <span className="text-blue-400">local security context</span>.
          </p>
        </AlertDescription>
      </Alert>

      {/* Gemini API Key */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">
            Google Gemini Vault
          </Label>
          {userAPIKeys.gemini && (
            <div className="flex items-center gap-1.5 text-[8px] text-emerald-500 uppercase font-black">
              <CheckCircle className="w-3 h-3" />
              Verified_Active
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showGemini ? 'text' : 'password'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Neural_Input: AIzaSy..."
              className="bg-black border-white/10 rounded-none h-11 text-xs pr-10 focus-visible:ring-0 placeholder:text-zinc-800"
            />
            <button
              onClick={() => setShowGemini(!showGemini)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white transition-colors"
            >
              {showGemini ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <Button
            onClick={handleSaveGemini}
            disabled={!geminiKey}
            className="bg-white text-black hover:bg-zinc-200 rounded-none h-11 font-bold tracking-widest text-[10px]"
          >
            Authorize
          </Button>

          {userAPIKeys.gemini && (
            <Button
              onClick={handleClearGemini}
              variant="ghost"
              className="border border-red-500/10 text-red-500 hover:bg-red-500/5 rounded-none h-11 px-3"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[8px] text-zinc-500 hover:text-white uppercase tracking-widest underline underline-offset-4"
        >
          Acquire Gemini Credentials
          <ExternalLink className="w-2 h-2" />
        </a>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* OpenAI API Key */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">
            OpenAI Security Vault
          </Label>
          {userAPIKeys.openai && (
            <div className="flex items-center gap-1.5 text-[8px] text-emerald-500 uppercase font-black">
              <CheckCircle className="w-3 h-3" />
              Verified_Active
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showOpenAI ? 'text' : 'password'}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="Neural_Input: sk-..."
              className="bg-black border-white/10 rounded-none h-11 text-xs pr-10 focus-visible:ring-0 placeholder:text-zinc-800"
            />
            <button
              onClick={() => setShowOpenAI(!showOpenAI)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white transition-colors"
            >
              {showOpenAI ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <Button
            onClick={handleSaveOpenAI}
            disabled={!openaiKey}
            className="bg-white text-black hover:bg-zinc-200 rounded-none h-11 font-bold tracking-widest text-[10px]"
          >
            Authorize
          </Button>

          {userAPIKeys.openai && (
            <Button
              onClick={handleClearOpenAI}
              variant="ghost"
              className="border border-red-500/10 text-red-500 hover:bg-red-500/5 rounded-none h-11 px-3"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[8px] text-zinc-500 hover:text-white uppercase tracking-widest underline underline-offset-4"
        >
          Acquire OpenAI Credentials
          <ExternalLink className="w-2 h-2" />
        </a>
      </div>

      {/* Security Protocol Footer */}
      <div className="p-4 bg-zinc-950 border border-white/5 space-y-3">
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
          Security_Parameters 🔒
        </p>
        <ul className="space-y-1.5">
          {[
            'Keys are isolated within LocalStorage context',
            'Zero communication with intermediary cloud relays',
            'Direct end-to-end neural encryption established',
            'Revocation possible at any execution phase',
          ].map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 text-[8px] text-zinc-600 uppercase tracking-widest leading-relaxed"
            >
              <span className="text-zinc-800 font-bold">[{idx + 1}]</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
