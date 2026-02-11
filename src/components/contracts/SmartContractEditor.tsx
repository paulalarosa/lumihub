import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
    Bold,
    Italic,
    List,
    Heading2,
    Undo,
    Redo,
    Sparkles,
    Bot,
    Gavel,
    AlertTriangle,
    CheckCircle2,
    MessageCircle,
    Loader2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SmartContractEditorProps {
    content: string;
    onChange: (content: string) => void;
    projectId: string | null;
}

export function SmartContractEditor({ content, onChange, projectId }: SmartContractEditorProps) {
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [aiCommand, setAiCommand] = useState('');

    const [projectData, setProjectData] = useState<any>(null);
    const [contractor, setContractor] = useState<any>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4 text-sm leading-relaxed text-white/90',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Fetch Context Data (Project + Contractor)
    useEffect(() => {
        const fetchData = async () => {
            if (!projectId) return;

            // 1. Fetch Project Details
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .select(`
                    *,
                    client:wedding_clients (
                        full_name,
                        email,
                        phone,
                        cpf,
                        address
                    ),
                    services:project_services (
                        service:services (name)
                    )
                `)
                .eq('id', projectId)
                .single();

            if (!projectError && project) {
                setProjectData(project);

                // Toast hint if empty
                if (editor && !editor.getText().trim()) {
                    toast.info("Projeto conectado. Use 'Khaos IA' para gerar o contrato.", {
                        icon: <Sparkles className="w-4 h-4 text-[#00e5ff]" />
                    });
                }
            }

            // 2. Fetch Current User (Contractor) Profile
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, document_id, address, city, state')
                    .eq('id', user.id)
                    .single();
                setContractor(profile);
            }
        };

        fetchData();
    }, [projectId, editor]);

    // Externally controlled content update
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            if (editor.getText().length === 0 && content.length > 0) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);


    const insertClause = (title: string, text: string) => {
        if (!editor) return;

        const clauseHtml = `
            <h3>${title}</h3>
            <p>${text}</p>
        `;

        editor.chain().focus().insertContent(clauseHtml).run();
        toast.success("Cláusula adicionada!");
    };

    const handleGenerateTemplate = async () => {
        if (!editor || !projectData) return;
        setIsAiGenerating(true);

        try {
            // Prepare Context
            const servicesList = projectData.services?.map(s => s.service?.name).join(', ') || 'Serviços Gerais';

            const payload = {
                mode: 'ARCHITECT',
                actors: {
                    contractor_name: contractor?.full_name || "KHAOS SYSTEMS (Prestador)",
                    contractor_doc: contractor?.document_id || "000.000.000-00",
                    client_name: projectData.client?.full_name || "Cliente",
                    client_doc: projectData.client?.cpf || "000.000.000-00",
                },
                terms: {
                    date: projectData.event_date ? new Date(projectData.event_date).toLocaleDateString('pt-BR') : 'A Definir',
                    price: projectData.budget ? projectData.budget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
                    services: servicesList,
                    location: projectData.event_location || 'Local a Definir'
                }
            };

            const { data, error } = await supabase.functions.invoke('generate-contract-ai', {
                body: payload
            });

            if (error) throw error;

            if (data?.text) {
                editor.commands.setContent(data.text);
                toast.success("Contrato Gerado pela Khaos IA", {
                    description: "Estrutura jurídica aplicada com sucesso."
                });
            }

        } catch (error) {
            console.error(error);
            toast.error("Erro na geração", { description: "Verifique sua conexão ou tente novamente." });
        } finally {
            setIsAiGenerating(false);
        }
    };

    const handleRefine = async () => {
        if (!editor || !aiCommand.trim()) return;
        setIsRefining(true);

        try {
            const currentText = editor.getHTML(); // Getting HTML to preserve structure if AI supports it, or getText if raw needed. Function handles text.
            // Edge function expects 'current_text' and 'instruction'

            const { data, error } = await supabase.functions.invoke('generate-contract-ai', {
                body: {
                    mode: 'EDITOR',
                    current_text: currentText,
                    instruction: aiCommand
                }
            });

            if (error) throw error;

            if (data?.text) {
                editor.commands.setContent(data.text);
                setAiCommand('');
                toast.success("Contrato Refinado", {
                    description: "Alterações aplicadas pela Khaos IA."
                });
            }

        } catch (error) {
            console.error(error);
            toast.error("Erro na refinamento");
        } finally {
            setIsRefining(false);
        }
    };

    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[600px]">
            {/* Editor Area */}
            <div className="flex-1 flex flex-col border border-white/10 rounded-none bg-black overflow-hidden relative">
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-black">
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} className={`rounded-none h-8 w-8 ${editor.isActive('bold') ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>
                        <Bold className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} className={`rounded-none h-8 w-8 ${editor.isActive('italic') ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>
                        <Italic className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`rounded-none h-8 w-8 ${editor.isActive('heading', { level: 2 }) ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>
                        <Heading2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`rounded-none h-8 w-8 ${editor.isActive('bulletList') ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>
                        <List className="w-4 h-4" />
                    </Button>
                    <div className="flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} className="rounded-none h-8 w-8 text-white hover:bg-white/10">
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} className="rounded-none h-8 w-8 text-white hover:bg-white/10">
                        <Redo className="w-4 h-4" />
                    </Button>
                </div>

                {/* Editor Content */}
                <ScrollArea className="flex-1">
                    <EditorContent editor={editor} className="h-full min-h-[500px]" />
                </ScrollArea>

                {/* Footer Status */}
                <div className="px-4 py-3 bg-black border-t border-white/10 flex justify-between items-center">
                    <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">{editor.storage.characterCount?.characters()} CARACTERES</span>
                    <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-none rotate-45 ${projectData ? 'bg-[#00e5ff]' : 'bg-white/20'}`} />
                        <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
                            {projectData ? "KHAOS SYNC ATIVO" : "AGUARDANDO PROJETO"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Sidebar: Smart Clauses & AI */}
            <div className="w-full md:w-72 flex flex-col gap-6">

                {/* Khaos AI Action */}
                <div className="p-0 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-xs text-white/50 uppercase tracking-widest">Khaos Intelligence</h3>
                        <Bot className="w-4 h-4 text-[#00e5ff]" />
                    </div>

                    <Button
                        className="w-full bg-black hover:bg-white hover:text-black border border-white text-white rounded-none h-12 transition-all duration-300 font-mono text-xs uppercase tracking-widest group"
                        onClick={handleGenerateTemplate}
                        disabled={!projectId || isAiGenerating}
                    >
                        {isAiGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2 text-[#00e5ff] group-hover:text-black" />}
                        {isAiGenerating ? "PROCESSANDO..." : "GERAR COM IA"}
                    </Button>

                    <p className="text-[10px] text-white/30 font-mono leading-relaxed border-l border-white/10 pl-3">
                        Khaos IA irá analisar os dados do projeto e gerar uma minuta jurídica completa.
                    </p>
                </div>

                <Separator className="bg-white/10" />

                {/* Refine Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-xs text-white/50 uppercase tracking-widest">Refinar / Editar</h3>
                        <MessageCircle className="w-3 h-3 text-white/50" />
                    </div>

                    <div className="flex gap-2">
                        <Input
                            value={aiCommand}
                            onChange={(e) => setAiCommand(e.target.value)}
                            placeholder="Ex: Altere a multa para 20%..."
                            className="bg-black border-white/20 rounded-none text-white font-mono text-[10px] h-9 focus:border-white placeholder:text-white/20"
                            onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                        />
                        <Button
                            onClick={handleRefine}
                            disabled={isRefining || !aiCommand}
                            variant="secondary"
                            className="rounded-none h-9 px-3 bg-white text-black hover:bg-gray-200"
                        >
                            {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-black" />}
                        </Button>
                    </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Smart Clauses */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <Gavel className="w-4 h-4 text-white" />
                        <h3 className="font-mono text-xs text-white uppercase tracking-widest">CLÁUSULAS RÁPIDAS</h3>
                    </div>

                    <ScrollArea className="flex-1 pr-2 -mr-2">
                        <div className="space-y-3">
                            <ClauseButton
                                title="TAXA DE DESLOCAMENTO"
                                icon={<AlertTriangle className="w-3 h-3" />}
                                onClick={() => insertClause("TAXA DE DESLOCAMENTO", "Fica estabelecido que despesas de deslocamento e hospedagem (se necessário) correrão por conta exclusiva da CONTRATANTE.")}
                            />
                            <ClauseButton
                                title="MAQUIAGEM ADICIONAL"
                                icon={<Sparkles className="w-3 h-3" />}
                                onClick={() => insertClause("MAQUIAGEM ADICIONAL", "Serviços adicionais solicitados no dia do evento estarão sujeitos à disponibilidade de tempo e serão cobrados conforme tabela vigente.")}
                            />
                            <ClauseButton
                                title="FORÇA MAIOR"
                                icon={<ShieldIcon className="w-3 h-3" />}
                                onClick={() => insertClause("FORÇA MAIOR", "Em caso de impedimento por saúde da CONTRATADA, esta compromete-se a indicar profissional de mesma competência para a execução do serviço.")}
                            />
                            <ClauseButton
                                title="DIREITO DE IMAGEM"
                                icon={<CheckCircle2 className="w-3 h-3" />}
                                onClick={() => insertClause("DIREITO DE IMAGEM", "A CONTRATANTE autoriza o uso de sua imagem para fins de divulgação do portfólio da CONTRATADA, em redes sociais e site oficial.")}
                            />
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}

function ClauseButton({ title, icon, onClick }: { title: string, icon: React.ReactNode, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3 text-left bg-black border border-white/20 hover:bg-white hover:text-black transition-all group rounded-none"
        >
            <div className="text-white group-hover:text-black transition-colors">
                {icon}
            </div>
            <span className="font-mono text-[10px] text-white group-hover:text-black uppercase tracking-wider transition-colors">
                {title}
            </span>
        </button>
    );

}
// Icon helper
function ShieldIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
    )
}
