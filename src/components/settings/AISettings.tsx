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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Cpu, Key, Sparkles, Bot, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useAI } from '@/hooks/useAI'
import { Switch } from '@/components/ui/switch'

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

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card rounded-none shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <Bot className="h-5 w-5" />
            Bring Your Own Key (BYOK)
          </CardTitle>
          <CardDescription className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Configure seu próprio provedor de IA para total privacidade e
            controle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border border-zinc-800 bg-zinc-900/50 mb-6">
            <div className="space-y-0.5">
              <Label className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="h-3 w-3 text-emerald-500" /> PRIVACIDADE
                TOTAL
              </Label>
              <p className="text-[9px] text-muted-foreground font-mono uppercase">
                Executar IA localmente no navegador (WebGPU)
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
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="p-4 border border-blue-500/20 bg-blue-500/5 mb-6">
                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
                  <p className="text-xs text-blue-200/70 font-mono uppercase leading-relaxed">
                    Suas chaves são armazenadas de forma segura e usadas apenas
                    para processar suas solicitações. O KhaosKontrol não
                    armazena o conteúdo das suas conversas permanentemente nos
                    modelos base.
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
                  </Label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="rounded-none border-border bg-background focus-visible:ring-0 font-mono text-xs uppercase text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="h-3 w-3" /> MODELO PREFERIDO
                  </Label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={
                      provider === 'google' ? 'gemini-1.5-pro' : 'gpt-4-turbo'
                    }
                    className="rounded-none border-border bg-background focus-visible:ring-0 font-mono text-xs uppercase text-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-emerald-500/20 bg-emerald-500/5 space-y-6 animate-in slide-in-from-top-2 duration-500 text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center rotate-45 mb-4">
                  <Bot className="h-8 w-8 text-emerald-400 -rotate-45" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-emerald-400 uppercase text-lg">
                    Núcleo Local WebGPU
                  </h3>
                  <p className="text-xs text-emerald-200/50 font-mono uppercase leading-relaxed max-w-sm mx-auto">
                    Modo Local Ativo. O modelo será carregado via WebLLM
                    diretamente no seu hardware. Privacidade absoluta garantida.
                  </p>
                </div>
                <div className="pt-4 border-t border-emerald-500/10 w-full max-w-[200px]">
                  <p className="text-[9px] text-emerald-400/30 font-mono uppercase">
                    Status: Aguardando Inicialização
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-6 border-t border-border mt-8">
            <Button
              onClick={onSave}
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
            SISTEMA_AGNOSTICO_V2.0 // KHAOS_KONTROL_PROTOCOL
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
