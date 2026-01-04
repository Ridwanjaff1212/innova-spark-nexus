import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";
import AIChatbot from "@/components/AIChatbot";
import NotificationBell from "@/components/NotificationBell";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function MainLayout() {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track page visits
  useVisitorTracking(location.pathname);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4"
          >
            <span className="text-3xl animate-bounce">🚀</span>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-display"
          >
            Loading TechnoVista...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Top bar with notifications */}
      <div className="fixed top-0 right-0 left-64 h-16 bg-background/90 backdrop-blur-xl border-b border-border/50 z-40 flex items-center justify-between px-6 shadow-sm">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-2xl"
          >
            👋
          </motion.span>
          <div>
            <span className="text-sm text-muted-foreground">Welcome back,</span>
            <span className="font-display font-semibold gradient-text ml-1.5">{profile?.full_name || "Innovator"}</span>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          {profile?.technovista_id && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs bg-gradient-to-r from-primary/20 to-primary/10 text-primary px-3 py-1.5 rounded-full font-medium border border-primary/20"
            >
              🆔 {profile.technovista_id}
            </motion.div>
          )}
          <ThemeToggle />
          <NotificationBell />
        </motion.div>
      </div>
      
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
      
      {/* AI Chatbot - appears everywhere */}
      <AIChatbot />
    </div>
  );
}
