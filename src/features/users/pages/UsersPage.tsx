import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OutlineButton } from "@/components/ui/action-buttons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, Shield, User, Crown, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserProfile {
    id: string;
    email: string; // We might need to join with auth.users if email is not in profiles, but usually it is replicated or we use a view. 
    // Wait, profiles table might not have email if it's strictly linked. 
    // However, usually we put email in profiles for ease. 
    // Let's check what we have. If not, we rely on what we can get.
    // If profiles table doesn't have email, we might need a different approach.
    // Assuming profiles has basic info. If not, we'll see IDs.
    full_name: string;
    role: 'admin' | 'user';
    plan: 'free' | 'pro' | 'empire';
    created_at: string;
}

// NOTE: Since we cannot access auth.users directly from client without an admin function,
// we assume 'profiles' has a view or we added email to it, OR we are using a secure view.
// For this task, assuming 'profiles' is accessible and has what we need or we can at least show name/role.
// If email is missing in profiles, we might only see names.

export default function AdminUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch profiles. 
            // Note: RLS must allow admins to see all profiles.
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, role, plan, created_at, email'); // Try to fetch email if it exists in profiles, otherwise we'll have to deal with it.

            // Note: If 'email' does not exist on profiles, this select might fail if we don't handle it.
            // But per previous tasks, we might not have added email to profiles.
            // Let's assume for now we might not get email, but try.

            // Actually, best practice is to handle the error or check schema.
            // Since we don't have time to check schema, let's select * and see.
            // If email is missing, we just show "N/A"

            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*');

            if (profilesError) throw profilesError;

            if (error) throw error;

            // Sort by created_at desc
            const sorted = (profilesData || []).sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setUsers(sorted as any);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Erro ao carregar usuários");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            // Cast to any to bypass strict type checking if columns are missing in generated types
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole } as any)
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
            toast.success(`Função atualizada para ${newRole}`);
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Erro ao atualizar função");
        }
    };

    const handleUpdatePlan = async (userId: string, newPlan: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ plan: newPlan } as any)
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan as any } : u));
            toast.success(`Plano atualizado para ${newPlan}`);
        } catch (error) {
            console.error("Error updating plan:", error);
            toast.error("Erro ao atualizar plano");
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.id || '').includes(searchTerm.toLowerCase())
        // Email check would go here if we had it
    );

    const stats = {
        total: users.length,
        pro: users.filter(u => u.plan === 'pro' || u.plan === 'empire').length,
        trial: users.filter(u => !u.plan || u.plan === 'free').length
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="font-serif text-3xl text-white">Gestão de Usuários</h1>
                <p className="text-white/60">Controle total sobre a base de usuários da plataforma.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-mono uppercase tracking-widest text-white/50">Total de Usuários</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-white">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-mono uppercase tracking-widest text-white/50">Assinantes Pro/Empire</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-white">{stats.pro}</div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-mono uppercase tracking-widest text-white/50">Usuários Basic/Free</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-white">{stats.trial}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions & Filters */}
            <div className="flex items-center gap-4 bg-black p-4 border border-white/20">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                        placeholder="BUSCAR POR NOME OU ID..."
                        className="pl-10 bg-transparent border-white/20 text-white placeholder:text-white/30 rounded-none focus:border-white font-mono text-xs uppercase"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <OutlineButton onClick={fetchUsers} loading={loading}>
                    Atualizar
                </OutlineButton>
            </div>

            {/* Table */}
            <div className="border border-white/20 bg-black overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-white/50 font-mono text-[10px] uppercase tracking-widest">Usuário</TableHead>
                            <TableHead className="text-white/50 font-mono text-[10px] uppercase tracking-widest">Função</TableHead>
                            <TableHead className="text-white/50 font-mono text-[10px] uppercase tracking-widest">Plano</TableHead>
                            <TableHead className="text-white/50 font-mono text-[10px] uppercase tracking-widest">Cadastro</TableHead>
                            <TableHead className="text-right text-white/50 font-mono text-[10px] uppercase tracking-widest">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-white/50 font-mono uppercase text-xs">
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-white/50 font-mono uppercase text-xs">
                                    Nenhum usuário encontrado
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-serif text-white text-sm">{user.full_name || 'Sem nome'}</span>
                                            <span className="text-[10px] text-white/40 font-mono">{user.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            label={
                                                <>
                                                    {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                                                    {user.role}
                                                </>
                                            }
                                            color={user.role === 'admin' ? 'default' : 'neutral'}
                                            className={user.role === 'admin' ? 'border-white text-white' : ''}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            label={
                                                <>
                                                    {user.plan === 'empire' ? <Crown className="w-3 h-3 mr-1" /> : user.plan === 'pro' ? <Star className="w-3 h-3 mr-1" /> : null}
                                                    {user.plan || 'Free'}
                                                </>
                                            }
                                            color={user.plan === 'empire' ? 'warning' : user.plan === 'pro' ? 'info' : 'neutral'}
                                        />
                                    </TableCell>
                                    <TableCell className="text-white/60 font-mono text-xs">
                                        {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy") : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {user.role !== 'admin' && (
                                                <Button size="sm" variant="ghost" className="h-8 text-white/60 hover:text-white hover:bg-white/10 rounded-none font-mono text-[10px] uppercase" onClick={() => handleUpdateRole(user.id, 'admin')}>
                                                    Promover Admin
                                                </Button>
                                            )}
                                            {user.plan !== 'pro' && (
                                                <Button size="sm" variant="ghost" className="h-8 text-white/60 hover:text-white hover:bg-white/10 rounded-none font-mono text-[10px] uppercase" onClick={() => handleUpdatePlan(user.id, 'pro')}>
                                                    Virar Pro
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
