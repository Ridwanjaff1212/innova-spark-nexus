import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Shield, Users, FolderKanban, Calendar, CheckCircle, Star, Plus, Trash2, Download, 
  FileText, TrendingUp, Award, Zap, BarChart3, RefreshCw
} from "lucide-react";
import { exportMembersReport, exportProjectsReport } from "@/utils/pdfExport";

export default function Admin() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "projects" | "members" | "announcements">("dashboard");
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", event_date: "", is_competition: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    fetchAllData();
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [activeTab]);

  const fetchAllData = async () => {
    setLoading(true);
    const [projectsRes, membersRes, announcementsRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("announcements").select("*").order("created_at", { ascending: false })
    ]);
    setProjects(projectsRes.data || []);
    setMembers(membersRes.data || []);
    setAnnouncements(announcementsRes.data || []);
    setLoading(false);
  };

  const fetchData = async () => {
    if (activeTab === "projects") { const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false }); setProjects(data || []); }
    if (activeTab === "members") { const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }); setMembers(data || []); }
    if (activeTab === "announcements") { const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }); setAnnouncements(data || []); }
  };

  const approveProject = async (id: string) => { 
    await supabase.from("projects").update({ status: "approved" }).eq("id", id); 
    toast.success("✅ Project approved!"); 
    fetchData(); 
  };
  
  const featureProject = async (id: string) => { 
    await supabase.from("projects").update({ is_featured: true, status: "approved" }).eq("id", id); 
    toast.success("⭐ Project featured!"); 
    fetchData(); 
  };
  
  const deleteProject = async (id: string) => { 
    await supabase.from("projects").delete().eq("id", id); 
    toast.success("🗑️ Project deleted"); 
    fetchData(); 
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title) {
      toast.error("Please enter a title 📝");
      return;
    }
    await supabase.from("announcements").insert({ 
      title: newAnnouncement.title, 
      content: newAnnouncement.content, 
      event_date: newAnnouncement.event_date || null, 
      is_competition: newAnnouncement.is_competition 
    });
    toast.success("📢 Announcement created!"); 
    setNewAnnouncement({ title: "", content: "", event_date: "", is_competition: false }); 
    fetchData();
  };

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data to export 😅");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${filename}.csv`; a.click();
    toast.success("📄 CSV exported!");
  };

  const stats = {
    totalProjects: projects.length,
    approvedProjects: projects.filter(p => p.status === "approved").length,
    featuredProjects: projects.filter(p => p.is_featured).length,
    totalMembers: members.length,
    totalXP: members.reduce((sum, m) => sum + (m.xp_points || 0), 0),
    avgLevel: members.length > 0 ? (members.reduce((sum, m) => sum + (m.level || 1), 0) / members.length).toFixed(1) : 0,
  };

  if (!isAdmin) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <Shield className="w-20 h-20 mx-auto mb-4 text-destructive/50" />
        <h2 className="text-3xl font-display font-bold">🔐 Access Denied</h2>
        <p className="text-muted-foreground mt-2">Admin access required. Please login with admin PIN.</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-display font-bold flex items-center gap-3">
            <Shield className="w-10 h-10 text-secondary" />
            <span className="gradient-text">Admin</span> Control Center
          </h1>
          <p className="text-muted-foreground mt-1">🎛️ Full platform management at your fingertips</p>
        </div>
        <Button variant="outline" onClick={fetchAllData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 flex-wrap"
      >
        {[
          { id: "dashboard", label: "📊 Dashboard", icon: BarChart3 }, 
          { id: "projects", label: "🗂️ Projects", icon: FolderKanban }, 
          { id: "members", label: "👥 Members", icon: Users }, 
          { id: "announcements", label: "📢 Announcements", icon: Calendar }
        ].map((tab) => (
          <Button 
            key={tab.id} 
            variant={activeTab === tab.id ? "gradient" : "outline"} 
            onClick={() => setActiveTab(tab.id as any)}
            className="font-medium"
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Total Projects", value: stats.totalProjects, icon: FolderKanban, color: "from-primary to-blue-400", emoji: "📁" },
                { label: "Approved", value: stats.approvedProjects, icon: CheckCircle, color: "from-accent to-emerald-400", emoji: "✅" },
                { label: "Featured", value: stats.featuredProjects, icon: Star, color: "from-yellow-500 to-orange-400", emoji: "⭐" },
                { label: "Total Members", value: stats.totalMembers, icon: Users, color: "from-secondary to-pink-400", emoji: "👥" },
                { label: "Total XP", value: stats.totalXP.toLocaleString(), icon: Zap, color: "from-primary to-secondary", emoji: "⚡" },
                { label: "Avg Level", value: stats.avgLevel, icon: TrendingUp, color: "from-cyan-500 to-blue-400", emoji: "📈" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-6 group hover:scale-[1.02] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.emoji} {stat.label}</p>
                      <p className="text-3xl font-display font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-card p-6">
                <h3 className="font-display font-semibold mb-4">🚀 Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("projects")}>
                    <FolderKanban className="w-4 h-4 mr-2" /> Review Pending Projects
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("announcements")}>
                    <Plus className="w-4 h-4 mr-2" /> Create Announcement
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => exportMembersReport(members)}>
                    <FileText className="w-4 h-4 mr-2" /> Export Members PDF
                  </Button>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-display font-semibold mb-4">📊 Export Reports</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="glass" onClick={() => exportCSV(members, "members")}>
                    <Download className="w-4 h-4 mr-2" /> Members CSV
                  </Button>
                  <Button variant="glass" onClick={() => exportMembersReport(members)}>
                    <FileText className="w-4 h-4 mr-2" /> Members PDF
                  </Button>
                  <Button variant="glass" onClick={() => exportCSV(projects, "projects")}>
                    <Download className="w-4 h-4 mr-2" /> Projects CSV
                  </Button>
                  <Button variant="glass" onClick={() => exportProjectsReport(projects)}>
                    <FileText className="w-4 h-4 mr-2" /> Projects PDF
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <motion.div 
            key="projects"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-semibold">🗂️ Project Management ({projects.length})</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportCSV(projects, "projects")}>
                  <Download className="w-4 h-4 mr-2" />CSV
                </Button>
                <Button variant="gradient" onClick={() => exportProjectsReport(projects)}>
                  <FileText className="w-4 h-4 mr-2" />PDF Report
                </Button>
              </div>
            </div>
            
            <div className="glass-card overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left font-display">📌 Title</th>
                      <th className="p-4 text-left font-display">🏷️ Category</th>
                      <th className="p-4 text-left font-display">📊 Status</th>
                      <th className="p-4 text-left font-display">⚡ Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No projects yet 📭</td></tr>
                    ) : (
                      projects.map((p, i) => (
                        <motion.tr 
                          key={p.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-t border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4 font-medium">{p.title} {p.is_featured && "⭐"}</td>
                          <td className="p-4 text-sm text-muted-foreground">{p.category || "N/A"}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              p.status === "approved" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                            }`}>
                              {p.status === "approved" ? "✅ Approved" : "⏳ Pending"}
                            </span>
                          </td>
                          <td className="p-4 flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => approveProject(p.id)} title="Approve">
                              <CheckCircle className="w-4 h-4 text-accent" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => featureProject(p.id)} title="Feature">
                              <Star className="w-4 h-4 text-yellow-500" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteProject(p.id)} title="Delete">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <motion.div 
            key="members"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-semibold">👥 Members ({members.length})</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportCSV(members, "members")}>
                  <Download className="w-4 h-4 mr-2" />CSV
                </Button>
                <Button variant="gradient" onClick={() => exportMembersReport(members)}>
                  <FileText className="w-4 h-4 mr-2" />PDF Report
                </Button>
              </div>
            </div>
            
            <div className="glass-card overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left font-display">👤 Name</th>
                      <th className="p-4 text-left font-display">🆔 ID</th>
                      <th className="p-4 text-left font-display">🎓 Grade</th>
                      <th className="p-4 text-left font-display">⚡ XP</th>
                      <th className="p-4 text-left font-display">📊 Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No members yet 📭</td></tr>
                    ) : (
                      members.map((m, i) => (
                        <motion.tr 
                          key={m.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-t border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4 font-medium">{m.full_name}</td>
                          <td className="p-4 text-sm text-primary font-mono">{m.technovista_id || "N/A"}</td>
                          <td className="p-4 text-sm text-muted-foreground">{m.grade || "N/A"} {m.section || ""}</td>
                          <td className="p-4 font-semibold text-primary">{m.xp_points || 0} ⚡</td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium">
                              Lvl {m.level || 1}
                            </span>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <motion.div 
            key="announcements"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="glass-card p-6">
              <h3 className="text-lg font-display font-semibold mb-4">📝 Create Announcement</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input 
                  placeholder="📌 Title" 
                  value={newAnnouncement.title} 
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} 
                />
                <Input 
                  type="date" 
                  value={newAnnouncement.event_date} 
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, event_date: e.target.value })} 
                />
                <textarea 
                  placeholder="✍️ Content..." 
                  value={newAnnouncement.content} 
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} 
                  className="md:col-span-2 rounded-xl border border-input bg-card/60 px-4 py-3 min-h-[100px] focus:ring-2 focus:ring-primary/20 outline-none" 
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newAnnouncement.is_competition} 
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, is_competition: e.target.checked })}
                    className="w-4 h-4 rounded" 
                  /> 
                  <span>🏆 This is a Competition</span>
                </label>
                <Button variant="gradient" onClick={createAnnouncement}>
                  <Plus className="w-4 h-4 mr-2" />Create Announcement
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="glass-card p-8 text-center text-muted-foreground">
                  No announcements yet 📭
                </div>
              ) : (
                announcements.map((a, i) => (
                  <motion.div 
                    key={a.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-4 flex justify-between items-center hover:scale-[1.01] transition-transform"
                  >
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        {a.is_competition ? "🏆" : "📢"} {a.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                      {a.event_date && (
                        <p className="text-xs text-primary mt-1">📅 {new Date(a.event_date).toLocaleDateString()}</p>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={async () => { 
                        await supabase.from("announcements").delete().eq("id", a.id); 
                        toast.success("🗑️ Deleted");
                        fetchData(); 
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
