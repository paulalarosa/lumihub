import { useWebLLM } from '@/hooks/useWebLLM'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Cpu, Trash2, Shield, Loader2 } from 'lucide-react'

export const LocalAISettings = () => {
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
        <Shield className="w-4 h-4 text-purple-400" />
        <AlertDescription className="font-mono">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-white font-bold text-xs uppercase tracking-widest mb-1">
                Local AI - Total Privacy Protocol
              </p>
              <p className="text-neutral-400 text-[10px] uppercase tracking-wider">
                Available exclusively on the{' '}
                <span className="text-purple-400 font-bold">Studio Plan</span>
              </p>
            </div>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-none h-8 font-mono text-[9px] uppercase tracking-widest px-4"
              onClick={() => (window.location.href = '/planos')}
            >
              Upgrade_Now
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 font-mono">
      {}
      <Alert className="bg-zinc-900/50 border-white/5 rounded-none">
        <Shield className="w-4 h-4 text-emerald-500/50" />
        <AlertDescription className="text-[10px] uppercase tracking-widest leading-relaxed">
          <p className="text-white font-bold mb-1">
            Local AI Engine Enabled
          </p>
          <p className="text-zinc-500">
            Total privacy protocol: the model executes within your local
            environment using WebGPU. No communication with external neural
            networks is established.
          </p>
        </AlertDescription>
      </Alert>

      {}
      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">
          Neural_Model_Selection
        </label>
        <Select
          value={selectedModel}
          onValueChange={setSelectedModel}
          disabled={isLoading || isInitialized}
        >
          <SelectTrigger className="bg-black border-white/10 rounded-none text-[11px] text-zinc-300 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-white/10 rounded-none">
            {availableModels.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="text-zinc-400 focus:bg-white focus:text-black"
              >
                <div className="flex flex-col py-1">
                  <span className="font-bold text-[10px] uppercase">
                    {model.name}
                  </span>
                  <span className="text-[8px] opacity-60 uppercase tracking-tighter">
                    {model.size} • {model.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {}
      {isLoading && (
        <div className="space-y-3 p-4 bg-zinc-900/30 border border-white/5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
            <span className="text-zinc-500">Initial_Weight_Pull</span>
            <span className="text-white font-bold">{loadProgress}%</span>
          </div>
          <Progress value={loadProgress} className="h-1 bg-zinc-800" />
          <p className="text-[8px] text-zinc-600 animate-pulse uppercase">
            Establishing local neural weights...
          </p>
        </div>
      )}

      {}
      {isInitialized && (
        <div className="flex items-center gap-3 p-4 border border-emerald-500/20 bg-emerald-500/5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
            Local_Engine_Online: Protocol_Standard
          </p>
        </div>
      )}

      {}
      <div className="flex gap-2">
        {!isInitialized ? (
          <Button
            onClick={initializeEngine}
            disabled={isLoading}
            className="flex-1 bg-white text-black hover:bg-zinc-200 rounded-none h-11 text-[11px] font-bold uppercase tracking-[0.2em]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4 mr-3" />
                Initialize_Local_AI
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={unloadEngine}
            variant="ghost"
            className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-none h-11 text-[11px] font-bold uppercase tracking-widest"
          >
            <Trash2 className="w-4 h-4 mr-3" />
            Unload_Engine
          </Button>
        )}
      </div>

      {}
      <div className="p-4 bg-black/40 border border-white/5 space-y-3">
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">
          Hardware_Manifest
        </p>
        <ul className="space-y-2">
          {[
            'WebGPU Compatible Browser (Chrome 113+)',
            'Minimum 4GB Dedicated RAM',
            'NVIDIA, AMD or Apple Silicon GPU',
            'Broadband for initial Weight Transfer (~2GB)',
          ].map((req, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 text-[8px] text-zinc-600 uppercase tracking-widest"
            >
              <div className="h-0.5 w-1 bg-zinc-700" />
              {req}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
