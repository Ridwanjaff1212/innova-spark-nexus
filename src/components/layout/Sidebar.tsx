import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Lightbulb, 
  Users, 
  Trophy, 
  Calendar, 
  LogOut,
  Bot,
  Sparkles,
  Terminal,
  Swords
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/creative-hub", icon: Lightbulb, label: "Creative Hub" },
  { to: "/code-hub", icon: Terminal, label: "Code Hub" },
  { to: "/code-battle", icon: Swords, label: "Code Battle" },
  { to: "/teams", icon: Users, label: "Teams" },
  { to: "/achievements", icon: Trophy, label: "Achievements" },
  { to: "/events", icon: Calendar, label: "Events" },
];

export default function Sidebar() {
  const { profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 bottom-0 w-64 bg-card/80 backdrop-blur-xl border-r border-border z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg gradient-text">TechnoVista</h1>
            <p className="text-xs text-muted-foreground">ICSK Khaitan 2025</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      {profile && (
        <div className="p-4 mx-4 mt-4 glass-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
              {profile.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{profile.full_name}</p>
              <p className="text-xs text-primary">{profile.technovista_id}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Level {profile.level}</span>
            <span className="text-accent">{profile.xp_points} XP</span>
          </div>
          <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((profile.xp_points % 200) / 2, 100)}%` }}
              className="h-full bg-gradient-to-r from-primary to-secondary"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border border-secondary/30",
                isActive
                  ? "bg-secondary/20 text-secondary"
                  : "text-secondary/70 hover:text-secondary hover:bg-secondary/10"
              )
            }
          >
            <Trophy className="w-5 h-5" />
            <span className="font-medium">Admin Portal</span>
          </NavLink>
        )}
      </nav>

      {/* AI Assistants */}
      <div className="p-4 border-t border-border space-y-2">
        <NavLink
          to="/assistant"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-foreground hover:from-primary/30 hover:to-secondary/30 transition-all duration-300"
        >
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-medium">AI Assistant</span>
        </NavLink>
        <NavLink
          to="/code-assistant"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-foreground hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all duration-300"
        >
          <Terminal className="w-5 h-5 text-emerald-500" />
          <span className="font-medium">Code Assistant</span>
        </NavLink>
      </div>

      {/* Sign Out */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </motion.aside>
  );
}