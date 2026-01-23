
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import { useAssistants, Assistant } from '../hooks/useAssistants';
import { AssistantList } from '../components/AssistantList';
import { AssistantDialog } from '../components/AssistantDialog';

export default function AssistantsPage() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { assistants, isLoading, createAssistant, updateAssistant, deleteAssistant } = useAssistants();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/auth');
        }
    }, [user, authLoading, navigate]);

    const handleOpenDialog = (assistant?: Assistant) => {
        setEditingAssistant(assistant || null);
        setDialogOpen(true);
    };

    const handleSave = async (data: { name: string, email: string | null, phone: string | null }) => {
        if (editingAssistant) {
            await updateAssistant({ id: editingAssistant.id, ...data });
        } else {
            await createAssistant(data);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta assistente?')) {
            await deleteAssistant(id);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950">
                <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
            {/* Header */}
            <header className="border-b border-white/10 bg-[#050505]">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link to="/agenda">
                                <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-none text-white">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white flex items-center justify-center rounded-none shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                    <Users className="h-5 w-5 text-black" />
                                </div>
                                <div>
                                    <h1 className="font-serif text-2xl text-white tracking-wide">
                                        Equipe
                                    </h1>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">
                                        Gerenciamento
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button onClick={() => handleOpenDialog()} className="gap-2 bg-white text-black hover:bg-gray-200 rounded-none border border-transparent font-semibold uppercase tracking-wider text-xs px-6">
                            <Plus className="h-4 w-4" />
                            Nova Assistente
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <Card className="bg-[#0A0A0A] border-white/5 rounded-none shadow-none">
                    <CardHeader>
                        <CardTitle className="font-serif text-xl tracking-wide text-white">Minhas Assistentes</CardTitle>
                        <CardDescription className="text-gray-500 font-mono text-xs uppercase tracking-wider">
                            Gerencie suas assistentes e envie convites para elas acessarem a agenda
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {assistants.length === 0 && !isLoading ? (
                            <div className="text-center py-20 border border-dashed border-white/10 bg-white/[0.02]">
                                <Users className="h-12 w-12 mx-auto text-gray-700 mb-4" />
                                <p className="text-gray-400 mb-6 font-light">
                                    Nenhuma assistente cadastrada
                                </p>
                                <Button onClick={() => handleOpenDialog()} variant="outline" className="border-white/20 text-white hover:bg-white hover:text-black rounded-none uppercase text-xs tracking-widest">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Cadastrar Primeira
                                </Button>
                            </div>
                        ) : (
                            <AssistantList
                                assistants={assistants}
                                onEdit={handleOpenDialog}
                                onDelete={handleDelete}
                                isLoading={isLoading}
                            />
                        )}
                    </CardContent>
                </Card>
            </main>

            <AssistantDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                assistant={editingAssistant}
                onSave={handleSave}
            />
        </div>
    );
}
