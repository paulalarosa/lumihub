import { useAIStore } from '@/stores/useAIStore';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export const GeneralAISettings = () => {
    const { settings, updateSettings } = useAIStore();

    const handleProviderChange = (provider: 'gemini' | 'openai' | 'local') => {
        updateSettings({ provider });
        toast.success(`Protocol_Update: Provider_Set_${provider.toUpperCase()}`);
    };

    const handleModelChange = (model: string) => {
        updateSettings({ model });
        toast.success('Protocol_Update: Neural_Model_Assigned');
    };

    const handleTemperatureChange = (value: number[]) => {
        updateSettings({ temperature: value[0] });
    };

    const handleMaxTokensChange = (value: number[]) => {
        updateSettings({ maxTokens: value[0] });
    };

    const handleLocalAIToggle = (checked: boolean) => {
        updateSettings({ useLocalAI: checked });
        toast.success(checked ? 'System_Protocol: Local_Inference_Online' : 'System_Protocol: Cloud_Inference_Online');
    };

    const geminiModels = [
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Exp)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ];

    const openaiModels = [
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ];

    const currentModels = settings.provider === 'gemini' ? geminiModels : openaiModels;

    return (
        <div className="space-y-8 font-mono">
            {/* Provider Selection */}
            <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Primary_Neural_Provider</Label>
                <Select
                    value={settings.provider}
                    onValueChange={handleProviderChange}
                    disabled={settings.useLocalAI}
                >
                    <SelectTrigger className="bg-black border-white/10 rounded-none text-zinc-300 h-10">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-white/10 rounded-none">
                        <SelectItem value="gemini" className="text-zinc-400 uppercase text-[10px]">Google Gemini Cloud</SelectItem>
                        <SelectItem value="openai" className="text-zinc-400 uppercase text-[10px]">OpenAI Research Cloud</SelectItem>
                    </SelectContent>
                </Select>
                {settings.useLocalAI && (
                    <p className="text-[8px] text-emerald-500/50 uppercase tracking-widest animate-pulse">
                        Local_AI_Active: Cloud_Providers_Locked
                    </p>
                )}
            </div>

            {/* Model Selection */}
            {!settings.useLocalAI && (
                <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Active_Weight_Cluster</Label>
                    <Select value={settings.model} onValueChange={handleModelChange}>
                        <SelectTrigger className="bg-black border-white/10 rounded-none text-zinc-300 h-10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 rounded-none">
                            {currentModels.map((model) => (
                                <SelectItem key={model.id} value={model.id} className="text-zinc-400 uppercase text-[10px]">
                                    {model.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Temperature */}
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Entropy_Level</Label>
                    <span className="text-[10px] font-bold text-white bg-white/5 px-2 py-0.5 border border-white/10">
                        {settings.temperature.toFixed(1)}
                    </span>
                </div>
                <Slider
                    value={[settings.temperature]}
                    onValueChange={handleTemperatureChange}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                />
                <p className="text-[8px] text-zinc-600 uppercase tracking-widest leading-relaxed">
                    Controls neural variance. Lower values yield deterministic outputs;
                    higher values initiate creative divergent streams.
                </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-5 border-t border-white/5 pt-8">
                <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Serialized_Buffer_Limit</Label>
                    <span className="text-[10px] font-bold text-white bg-white/5 px-2 py-0.5 border border-white/10">
                        {settings.maxTokens} TKN
                    </span>
                </div>
                <Slider
                    value={[settings.maxTokens]}
                    onValueChange={handleMaxTokensChange}
                    min={256}
                    max={4096}
                    step={256}
                    className="w-full"
                />
                <p className="text-[8px] text-zinc-600 uppercase tracking-widest leading-relaxed">
                    Maximum response payload size. High buffer allocation allows for deep reasoning
                    and extensive document synthesis.
                </p>
            </div>

            {/* Local AI Toggle - Brutalist UI */}
            <div className="flex items-center justify-between p-5 bg-zinc-950 border border-white/10 rounded-none mt-4 group hover:border-white/30 transition-all duration-300">
                <div className="flex-1 space-y-1">
                    <Label className="text-[11px] font-black uppercase tracking-[0.25em] text-white">Total_Privacy_Engine</Label>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">
                        Execute_Inference_Locally (Studio_Requirement)
                    </p>
                </div>
                <Switch
                    checked={settings.useLocalAI}
                    onCheckedChange={handleLocalAIToggle}
                    className="data-[state=checked]:bg-emerald-500"
                />
            </div>
        </div>
    );
};
