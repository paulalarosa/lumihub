import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContracts } from '@/hooks/useContracts';
import { useProjects } from '@/hooks/useProjects';
import { Loader2, Upload, FileText, Sparkles, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { SmartContractEditor } from './SmartContractEditor';

interface ContractDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultProjectId?: string;
}

export function ContractDialog({ open, onOpenChange, defaultProjectId }: ContractDialogProps) {
    const { createContract, uploadContractFile, loading: isSaving } = useContracts();
    const { projects } = useProjects();

    const [mode, setMode] = useState<'digital' | 'upload'>('digital');
    const [projectId, setProjectId] = useState(defaultProjectId || '');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setProjectId(defaultProjectId || '');
            setTitle('');
            setContent('');
            setFile(null);
            setMode('digital');
        }
    }, [open, defaultProjectId]);

    const handleSubmit = async () => {
        if (!projectId || !title) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        try {
            let attachmentUrl = null;

            if (mode === 'upload') {
                if (!file) {
                    toast.error('Selecione um arquivo PDF');
                    return;
                }
                const path = await uploadContractFile(file);
                attachmentUrl = path;
            } else {
                if (!content || content === '<p></p>') {
                    toast.error('Adicione o conteúdo do contrato');
                    return;
                }
            }

            await createContract({
                project_id: projectId,
                title,
                content: mode === 'digital' ? content : undefined,
                status: 'draft',
                attachment_url: attachmentUrl || undefined
            });

            onOpenChange(false);
            toast.success("Contrato salvo com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar contrato");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] w-[95vw] h-[90vh] sm:h-auto bg-[#050505] text-white border-white/10 flex flex-col rounded-none p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-white/10 bg-black/50">
                    <div className="flex items-center gap-3">
                        <Bot className="w-5 h-5 text-white" />
                        <DialogTitle className="text-2xl font-serif font-light tracking-wide text-white">NOVO CONTRATO INTELIGENTE</DialogTitle>
                    </div>
                    <DialogDescription className="text-white/40 font-mono text-xs uppercase tracking-widest">
                        Crie contratos com auxílio da Khaos IA ou faça upload.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-6 px-6 space-y-8 bg-[#050505]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-white/40 font-mono text-[10px] uppercase tracking-widest">Projeto Vinculado</Label>
                            <select
                                className="w-full h-12 bg-transparent border-b border-white/20 rounded-none px-0 text-sm text-white focus:outline-none focus:border-white transition-colors font-mono"
                                value={projectId}
                                onChange={e => setProjectId(e.target.value)}
                            >
                                <option value="" disabled className="bg-black text-gray-500">SELECIONE UM PROJETO...</option>
                                {projects?.map((project: { id: string; name: string; client?: { full_name: string } }) => (
                                    <option key={project.id} value={project.id} className="bg-black text-white">
                                        {project.name} {project.client?.full_name ? `// ${project.client.full_name}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-white/40 font-mono text-[10px] uppercase tracking-widest">Título do Documento</Label>
                            <Input
                                placeholder="EX: CONTRATO DE PRESTAÇÃO DE SERVIÇOS"
                                className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 text-white focus:border-white focus:ring-0 placeholder:text-white/20 font-mono text-sm h-12"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <Tabs value={mode} onValueChange={(v) => setMode(v as 'digital' | 'upload')} className="w-full flex-1 flex flex-col">
                        <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-white/10 p-0 h-auto rounded-none">
                            <TabsTrigger
                                value="digital"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-white/40 font-mono text-xs uppercase tracking-widest py-3 transition-all"
                            >
                                <Sparkles className="w-3 h-3 mr-2" />
                                Editor Inteligente (Khaos IA)
                            </TabsTrigger>
                            <TabsTrigger
                                value="upload"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-white/40 font-mono text-xs uppercase tracking-widest py-3 transition-all"
                            >
                                <Upload className="w-3 h-3 mr-2" />
                                Upload de PDF
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="digital" className="mt-8 flex-1">
                            <SmartContractEditor
                                content={content}
                                onChange={setContent}
                                projectId={projectId}
                            />
                        </TabsContent>

                        <TabsContent value="upload" className="mt-8">
                            <div className="border border-dashed border-white/20 h-[400px] flex flex-col items-center justify-center bg-white/[0.02] hover:bg-white/[0.05] transition-colors group cursor-pointer relative">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={e => {
                                        if (e.target.files?.[0]) setFile(e.target.files[0]);
                                    }}
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center p-6 w-full h-full justify-center absolute inset-0 z-10">
                                    {file ? (
                                        <>
                                            <div className="w-16 h-16 border border-white/20 flex items-center justify-center mb-6 bg-black">
                                                <FileText className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="text-white font-serif text-xl tracking-wide">{file.name}</span>
                                            <span className="text-[10px] text-white/40 mt-3 font-mono uppercase tracking-widest group-hover:text-white transition-colors">Clique para trocar arquivo</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 border border-white/10 flex items-center justify-center mb-6 group-hover:border-white/40 transition-colors">
                                                <Upload className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                                            </div>
                                            <span className="text-white/60 font-serif text-lg tracking-wide group-hover:text-white transition-colors">UPLOAD DE PDF</span>
                                            <span className="text-[10px] text-white/30 mt-3 font-mono uppercase tracking-widest">Arraste ou clique para selecionar</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="p-6 border-t border-white/10 bg-black/50 gap-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/40 hover:text-white hover:bg-transparent font-mono text-xs uppercase tracking-widest rounded-none">
                        CANCELAR
                    </Button>
                    <Button
                        className="bg-white text-black hover:bg-white/90 font-mono text-xs uppercase tracking-widest font-bold rounded-none px-8 h-10 border border-transparent"
                        onClick={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : "SALVAR DOCUMENTO"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
