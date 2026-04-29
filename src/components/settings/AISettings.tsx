import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Bot,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useAI } from '@/hooks/useAI'
import { useWebLLM } from '@/hooks/useWebLLM'

interface AISettingsProps {
  provider: string
  setProvider: (v: string) => void
  apiKey: string
  setApiKey: (v: string) => void
  model: string
  setModel: (v: string) => void
  saving: boolean
  onSave: () => void
}

const KEY_PREFIX: Record<string, string> = {
  google: 'AIza',
  openai: 'sk-',
}

const MODEL_SUGGESTIONS: Record<string, string[]> = {
  google: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
}

export default function AISettings({
  provider,
  setProvider,
  apiKey,
  setApiKey,
  model,
  setModel,
  saving,
  onSave,
}: AISettingsProps) {
  const { mode, setMode } = useAI()
  const [showKey, setShowKey] = useState(false)

  const handleSave = () => {
    // Valida prefixo da key apenas quando usuária preencheu — vazio = sem BYOK,
    // edge function cai pro fallback global.
    if (apiKey.trim()) {
      const expected = KEY_PREFIX[provider]
      if (expected && !apiKey.trim().startsWith(expected)) {
        toast.error(
          `Chave inválida pra ${provider === 'google' ? 'Google Gemini' : 'OpenAI'} — deve começar com "${expected}"`,
        )
        return
      }
    }
    onSave()
  }

  const handleClearKey = () => {
    setApiKey('')
    toast.info('Chave removida. Salvar pra confirmar.')
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card rounded-none shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <Bot className="h-5 w-5" />
            Bring Your Own Key (BYOK)
          </CardTitle>
          <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Configure seu próprio provedor de IA — você paga direto na API e
            não fica limitada pelo cap global da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle local AI (WebGPU) */}
          <div className="flex items-center justify-between p-4 border border-zinc-800 bg-zinc-900/50">
            <div className="space-y-0.5">
              <Label className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="h-3 w-3 text-emerald-500" /> PRIVACIDADE
                TOTAL (LOCAL)
              </Label>
              <p className="text-[9px] text-muted-foreground font-mono uppercase">
                Executar IA no seu navegador via WebGPU — Studio
              </p>
            </div>
            <Switch
              checked={mode === 'local'}
              onCheckedChange={(checked) =>
                setMode(checked ? 'local' : 'cloud')
              }
            />
          </div>

          {mode === 'cloud' ? (
            <CloudByokSection
              provider={provider}
              setProvider={setProvider}
              apiKey={apiKey}
              setApiKey={setApiKey}
              model={model}
              setModel={setModel}
              showKey={showKey}
              setShowKey={setShowKey}
              onClearKey={handleClearKey}
            />
          ) : (
            <LocalAISection />
          )}

          <div className="flex justify-end pt-6 border-t border-border mt-8">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-none bg-white text-black hover:bg-gray-200 font-mono text-xs uppercase tracking-widest px-8 h-10"
            >
              {saving ? 'PROCESSANDO...' : 'SALVAR_CONFIGURAÇÃO'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-black/40 rounded-none shadow-none">
        <CardContent className="py-4">
          <p className="text-[9px] text-muted-foreground font-mono uppercase text-center">
            SISTEMA_AGNOSTICO_V2.0 · KEYS CRIPTOGRAFADAS NO SUPABASE
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

interface CloudByokSectionProps {
  provider: string
  setProvider: (v: string) => void
  apiKey: string
  setApiKey: (v: string) => void
  model: string
  setModel: (v: string) => void
  showKey: boolean
  setShowKey: (v: boolean) => void
  onClearKey: () => void
}

function CloudByokSection({
  provider,
  setProvider,
  apiKey,
  setApiKey,
  model,
  setModel,
  showKey,
  setShowKey,
  onClearKey,
}: CloudByokSectionProps) {
  const suggestions = MODEL_SUGGESTIONS[provider] ?? MODEL_SUGGESTIONS.google
  const keyDocsUrl =
    provider === 'google'
      ? 'https://aistudio.google.com/app/apikey'
      : 'https://platform.openai.com/api-keys'

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="p-4 border border-blue-500/20 bg-blue-500/5">
        <div className="flex gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
          <p className="text-xs text-blue-200/70 font-mono uppercase leading-relaxed">
            Sua chave é armazenada criptografada no banco e usada apenas pra
            autenticar suas chamadas. Quando preenchida, ela substitui a chave
            global do Khaos — você paga direto no provedor.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Cpu className="h-3 w-3" /> PROVEDOR
          </Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="rounded-none border-border bg-background focus:ring-0 font-mono text-xs uppercase text-white">
              <SelectValue placeholder="Selecione o provedor" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border bg-card font-mono text-xs uppercase">
              <SelectItem value="google">Google Gemini</SelectItem>
              <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Key className="h-3 w-3" /> API KEY
            {apiKey.trim() && (
              <span className="ml-auto flex items-center gap-1 text-emerald-500 normal-case">
                <CheckCircle2 className="h-3 w-3" />
                <span className="text-[9px] font-mono uppercase">
                  configurada
                </span>
              </span>
            )}
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  provider === 'google' ? 'AIzaSy...' : 'sk-...'
                }
                className="rounded-none border-border bg-background focus-visible:ring-0 font-mono text-xs pr-10 text-white"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {apiKey.trim() && (
              <Button
                type="button"
                onClick={onClearKey}
                variant="ghost"
                className="border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-none h-10 px-3"
                aria-label="Remover chave"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <a
            href={keyDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[9px] text-muted-foreground hover:text-foreground uppercase tracking-widest underline underline-offset-4 mt-1"
          >
            Como gerar minha chave
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="h-3 w-3" /> MODELO PREFERIDO
          </Label>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={suggestions[0]}
            list={`models-${provider}`}
            className="rounded-none border-border bg-background focus-visible:ring-0 font-mono text-xs uppercase text-white"
          />
          <datalist id={`models-${provider}`}>
            {suggestions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <p className="text-[9px] text-muted-foreground font-mono uppercase">
            Sugestões: {suggestions.join(' · ')}
          </p>
        </div>
      </div>
    </div>
  )
}

function LocalAISection() {
  const {
    isLoading,
    isInitialized,
    loadProgress,
    selectedModel,
    availableModels,
    hasAccess,
    setSelectedModel,
    initializeEngine,
    unloadEngine,
  } = useWebLLM()

  if (!hasAccess) {
    return (
      <Alert className="bg-purple-900/10 border-purple-500/30 rounded-none">
        <Shield className="h-4 w-4 text-purple-400" />
        <AlertDescription className="font-mono">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-white font-bold text-xs uppercase tracking-widest mb-1">
                Local AI · Privacidade Total
              </p>
              <p className="text-neutral-400 text-[10px] uppercase tracking-wider">
                Disponível exclusivamente no plano{' '}
                <span className="text-purple-400 font-bold">Studio</span>
              </p>
            </div>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-none h-8 font-mono text-[9px] uppercase tracking-widest px-4"
              onClick={() =>
                (window.location.href = '/configuracoes/assinatura')
              }
            >
              Upgrade
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Alert className="bg-emerald-500/5 border-emerald-500/20 rounded-none">
        <Shield className="h-4 w-4 text-emerald-400" />
        <AlertDescription className="text-[10px] uppercase tracking-widest leading-relaxed font-mono">
          <p className="text-white font-bold mb-1">
            Núcleo Local WebGPU
          </p>
          <p className="text-zinc-500">
            O modelo carrega no seu navegador via WebGPU. Nenhuma chamada
            externa — privacidade absoluta. Requer Chrome 113+ com GPU.
          </p>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          MODELO LOCAL
        </Label>
        <Select
          value={selectedModel}
          onValueChange={setSelectedModel}
          disabled={isLoading || isInitialized}
        >
          <SelectTrigger className="bg-background border-border rounded-none text-xs h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border rounded-none">
            {availableModels.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                <div className="flex flex-col py-1">
                  <span className="font-bold text-[10px] uppercase">
                    {m.name}
                  </span>
                  <span className="text-[8px] opacity-60 uppercase tracking-tighter">
                    {m.size} · {m.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-3 p-4 bg-muted/20 border border-border">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-mono">
            <span className="text-muted-foreground">Carregando modelo</span>
            <span className="text-foreground font-bold">{loadProgress}%</span>
          </div>
          <Progress value={loadProgress} className="h-1" />
        </div>
      )}

      {isInitialized && (
        <div className="flex items-center gap-3 p-4 border border-emerald-500/20 bg-emerald-500/5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold font-mono">
            Engine local online
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {!isInitialized ? (
          <Button
            onClick={initializeEngine}
            disabled={isLoading}
            className="flex-1 bg-white text-black hover:bg-gray-200 rounded-none h-11 font-mono text-[11px] uppercase tracking-[0.2em]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-3 animate-spin" />
                Inicializando...
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4 mr-3" />
                Inicializar IA Local
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={unloadEngine}
            variant="ghost"
            className="flex-1 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-none h-11 font-mono text-[11px] uppercase tracking-widest"
          >
            <Trash2 className="h-4 w-4 mr-3" />
            Desligar engine
          </Button>
        )}
      </div>

      <div className="p-4 bg-muted/10 border border-border space-y-3">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 font-mono">
          Requisitos
        </p>
        <ul className="space-y-2 font-mono">
          {[
            'Chrome 113+ ou Edge com WebGPU',
            'Mín. 4GB RAM dedicada',
            'GPU NVIDIA, AMD ou Apple Silicon',
            'Banda larga para download inicial (~2GB)',
          ].map((req) => (
            <li
              key={req}
              className="flex items-center gap-2 text-[8px] text-muted-foreground uppercase tracking-widest"
            >
              <div className="h-0.5 w-1 bg-muted-foreground" />
              {req}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
