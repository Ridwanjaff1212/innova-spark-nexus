import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning";
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    
    // Real-time subscription for new announcements
    const channel = supabase
      .channel('announcements-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          const newNotif: Notification = {
            id: payload.new.id,
            title: "📢 New Announcement",
            message: payload.new.title,
            type: "info",
            read: false,
            created_at: payload.new.created_at
          };
          setNotifications(prev => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchNotifications = async () => {
    // Get recent announcements as notifications
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data.map(a => ({
        id: a.id,
        title: a.is_competition ? "🏆 Competition" : "📢 Announcement",
        message: a.title,
        type: a.is_competition ? "warning" : "info",
        read: false,
        created_at: a.created_at || new Date().toISOString()
      })));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 z-50 w-80 glass-card rounded-xl border border-border/50 shadow-xl overflow-hidden"
            >
              <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
                <h3 className="font-display font-semibold">🔔 Notifications</h3>
                <div className="flex gap-1">
                  <button onClick={markAllRead} className="p-1.5 hover:bg-muted rounded-lg" title="Mark all read">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={clearAll} className="p-1.5 hover:bg-muted rounded-lg" title="Clear all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${notif.read ? 'bg-muted' : 'bg-primary'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
