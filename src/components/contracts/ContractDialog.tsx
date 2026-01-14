import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useContracts } from '@/hooks/useContracts';
import { useProjects } from '@/hooks/useProjects';
import { Loader2, Upload, FileText, Sparkles, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

interface ContractDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContractDialog({ open, onOpenChange }: ContractDialogProps) {
    const { createContract, uploadContractFile, loading: isSaving } = useContracts();
    const { projects } = useProjects();

    const [mode, setMode] = useState<'digital' | 'upload'>('digital');
    const [projectId, setProjectId] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setProjectId('');
            setTitle('');
            setContent('');
            setFile(null);
            setMode('digital');
        }
    }, [open]);

    const handleAiSuggest = () => {
        const template =
            `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE BELEZA

CLÁUSULA 1: DO OBJETO
O presente contrato tem como objeto a prestação de serviços de beleza...

CLÁUSULA 2: DO AGENDAMENTO
O serviço será realizado na data agendada...

CLÁUSULA 3: DO CANCELAMENTO
Cancelamentos com menos de 24h implicam em multa...`;
        setContent(template);
        toast.success("Sugestão de contrato gerada!");
    };

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
                if (!content) {
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
            } as any);

            onOpenChange(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] bg-[#121212] text-white border-white/10">
                <DialogHeader>
                    <DialogTitle>Novo Contrato</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Crie um contrato digital ou faça upload de um arquivo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-gray-400">Projeto</Label>
                            <select
                                className="w-full h-10 bg-white/5 border border-white/10 rounded-md px-3 text-sm text-white focus:outline-none focus:border-[#00e5ff]"
                                value={projectId}
                                onChange={e => setProjectId(e.target.value)}
                            >
                                <option value="" disabled>Selecione um projeto</option>
                                {projects?.map((project: any) => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-400">Título</Label>
                            <Input
                                placeholder="Ex: Contrato Noiva"
                                className="bg-white/5 border-white/10 text-white"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-white/5">
                            <TabsTrigger value="digital">📄 Editor Inteligente (IA)</TabsTrigger>
                            <TabsTrigger value="upload">tj Upload de Arquivo (PDF)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="digital" className="space-y-4 mt-4">
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                <span className="text-xs text-gray-400">Utilize IA para agilizar</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10 h-8"
                                    onClick={handleAiSuggest}
                                >
                                    <Sparkles className="w-3 h-3 mr-2" />
                                    Gerar com Lumi IA
                                </Button>
                            </div>

                            <Textarea
                                placeholder="Digite as cláusulas do contrato aqui..."
                                className="min-h-[250px] bg-white/5 border-white/10 text-white font-mono text-sm leading-relaxed"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                        </TabsContent>

                        <TabsContent value="upload" className="mt-4">
                            <div className="border-2 border-dashed border-white/10 rounded-xl h-[250px] flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={e => {
                                        if (e.target.files?.[0]) setFile(e.target.files[0]);
                                    }}
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center p-6 w-full h-full justify-center">
                                    {file ? (
                                        <>
                                            <FileText className="w-12 h-12 text-[#00e5ff] mb-4" />
                                            <span className="text-white font-medium">{file.name}</span>
                                            <span className="text-xs text-gray-400 mt-2">Clique para trocar</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                            <span className="text-gray-300 font-medium">Clique para selecionar</span>
                                            <span className="text-xs text-gray-500 mt-2">Apenas PDF</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="pt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-white">
                        Cancelar
                    </Button>
                    <Button
                        className="bg-white text-black hover:bg-white/90 font-medium min-w-[150px]"
                        onClick={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Salvar Contrato"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
