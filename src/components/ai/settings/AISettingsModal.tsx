import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Key, Cpu, Sliders, X } from 'lucide-react';
import { APIKeysSettings } from './APIKeysSettings';
import { LocalAISettings } from './LocalAISettings';
import { GeneralAISettings } from './GeneralAISettings';

interface AISettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AISettingsModal = ({ isOpen, onClose }: AISettingsModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-black border border-white/10 max-w-3xl h-[600px] overflow-hidden flex flex-col p-0 rounded-none shadow-2xl">
                {/* Superior Header - Serialized */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-950/50">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white/5 border border-white/10 flex items-center justify-center rounded-none rotate-45">
                            <Settings className="w-5 h-5 text-white -rotate-45" />
                        </div>
                        <div>
                            <DialogTitle className="text-[12px] font-black font-mono tracking-[0.3em] text-white uppercase">
                                System_Configuration_Manifest
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Protocol: AI_ADMIN_SUITE</span>
                                <div className="h-1 w-1 bg-zinc-800 rounded-full" />
                                <span className="text-[8px] font-mono text-zinc-500 uppercase">v4.0.1</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Configuration Core */}
                <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="bg-zinc-950 w-full justify-start rounded-none border-b border-white/5 h-12 p-0 px-6 gap-6">
                        <TabsTrigger
                            value="general"
                            className="gap-3 data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-600 rounded-none border-none h-full px-0 font-mono text-[9px] uppercase tracking-[0.2em] font-bold border-b-2 data-[state=active]:border-white border-transparent transition-all"
                        >
                            <Sliders className="w-3.5 h-3.5" />
                            General_Params
                        </TabsTrigger>
                        <TabsTrigger
                            value="keys"
                            className="gap-3 data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-600 rounded-none border-none h-full px-0 font-mono text-[9px] uppercase tracking-[0.2em] font-bold border-b-2 data-[state=active]:border-white border-transparent transition-all"
                        >
                            <Key className="w-3.5 h-3.5" />
                            Neural_Keys_(BYOK)
                        </TabsTrigger>
                        <TabsTrigger
                            value="local"
                            className="gap-3 data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-600 rounded-none border-none h-full px-0 font-mono text-[9px] uppercase tracking-[0.2em] font-bold border-b-2 data-[state=active]:border-white border-transparent transition-all"
                        >
                            <Cpu className="w-3.5 h-3.5" />
                            Edge_Inference_Engine
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto modern-scroll p-8 bg-black/40">
                        <TabsContent value="general" className="mt-0 outline-none">
                            <GeneralAISettings />
                        </TabsContent>

                        <TabsContent value="keys" className="mt-0 outline-none">
                            <APIKeysSettings />
                        </TabsContent>

                        <TabsContent value="local" className="mt-0 outline-none">
                            <LocalAISettings />
                        </TabsContent>
                    </div>
                </Tabs>

                {/* Serialized Footer */}
                <div className="p-4 bg-zinc-950 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4 opacity-30">
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => <div key={i} className="h-0.5 w-4 bg-white" />)}
                        </div>
                        <span className="text-[7px] font-mono text-white uppercase tracking-widest font-black">
                            System_Integrity: VERIFIED_ENCRYPTED
                        </span>
                    </div>
                    <p className="text-[7px] font-mono text-zinc-700 uppercase tracking-tighter">
                        Authorized Personnel Only • Khaos Kontrol AI v4.0.1
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
