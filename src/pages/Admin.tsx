import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Shield, Users, FolderKanban, Calendar, CheckCircle, Star, Plus, Trash2, Download, 
  FileText, TrendingUp, Award, Zap, BarChart3, RefreshCw, Eye, Clock, Activity,
  UserCheck, Settings, Database, Bell, Search, Layers, ArrowUpRight
} from "lucide-react";
import { exportMembersReport, exportProjectsReport } from "@/utils/pdfExport";

type TabType = "overview" | "projects" | "members" | "announcements" | "analytics";

export default function Admin() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", event_date: "", is_competition: false });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { 
    fetchAllData();
  }, []);

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

  const approveProject = async (id: string) => { 
    await supabase.from("projects").update({ status: "approved" }).eq("id", id); 
    toast.success("Project approved successfully"); 
    fetchAllData(); 
  };
  
  const featureProject = async (id: string) => { 
    await supabase.from("projects").update({ is_featured: true, status: "approved" }).eq("id", id); 
    toast.success("Project featured successfully"); 
    fetchAllData(); 
  };
  
  const deleteProject = async (id: string) => { 
    await supabase.from("projects").delete().eq("id", id); 
    toast.success("Project removed"); 
    fetchAllData(); 
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title) {
      toast.error("Please enter a title");
      return;
    }
    await supabase.from("announcements").insert({ 
      title: newAnnouncement.title, 
      content: newAnnouncement.content, 
      event_date: newAnnouncement.event_date || null, 
      is_competition: newAnnouncement.is_competition 
    });
    toast.success("Announcement created"); 
    setNewAnnouncement({ title: "", content: "", event_date: "", is_competition: false }); 
    fetchAllData();
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    toast.success("Announcement deleted");
    fetchAllData();
  };

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${filename}.csv`; a.click();
    toast.success("CSV exported successfully");
  };

  const stats = {
    totalProjects: projects.length,
    pendingProjects: projects.filter(p => p.status !== "approved").length,
    approvedProjects: projects.filter(p => p.status === "approved").length,
    featuredProjects: projects.filter(p => p.is_featured).length,
    totalMembers: members.length,
    activeMembers: members.filter(m => (m.xp_points || 0) > 0).length,
    totalXP: members.reduce((sum, m) => sum + (m.xp_points || 0), 0),
    avgLevel: members.length > 0 ? (members.reduce((sum, m) => sum + (m.level || 1), 0) / members.length).toFixed(1) : 0,
  };

  const filteredProjects = projects.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = members.filter(m => 
    m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.technovista_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mt-3">You don't have permission to access the admin portal. Please login with admin credentials.</p>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: BarChart3 },
    { id: "projects" as TabType, label: "Projects", icon: FolderKanban },
    { id: "members" as TabType, label: "Members", icon: Users },
    { id: "announcements" as TabType, label: "Announcements", icon: Bell },
    { id: "analytics" as TabType, label: "Analytics", icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">Admin Portal</h1>
                <p className="text-sm text-muted-foreground">TechnoVista Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchAllData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Navigation Tabs */}
        <nav className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Projects", value: stats.totalProjects, icon: FolderKanban, trend: "+12%", up: true },
                  { label: "Pending Review", value: stats.pendingProjects, icon: Clock, trend: stats.pendingProjects > 0 ? "Action needed" : "All clear", up: false },
                  { label: "Total Members", value: stats.totalMembers, icon: Users, trend: "+8%", up: true },
                  { label: "Active Members", value: stats.activeMembers, icon: UserCheck, trend: `${Math.round((stats.activeMembers / (stats.totalMembers || 1)) * 100)}%`, up: true },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-display font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <stat.icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 mt-3 text-xs ${stat.up ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                      {stat.trend}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Stats Row */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-semibold">XP Distribution</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total XP Earned</span>
                      <span className="font-semibold">{stats.totalXP.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Average Level</span>
                      <span className="font-semibold">{stats.avgLevel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Featured Projects</span>
                      <span className="font-semibold">{stats.featuredProjects}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-semibold">Quick Actions</h3>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setActiveTab("projects")}>
                      <Eye className="w-4 h-4 mr-2" /> Review Projects
                      {stats.pendingProjects > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          {stats.pendingProjects}
                        </span>
                      )}
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setActiveTab("announcements")}>
                      <Plus className="w-4 h-4 mr-2" /> New Announcement
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => exportMembersReport(members)}>
                      <FileText className="w-4 h-4 mr-2" /> Export Report
                    </Button>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Bell className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-semibold">Recent Activity</h3>
                  </div>
                  <div className="space-y-3">
                    {projects.slice(0, 3).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full ${p.status === 'approved' ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <span className="truncate flex-1">{p.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Export Section */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-semibold">Data Export</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" onClick={() => exportCSV(members, "members")}>
                    <Download className="w-4 h-4 mr-2" /> Members CSV
                  </Button>
                  <Button variant="outline" onClick={() => exportMembersReport(members)}>
                    <FileText className="w-4 h-4 mr-2" /> Members PDF
                  </Button>
                  <Button variant="outline" onClick={() => exportCSV(projects, "projects")}>
                    <Download className="w-4 h-4 mr-2" /> Projects CSV
                  </Button>
                  <Button variant="outline" onClick={() => exportProjectsReport(projects)}>
                    <FileText className="w-4 h-4 mr-2" /> Projects PDF
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search projects..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => exportCSV(projects, "projects")}>
                    <Download className="w-4 h-4 mr-2" /> CSV
                  </Button>
                  <Button onClick={() => exportProjectsReport(projects)}>
                    <FileText className="w-4 h-4 mr-2" /> PDF Report
                  </Button>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Project</th>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No projects found</td></tr>
                    ) : (
                      filteredProjects.map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FolderKanban className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{p.title}</p>
                                {p.is_featured && <span className="text-xs text-primary">Featured</span>}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground">{p.category || "Uncategorized"}</span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              p.status === "approved" 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}>
                              {p.status === "approved" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {p.status === "approved" ? "Approved" : "Pending"}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => approveProject(p.id)} title="Approve">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => featureProject(p.id)} title="Feature">
                                <Star className="w-4 h-4 text-amber-500" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteProject(p.id)} title="Delete">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <motion.div 
              key="members"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search members..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => exportCSV(members, "members")}>
                    <Download className="w-4 h-4 mr-2" /> CSV
                  </Button>
                  <Button onClick={() => exportMembersReport(members)}>
                    <FileText className="w-4 h-4 mr-2" /> PDF Report
                  </Button>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Member</th>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">ID</th>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Grade</th>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">XP</th>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No members found</td></tr>
                    ) : (
                      filteredMembers.map((m) => (
                        <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {m.full_name?.charAt(0) || "?"}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{m.full_name}</p>
                                <p className="text-xs text-muted-foreground">{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <code className="text-sm text-primary bg-primary/10 px-2 py-1 rounded">
                              {m.technovista_id || "N/A"}
                            </code>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {m.grade || "N/A"} {m.section || ""}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-primary" />
                              <span className="font-semibold">{m.xp_points || 0}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              <TrendingUp className="w-3 h-3" />
                              Level {m.level || 1}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Announcements Tab */}
          {activeTab === "announcements" && (
            <motion.div 
              key="announcements"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Create Announcement
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input 
                    placeholder="Title" 
                    value={newAnnouncement.title} 
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} 
                  />
                  <Input 
                    type="date" 
                    value={newAnnouncement.event_date} 
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, event_date: e.target.value })} 
                  />
                  <textarea 
                    placeholder="Content..." 
                    value={newAnnouncement.content} 
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} 
                    className="md:col-span-2 rounded-lg border border-input bg-background px-4 py-3 min-h-[100px] focus:ring-2 focus:ring-primary/20 outline-none resize-none" 
                  />
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newAnnouncement.is_competition} 
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, is_competition: e.target.checked })}
                      className="w-4 h-4 rounded border-input accent-primary" 
                    /> 
                    <span className="text-sm">Mark as Competition</span>
                  </label>
                  <div className="flex justify-end">
                    <Button onClick={createAnnouncement}>
                      <Plus className="w-4 h-4 mr-2" /> Create Announcement
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  All Announcements ({announcements.length})
                </h3>
                {announcements.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                    No announcements yet
                  </div>
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-start gap-4">
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          a.is_competition ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary/10'
                        }`}>
                          {a.is_competition ? (
                            <Award className="w-5 h-5 text-amber-600" />
                          ) : (
                            <Bell className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {a.title}
                            {a.is_competition && (
                              <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                                Competition
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                          {a.event_date && (
                            <p className="text-xs text-primary mt-2 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(a.event_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteAnnouncement(a.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Projects", value: stats.totalProjects, icon: FolderKanban },
                  { label: "Approved", value: stats.approvedProjects, icon: CheckCircle },
                  { label: "Featured", value: stats.featuredProjects, icon: Star },
                  { label: "Pending", value: stats.pendingProjects, icon: Clock },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center gap-3">
                      <stat.icon className="w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="text-3xl font-display font-bold mt-2">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Projects by Category
                  </h3>
                  <div className="space-y-3">
                    {Array.from(new Set(projects.map(p => p.category || "Other"))).map(category => {
                      const count = projects.filter(p => (p.category || "Other") === category).length;
                      const percentage = Math.round((count / (projects.length || 1)) * 100);
                      return (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{category}</span>
                            <span className="text-muted-foreground">{count} ({percentage}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Member Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Total Members</span>
                      <span className="font-semibold">{stats.totalMembers}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Active Members</span>
                      <span className="font-semibold">{stats.activeMembers}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Total XP Earned</span>
                      <span className="font-semibold">{stats.totalXP.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Average Level</span>
                      <span className="font-semibold">{stats.avgLevel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}