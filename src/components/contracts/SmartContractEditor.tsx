import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading2,
    Undo,
    Redo,
    Sparkles,
    FileText,
    Bot,
    Gavel,
    AlertTriangle,
    CheckCircle2
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
    const [projectData, setProjectData] = useState<any>(null);

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

    // Fetch Project Data for "Auto-Fill Intelligence"
    useEffect(() => {
        const fetchProjectDetails = async () => {
            if (!projectId) return;

            const { data, error } = await supabase
                .from('projects')
                .select(`
                    *,
                    client:clients (
                        full_name,
                        email,
                        phone,
                        cpf,
                        address
                    )
                `)
                .eq('id', projectId)
                .single();

            if (!error && data) {
                setProjectData(data);
                if (editor && !editor.getText().trim()) {
                    // Auto-suggest template if empty
                    toast.info("Projeto detectado! Use 'Lumi IA' para gerar o contrato automaticamente.", {
                        icon: <Sparkles className="w-4 h-4 text-white" />
                    });
                }
            }
        };

        fetchProjectDetails();
    }, [projectId, editor]);

    // Update editor content if prop changes externally (e.g. from parent template)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Basic check to avoid cursor jumps, but for template injection it's fine
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

    const handleGenerateTemplate = () => {
        if (!editor || !projectData) return;
        setIsAiGenerating(true);

        // Simulated AI Generation with Real Data and Formal Legal Tone
        setTimeout(() => {
            const clientName = projectData.client?.full_name || projectData.client?.name || '<strong style="color: #ff4d4d">[PREENCHER NOME]</strong>';
            const clientCPF = projectData.client?.cpf || "________________";
            // Start time placeholder or real data if available (assuming projectData might have it, otherwise placeholder)
            const startTime = projectData.event_time ? projectData.event_time.slice(0, 5) : '<strong style="color: #ff4d4d">[DEFINIR HORÁRIO]</strong>';

            const eventDate = projectData.event_date ? new Date(projectData.event_date).toLocaleDateString('pt-BR') : '<strong style="color: #ff4d4d">[DEFINIR DATA]</strong>';
            const location = projectData.event_location || '<strong style="color: #ff4d4d">[DEFINIR LOCAL]</strong>';
            const value = projectData.budget ? `R$ ${projectData.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '<strong style="color: #ff4d4d">[DEFINIR VALOR]</strong>';

            const template = `
                <h2 style="text-align: center; text-transform: uppercase; margin-bottom: 32px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE BELEZA E MAQUIAGEM ARTÍSTICA</h2>
                
                <p style="margin-bottom: 24px;">
                    <strong>CONTRATADA:</strong> LUMI STUDIOS, com sede em [Cidade/UF].<br>
                    <strong>CONTRATANTE:</strong> ${clientName}, portadora do CPF ${clientCPF}.
                </p>

                <ol style="padding-left: 20px;">
                    <li style="margin-bottom: 16px;"><strong>OBJETO:</strong> Prestação de serviços de maquiagem profissional para o evento designado em <strong>${eventDate}</strong>, no local <strong>${location}</strong>.</li>
                    
                    <li style="margin-bottom: 16px;"><strong>CRONOGRAMA:</strong> O serviço terá início impreterivelmente às <strong>${startTime}</strong>. Atrasos superiores a 15 minutos pela CONTRATANTE implicarão em [AJUSTE DE TAXA].</li>
                    
                    <li style="margin-bottom: 16px;"><strong>VALORES:</strong> O valor total do pacote é de <strong>${value}</strong>, com sinal de 30% para reserva de data.</li>
                    
                    <li style="margin-bottom: 16px;"><strong>CANCELAMENTO:</strong> Em caso de desistência pela CONTRATANTE, o valor do sinal não será restituído, visando cobrir o custo de oportunidade da data bloqueada.</li>
                    
                    <li style="margin-bottom: 16px;"><strong>DIREITO DE IMAGEM:</strong> A CONTRATANTE autoriza o uso de fotografias dos serviços para fins de portfólio profissional em meios digitais.</li>
                </ol>
                
                <p style="text-align: center; margin-top: 60px;">_________________________, _____ de ___________________ de 20____.</p>

                <div style="display: flex; justify-content: space-between; margin-top: 60px;">
                    <div style="text-align: center; width: 45%; border-top: 1px solid white; padding-top: 8px;">
                        <p style="text-transform: uppercase;">LUMI STUDIOS</p>
                        <p style="font-size: 10px; opacity: 0.6;">CONTRATADA</p>
                    </div>
                    <div style="text-align: center; width: 45%; border-top: 1px solid white; padding-top: 8px;">
                        <p style="text-transform: uppercase;">${clientName.replace(/<[^>]*>/g, '')}</p>
                        <p style="font-size: 10px; opacity: 0.6;">CONTRATANTE</p>
                    </div>
                </div>
            `;

            editor.commands.setContent(template);
            setIsAiGenerating(false);
            toast.success("Contrato Formal Gerado com Sucesso", {
                description: "Lumi IA aplicou os protocolos jurídicos e preencheu os dados disponíveis."
            });
        }, 1500);
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
                    <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`rounded-none h-8 w-8 ${editor.isActive('underline') ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>
                        <div className="underline">U</div>
                    </Button>
                    <Separator orientation="vertical" className="mx-2 h-4 bg-white/20" />
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
                        <div className={`w-1.5 h-1.5 rounded-none rotate-45 ${projectData ? 'bg-white' : 'bg-white/20'}`} />
                        <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
                            {projectData ? "DADOS SINCRONIZADOS" : "AGUARDANDO PROJETO"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Sidebar: Smart Clauses & AI */}
            <div className="w-full md:w-72 flex flex-col gap-6">

                {/* Lumi AI Action */}
                <div className="p-0 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-xs text-white/50 uppercase tracking-widest">Lumi Intelligence</h3>
                        <Bot className="w-4 h-4 text-white" />
                    </div>

                    <Button
                        className="w-full bg-black hover:bg-white hover:text-black border border-white text-white rounded-none h-12 transition-all duration-300 font-mono text-xs uppercase tracking-widest group"
                        onClick={handleGenerateTemplate}
                        disabled={!projectId || isAiGenerating}
                    >
                        {isAiGenerating ? <Sparkles className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2 group-hover:text-black" />}
                        {isAiGenerating ? "PROCESSANDO..." : "GERAR COM IA"}
                    </Button>

                    <p className="text-[10px] text-white/30 font-mono leading-relaxed border-l border-white/10 pl-3">
                        O sistema irá gerar um contrato baseado nos dados do projeto selecionado e normas jurídicas vigentes.
                    </p>
                </div>

                <Separator className="bg-white/10" />

                {/* Smart Clauses */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <Gavel className="w-4 h-4 text-white" />
                        <h3 className="font-mono text-xs text-white uppercase tracking-widest">CLÁUSULAS DE ELITE</h3>
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
                                title="PROVA DE MAQUIAGEM"
                                icon={<CheckCircle2 className="w-3 h-3" />}
                                onClick={() => insertClause("PROVA DE MAQUIAGEM", "A prova de maquiagem deverá ser agendada com no mínimo 30 dias de antecedência, conforme disponibilidade da agenda.")}
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
            className="w-full flex items-center gap-3 p-3 text-left bg-black border border-white hover:bg-white hover:text-black transition-all group rounded-none"
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
