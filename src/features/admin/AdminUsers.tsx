import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Copy,
  LogIn,
  Shield,
  User,
  MoreHorizontal,
  Lock,
  Unlock,
  RefreshCw,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';

export default function AdminUsers() {
  const { user: adminUser } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [impersonating, setImpersonating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = users.filter(u =>
        (u.full_name?.toLowerCase() || "").includes(lowerQuery) ||
        (u.email?.toLowerCase() || "").includes(lowerQuery) ||
        (u.id?.toLowerCase() || "").includes(lowerQuery)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load user database.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (targetUserId: string) => {
    try {
      setImpersonating(targetUserId);
      // Mock implementation for now as per previous code
      // Call Edge Function to generate session would go here

      toast({
        title: t('admin_ghost_login'),
        description: `Initiating session override for ${targetUserId}...`,
      });

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirect (Mock)
      // window.location.href = '/dashboard';

      setImpersonating(null);
    } catch (error) {
      console.error('Error impersonating user:', error);
      toast({
        title: "Error",
        description: "Failed to initiate ghost session.",
        variant: "destructive"
      });
      setImpersonating(null);
    }
  };

  const handleResetPassword = async (email: string) => {
    toast({
      title: t('admin_reset_pass'),
      description: `Recovery email sent to ${email}`,
    });
    await supabase.auth.resetPasswordForEmail(email);
  };

  const handleBlockUser = async (userId: string) => {
    toast({
      title: t('admin_block_user'),
      description: `User ${userId} has been suspended inside the mainframe.`,
      variant: "destructive"
    });
    // Implementation would involve updating a status column
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
        <p className="text-gray-500 font-mono text-xs uppercase animate-pulse">Scanning_User_Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            className="pl-9 bg-white/5 border-white/10 text-white rounded-none focus:border-white focus:ring-0 font-mono text-xs h-10"
            placeholder="SEARCH_DB [NAME, EMAIL, ID]..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} className="rounded-none border-white/20 hover:bg-white hover:text-black">
            <RefreshCw className="h-3 w-3 mr-2" />
            SYNC
          </Button>
        </div>
      </div>

      <Card className="bg-black border border-white/10 rounded-none overflow-hidden">
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left py-3 px-6 text-gray-500 font-mono text-[10px] uppercase tracking-widest font-normal">User / ID</th>
                  <th className="text-left py-3 px-6 text-gray-500 font-mono text-[10px] uppercase tracking-widest font-normal">Role</th>
                  <th className="text-left py-3 px-6 text-gray-500 font-mono text-[10px] uppercase tracking-widest font-normal">{t('header_plans')}</th>
                  <th className="text-left py-3 px-6 text-gray-500 font-mono text-[10px] uppercase tracking-widest font-normal">Reg_Date</th>
                  <th className="text-right py-3 px-6 text-gray-500 font-mono text-[10px] uppercase tracking-widest font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                            {(u.full_name || "?").charAt(0)}
                          </div>
                          <span className="font-serif text-white text-sm">{u.full_name || 'Anonymous User'}</span>
                        </div>
                        <span className="text-xs text-gray-500 pl-8">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className={`rounded-none font-mono text-[10px] uppercase tracking-wider border-white/20 ${u.role === 'admin' ? 'bg-white text-black' : 'text-gray-400'}`}>
                        {u.role === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                        {u.role || 'user'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs text-white/70 uppercase">
                        {u.plan || 'Free'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-xs font-mono">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white hover:text-black rounded-none">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black border border-white/20 rounded-none text-white w-48">
                          <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Operations</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-white hover:text-black focus:bg-white focus:text-black rounded-none font-mono text-xs"
                            onClick={() => handleImpersonate(u.id)}
                          >
                            <LogIn className="mr-2 h-3 w-3" />
                            {t('admin_ghost_login')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-white hover:text-black focus:bg-white focus:text-black rounded-none font-mono text-xs"
                            onClick={() => handleResetPassword(u.email)}
                          >
                            <Lock className="mr-2 h-3 w-3" />
                            {t('admin_reset_pass')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-red-900/50 text-red-500 focus:bg-red-900/50 focus:text-red-500 rounded-none font-mono text-xs"
                            onClick={() => handleBlockUser(u.id)}
                          >
                            <Shield className="mr-2 h-3 w-3" />
                            {t('admin_block_user')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-4 p-4">
            {filteredUsers.map((u) => (
              <div key={u.id} className="bg-black border border-white/20 p-4 rounded-none flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {(u.full_name || "?").charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-serif text-white text-base">{u.full_name || 'Anonymous User'}</span>
                      <span className="text-xs text-gray-500">{u.email}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`rounded-none font-mono text-[10px] uppercase tracking-wider border-white/20 ${u.role === 'admin' ? 'bg-white text-black' : 'text-gray-400'}`}>
                    {u.role === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Plan</span>
                    <span className="text-xs text-white uppercase font-mono">{u.plan || 'Free'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Registered</span>
                    <span className="text-xs text-white font-mono">{u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '-'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-none border-white/20 hover:bg-white hover:text-black font-mono text-xs uppercase"
                    onClick={() => handleImpersonate(u.id)}
                  >
                    <LogIn className="mr-2 h-3 w-3" />
                    {t('admin_ghost_login')}
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none border-white/20 hover:bg-white hover:text-black font-mono text-xs uppercase"
                      onClick={() => handleResetPassword(u.email)}
                    >
                      <Lock className="mr-2 h-3 w-3" />
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none border-red-900/50 text-red-500 hover:bg-red-900/80 hover:text-red-400 font-mono text-xs uppercase"
                      onClick={() => handleBlockUser(u.id)}
                    >
                      <Shield className="mr-2 h-3 w-3" />
                      Block
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
