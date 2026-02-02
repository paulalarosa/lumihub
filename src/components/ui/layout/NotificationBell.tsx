import { Bell, Check, Calendar, DollarSign, Users, Info } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

export function NotificationBell() {
    const { user } = useAuth();
    const { notifications, unreadCount, markAsRead, loading } = useNotifications(user?.id);
    const { t } = useLanguage();

    if (!user) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'event': return <Calendar className="h-4 w-4 text-white" />;
            case 'payment': return <DollarSign className="h-4 w-4 text-white" />;
            case 'commission': return <Users className="h-4 w-4 text-white" />;
            default: return <Info className="h-4 w-4 text-white" />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:text-white hover:bg-white/10 rounded-none">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-600 animate-pulse rounded-none" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-black border-white/20 text-white rounded-none shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/20">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-white">{t("lbl_notifications")}</h4>
                    {unreadCount > 0 && <Badge variant="outline" className="bg-white text-black text-[10px] rounded-none border-0 font-mono">{unreadCount} NEW</Badge>}
                </div>
                <ScrollArea className="h-[300px]">
                    {loading ? (
                        <div className="p-4 text-center text-xs font-mono text-gray-500 uppercase">Start...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-xs font-mono uppercase tracking-widest">NO_NOTIFICATIONS</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="p-4 border-b border-white/10 hover:bg-white/5 transition-colors flex items-start gap-3 group"
                                >
                                    <div className="mt-1 bg-white/10 p-2 rounded-none border border-white/10">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-xs font-bold uppercase tracking-wide leading-none">{notification.title}</p>
                                        <p className="text-[10px] font-mono text-gray-400 uppercase">{notification.description}</p>
                                        {notification.link && (
                                            <Link to={notification.link} className="text-[10px] text-white hover:underline decoration-white underline-offset-2 font-mono uppercase">
                                                DETAILS -&gt;
                                            </Link>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-gray-500 hover:text-white hover:bg-white/10 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => markAsRead(notification.id)}
                                        title={t("btn_mark_read")}
                                    >
                                        <Check className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
