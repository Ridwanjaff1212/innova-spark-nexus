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
  UserCheck, Settings, Database, Bell, Search, Layers, ArrowUpRight, Send, Target,
  AlertCircle, GraduationCap, Mail, Hash, Edit2, ChevronDown, ChevronUp, Globe, Terminal, Braces, Copy, Gift, Sparkles
} from "lucide-react";
import { exportMembersReport, exportProjectsReport } from "@/utils/pdfExport";
import { getVisitorStats } from "@/hooks/useVisitorTracking";

type TabType = "overview" | "projects" | "members" | "assignments" | "announcements" | "analytics" | "gallery" | "codehub" | "challenges" | "system";

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  deadline: string | null;
  assigned_to: string[];
  assigned_to_all: boolean;
  status: string;
  created_at: string;
}

export default function Admin() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", event_date: "", is_competition: false });
  const [newAssignment, setNewAssignment] = useState({ 
    title: "", description: "", type: "task", priority: "normal", 
    deadline: "", assigned_to_all: true, assigned_to: [] as string[] 
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [visitorStats, setVisitorStats] = useState({
    todayVisits: 0,
    uniqueToday: 0,
    weekVisits: 0,
    uniqueWeek: 0,
    totalVisits: 0,
  });
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [codeSnippets, setCodeSnippets] = useState<any[]>([]);
  const [mysteryChallenges, setMysteryChallenges] = useState<any[]>([]);
  const [newChallenge, setNewChallenge] = useState({
    title: "", description: "", challenge_type: "code", xp_reward: 50, time_limit_minutes: 30
  });

  useEffect(() => { 
    fetchAllData();
    fetchVisitorStats();
  }, []);

  const fetchVisitorStats = async () => {
    try {
      const stats = await getVisitorStats();
      setVisitorStats(stats);
    } catch (error) {
      console.debug("Could not fetch visitor stats:", error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    const [projectsRes, membersRes, announcementsRes, assignmentsRes, badgesRes, snippetsRes, challengesRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("assignments").select("*").order("created_at", { ascending: false }),
      supabase.from("badges").select("*").order("created_at", { ascending: false }),
      supabase.from("code_hub_snippets").select("*").order("created_at", { ascending: false }),
      supabase.from("mystery_challenges").select("*").order("created_at", { ascending: false })
    ]);
    setProjects(projectsRes.data || []);
    setMembers(membersRes.data || []);
    setAnnouncements(announcementsRes.data || []);
    setAssignments((assignmentsRes.data as Assignment[]) || []);
    setBadges(badgesRes.data || []);
    setCodeSnippets(snippetsRes.data || []);
    setMysteryChallenges(challengesRes.data || []);
    setLoading(false);
  };

  const createMysteryChallenge = async () => {
    if (!newChallenge.title) {
      toast.error("Please enter a challenge title");
      return;
    }
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour challenge
    
    await supabase.from("mystery_challenges").insert({
      ...newChallenge,
      is_active: true,
      expires_at: expiresAt.toISOString()
    });
    toast.success("Mystery challenge created! 🎉");
    setNewChallenge({ title: "", description: "", challenge_type: "code", xp_reward: 50, time_limit_minutes: 30 });
    fetchAllData();
  };

  const toggleChallengeActive = async (id: string, isActive: boolean) => {
    await supabase.from("mystery_challenges").update({ is_active: !isActive }).eq("id", id);
    toast.success(isActive ? "Challenge deactivated" : "Challenge activated");
    fetchAllData();
  };

  const deleteChallenge = async (id: string) => {
    await supabase.from("mystery_challenges").delete().eq("id", id);
    toast.success("Challenge deleted");
    fetchAllData();
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

  const createAssignment = async () => {
    if (!newAssignment.title) {
      toast.error("Please enter a title");
      return;
    }
    
    setLoading(true);
    
    // Insert assignment
    const { error } = await supabase.from("assignments").insert({
      title: newAssignment.title,
      description: newAssignment.description,
      type: newAssignment.type,
      priority: newAssignment.priority,
      deadline: newAssignment.deadline || null,
      assigned_to_all: newAssignment.assigned_to_all,
      assigned_to: newAssignment.assigned_to_all ? [] : selectedMembers
    });

    if (error) {
      toast.error("Failed to create assignment");
      setLoading(false);
      return;
    }

    // Send email notifications
    const recipientEmails = newAssignment.assigned_to_all 
      ? members.map(m => m.email).filter(Boolean)
      : members.filter(m => selectedMembers.includes(m.user_id)).map(m => m.email).filter(Boolean);

    if (recipientEmails.length > 0) {
      try {
        const { data, error: emailError } = await supabase.functions.invoke("send-assignment-email", {
          body: {
            assignment: {
              title: newAssignment.title,
              description: newAssignment.description,
              type: newAssignment.type,
              priority: newAssignment.priority,
              deadline: newAssignment.deadline || null,
            },
            recipientEmails,
          },
        });

        if (emailError) {
          console.error("Email error:", emailError);
          toast.success("Assignment created (emails may have failed)");
        } else {
          toast.success(`Assignment sent to ${data?.sent || recipientEmails.length} students`);
        }
      } catch (err) {
        console.error("Email notification error:", err);
        toast.success("Assignment created (email notifications skipped)");
      }
    } else {
      toast.success("Assignment created");
    }

    setNewAssignment({ title: "", description: "", type: "task", priority: "normal", deadline: "", assigned_to_all: true, assigned_to: [] });
    setSelectedMembers([]);
    setLoading(false);
    fetchAllData();
  };

  const deleteAssignment = async (id: string) => {
    await supabase.from("assignments").delete().eq("id", id);
    toast.success("Assignment deleted");
    fetchAllData();
  };

  // Bulk operations
  const handleBulkAction = async () => {
    if (selectedProjects.length === 0) {
      toast.error("No projects selected");
      return;
    }
    
    setLoading(true);
    try {
      if (bulkAction === "approve") {
        await Promise.all(selectedProjects.map(id => 
          supabase.from("projects").update({ status: "approved" }).eq("id", id)
        ));
        toast.success(`${selectedProjects.length} projects approved`);
      } else if (bulkAction === "feature") {
        await Promise.all(selectedProjects.map(id => 
          supabase.from("projects").update({ is_featured: true, status: "approved" }).eq("id", id)
        ));
        toast.success(`${selectedProjects.length} projects featured`);
      } else if (bulkAction === "delete") {
        await Promise.all(selectedProjects.map(id => 
          supabase.from("projects").delete().eq("id", id)
        ));
        toast.success(`${selectedProjects.length} projects deleted`);
      }
      setSelectedProjects([]);
      setBulkAction("");
      fetchAllData();
    } catch (error) {
      toast.error("Bulk operation failed");
    }
    setLoading(false);
  };

  const grantXP = async (userId: string, amount: number) => {
    const member = members.find(m => m.user_id === userId);
    if (!member) return;
    
    const newXP = (member.xp_points || 0) + amount;
    const newLevel = Math.floor(newXP / 100) + 1;
    
    await supabase.from("profiles").update({ 
      xp_points: newXP,
      level: newLevel 
    }).eq("user_id", userId);
    
    toast.success(`Granted ${amount} XP to ${member.full_name}`);
    fetchAllData();
  };

  const resetMemberProgress = async (userId: string) => {
    await supabase.from("profiles").update({ 
      xp_points: 0,
      level: 1 
    }).eq("user_id", userId);
    toast.success("Member progress reset");
    fetchAllData();
  };

  const toggleProjectSelection = (id: string) => {
    setSelectedProjects(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
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
    activeAssignments: assignments.filter(a => a.status === "active").length,
  };

  const filteredProjects = projects.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = members.filter(m => 
    m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.technovista_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMemberProjects = (userId: string) => projects.filter(p => p.user_id === userId);

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
    { id: "assignments" as TabType, label: "Assignments", icon: Send },
    { id: "announcements" as TabType, label: "Announcements", icon: Bell },
    { id: "analytics" as TabType, label: "Analytics", icon: Layers },
    { id: "gallery" as TabType, label: "Gallery", icon: Globe },
    { id: "codehub" as TabType, label: "Code Hub", icon: Terminal },
    { id: "system" as TabType, label: "System", icon: Database },
  ];

  const featureSnippet = async (id: string) => {
    await supabase.from("code_hub_snippets").update({ is_featured: true }).eq("id", id);
    toast.success("Snippet featured");
    fetchAllData();
  };

  const deleteSnippet = async (id: string) => {
    await supabase.from("code_hub_snippets").delete().eq("id", id);
    toast.success("Snippet deleted");
    fetchAllData();
  };

  const assignmentTypes = [
    { value: "task", label: "Task" },
    { value: "tech_news", label: "Tech News" },
    { value: "research", label: "Research" },
    { value: "presentation", label: "Presentation" },
    { value: "project", label: "Project Work" },
    { value: "workshop", label: "Workshop Prep" },
  ];

  const priorityLevels = [
    { value: "low", label: "Low", color: "text-blue-600 bg-blue-100" },
    { value: "normal", label: "Normal", color: "text-green-600 bg-green-100" },
    { value: "high", label: "High", color: "text-amber-600 bg-amber-100" },
    { value: "urgent", label: "Urgent", color: "text-red-600 bg-red-100" },
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
        <nav className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-6 w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
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
                  { label: "Active Assignments", value: stats.activeAssignments, icon: Send, trend: "Active", up: true },
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
                    <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setActiveTab("assignments")}>
                      <Send className="w-4 h-4 mr-2" /> Send Assignment
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

              {/* Bulk Actions */}
              {selectedProjects.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{selectedProjects.length} selected</span>
                    <select 
                      className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                    >
                      <option value="">Choose action...</option>
                      <option value="approve">Approve All</option>
                      <option value="feature">Feature All</option>
                      <option value="delete">Delete All</option>
                    </select>
                    <Button size="sm" onClick={handleBulkAction} disabled={!bulkAction || loading}>
                      Apply
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedProjects([])}>
                    Clear Selection
                  </Button>
                </motion.div>
              )}
              
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-4 text-left">
                        <input 
                          type="checkbox" 
                          checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjects(filteredProjects.map(p => p.id));
                            } else {
                              setSelectedProjects([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-border"
                        />
                      </th>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Project</th>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="p-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No projects found</td></tr>
                    ) : (
                      filteredProjects.map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <input 
                              type="checkbox"
                              checked={selectedProjects.includes(p.id)}
                              onChange={() => toggleProjectSelection(p.id)}
                              className="w-4 h-4 rounded border-border"
                            />
                          </td>
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

          {/* Members Tab - Enhanced */}
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
                    placeholder="Search by name, ID, or email..." 
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

              {/* Member Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="w-4 h-4" />
                    Total Members
                  </div>
                  <p className="text-2xl font-bold mt-1">{stats.totalMembers}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <UserCheck className="w-4 h-4" />
                    Active Members
                  </div>
                  <p className="text-2xl font-bold mt-1">{stats.activeMembers}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Zap className="w-4 h-4" />
                    Total XP
                  </div>
                  <p className="text-2xl font-bold mt-1">{stats.totalXP.toLocaleString()}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Avg Level
                  </div>
                  <p className="text-2xl font-bold mt-1">{stats.avgLevel}</p>
                </div>
              </div>
              
              {/* Members List - Card Style */}
              <div className="space-y-3">
                {filteredMembers.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                    No members found
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const memberProjects = getMemberProjects(m.user_id);
                    const isExpanded = expandedMember === m.id;
                    
                    return (
                      <div key={m.id} className="bg-card border border-border rounded-xl overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
                                <span className="text-lg font-semibold text-primary">
                                  {m.full_name?.charAt(0) || "?"}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold flex items-center gap-2">
                                  {m.full_name}
                                  {(m.xp_points || 0) >= 500 && (
                                    <Award className="w-4 h-4 text-amber-500" />
                                  )}
                                </h4>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Hash className="w-3 h-3" />
                                    {m.technovista_id || "N/A"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {m.email}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="text-right hidden md:block">
                                <div className="flex items-center gap-1 text-sm">
                                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                  <span>{m.grade || "N/A"} {m.section || ""}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="flex items-center gap-1 text-primary font-semibold">
                                    <Zap className="w-4 h-4" />
                                    {m.xp_points || 0}
                                  </div>
                                  <span className="text-xs text-muted-foreground">XP</span>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold">Lv.{m.level || 1}</div>
                                  <span className="text-xs text-muted-foreground">Level</span>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold">{memberProjects.length}</div>
                                  <span className="text-xs text-muted-foreground">Projects</span>
                                </div>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-border bg-muted/20"
                            >
                              <div className="p-4 grid md:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="font-medium mb-3 flex items-center gap-2">
                                    <FolderKanban className="w-4 h-4 text-primary" />
                                    Projects ({memberProjects.length})
                                  </h5>
                                  {memberProjects.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No projects submitted yet</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {memberProjects.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                                          <span className="text-sm font-medium">{p.title}</span>
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            p.status === "approved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                          }`}>
                                            {p.status || "Pending"}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h5 className="font-medium mb-3 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary" />
                                    Member Management
                                  </h5>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between p-2 bg-background rounded-lg">
                                      <span className="text-muted-foreground">Joined</span>
                                      <span>{new Date(m.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-background rounded-lg">
                                      <span className="text-muted-foreground">Bio</span>
                                      <span className="text-right max-w-[200px] truncate">{m.bio || "No bio"}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-background rounded-lg">
                                      <span className="text-muted-foreground">User ID</span>
                                      <code className="text-xs bg-muted px-1 rounded">{m.user_id?.slice(0, 8)}...</code>
                                    </div>
                                    <div className="pt-3 space-y-2">
                                      <div className="flex gap-2">
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="flex-1"
                                          onClick={() => grantXP(m.user_id, 50)}
                                        >
                                          <Zap className="w-3 h-3 mr-1" /> +50 XP
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="flex-1"
                                          onClick={() => grantXP(m.user_id, 100)}
                                        >
                                          <Zap className="w-3 h-3 mr-1" /> +100 XP
                                        </Button>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        variant="destructive" 
                                        className="w-full"
                                        onClick={() => {
                                          if (confirm(`Reset ${m.full_name}'s progress?`)) {
                                            resetMemberProgress(m.user_id);
                                          }
                                        }}
                                      >
                                        <AlertCircle className="w-3 h-3 mr-1" /> Reset Progress
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* Assignments Tab - NEW */}
          {activeTab === "assignments" && (
            <motion.div 
              key="assignments"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Create Assignment */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Send New Assignment
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input 
                    placeholder="Assignment Title (e.g., Tech News: AI Developments)" 
                    value={newAssignment.title} 
                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} 
                  />
                  <Input 
                    type="date" 
                    placeholder="Deadline"
                    value={newAssignment.deadline} 
                    onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })} 
                  />
                  <select
                    value={newAssignment.type}
                    onChange={(e) => setNewAssignment({ ...newAssignment, type: e.target.value })}
                    className="rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    {assignmentTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <select
                    value={newAssignment.priority}
                    onChange={(e) => setNewAssignment({ ...newAssignment, priority: e.target.value })}
                    className="rounded-lg border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    {priorityLevels.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <textarea 
                    placeholder="Assignment description and instructions..." 
                    value={newAssignment.description} 
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })} 
                    className="md:col-span-2 rounded-lg border border-input bg-background px-4 py-3 min-h-[100px] focus:ring-2 focus:ring-primary/20 outline-none resize-none" 
                  />
                  <div className="md:col-span-2 flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newAssignment.assigned_to_all} 
                        onChange={(e) => setNewAssignment({ ...newAssignment, assigned_to_all: e.target.checked })}
                        className="w-4 h-4 rounded border-input accent-primary" 
                      /> 
                      <span className="text-sm">Assign to all members</span>
                    </label>
                    <Button onClick={createAssignment}>
                      <Send className="w-4 h-4 mr-2" /> Send Assignment
                    </Button>
                  </div>
                </div>
              </div>

              {/* Assignment Types Info */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { type: "Tech News", desc: "Share latest tech articles for students to research", icon: Target },
                  { type: "Research", desc: "Assign topics for in-depth exploration", icon: Search },
                  { type: "Project Work", desc: "Assign specific project milestones", icon: FolderKanban },
                ].map((item) => (
                  <div key={item.type} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="w-4 h-4 text-primary" />
                      <span className="font-medium">{item.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Existing Assignments */}
              <div className="space-y-3">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Active Assignments ({assignments.length})
                </h3>
                {assignments.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                    No assignments created yet
                  </div>
                ) : (
                  assignments.map((a) => {
                    const priority = priorityLevels.find(p => p.value === a.priority);
                    const type = assignmentTypes.find(t => t.value === a.type);
                    return (
                      <div key={a.id} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Send className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium">{a.title}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${priority?.color || "bg-muted"}`}>
                                  {priority?.label || a.priority}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {type?.label || a.type}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {a.assigned_to_all ? "All members" : `${a.assigned_to?.length || 0} members`}
                                </span>
                                {a.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Due: {new Date(a.deadline).toLocaleDateString()}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Created: {new Date(a.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => deleteAssignment(a.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
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
              {/* Visitor Analytics */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Visitor Analytics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: "Today's Visits", value: visitorStats.todayVisits, icon: Eye },
                    { label: "Unique Today", value: visitorStats.uniqueToday, icon: Users },
                    { label: "This Week", value: visitorStats.weekVisits, icon: Activity },
                    { label: "Unique Weekly", value: visitorStats.uniqueWeek, icon: UserCheck },
                    { label: "Total All Time", value: visitorStats.totalVisits, icon: TrendingUp },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card/80 backdrop-blur rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <stat.icon className="w-3 h-3" />
                        {stat.label}
                      </div>
                      <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

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

          {/* Gallery Tab - NEW */}
          {activeTab === "gallery" && (
            <motion.div 
              key="gallery"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Gallery Management
                </h3>
                <p className="text-muted-foreground mb-4">
                  Upload and manage images/videos for the Events & Gallery page. Items will be visible to all users.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-muted/20 border-2 border-dashed border-border rounded-xl p-8 text-center">
                    <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">Upload photos & videos</p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" /> Upload Media
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Recent Uploads</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <Globe className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Gallery Item {item}</p>
                              <p className="text-xs text-muted-foreground">Uploaded today</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-6">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Gallery Note
                </h4>
                <p className="text-sm text-muted-foreground">
                  Uploaded media will appear on the Events & Gallery page. Ensure content follows school guidelines. 
                  Supported formats: JPG, PNG, MP4, MOV (max 50MB per file).
                </p>
              </div>
            </motion.div>
          )}

          {/* Code Hub Tab */}
          {activeTab === "codehub" && (
            <motion.div 
              key="codehub"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Snippets", value: codeSnippets.length, icon: Braces },
                  { label: "Featured", value: codeSnippets.filter(s => s.is_featured).length, icon: Star },
                  { label: "Languages", value: [...new Set(codeSnippets.map(s => s.language))].length, icon: Terminal },
                  { label: "Total Views", value: codeSnippets.reduce((sum, s) => sum + (s.views_count || 0), 0), icon: Eye },
                ].map((stat, i) => (
                  <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <stat.icon className="w-4 h-4" />
                      <span className="text-xs">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Snippets List */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-display font-semibold flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-500" />
                    Code Snippets Management
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportCSV(codeSnippets, "code-snippets")}>
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {codeSnippets.length > 0 ? codeSnippets.map((snippet) => (
                    <div key={snippet.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{snippet.title}</h4>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 text-xs">
                              {snippet.language}
                            </span>
                            {snippet.is_featured && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-xs flex items-center gap-1">
                                <Star className="w-3 h-3" /> Featured
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{snippet.description || "No description"}</p>
                          <pre className="mt-2 p-2 rounded bg-muted/50 text-xs font-mono overflow-x-auto max-h-20">
                            <code>{snippet.code?.slice(0, 150)}{snippet.code?.length > 150 ? "..." : ""}</code>
                          </pre>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {snippet.views_count || 0} views</span>
                            <span>{new Date(snippet.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!snippet.is_featured && (
                            <Button variant="outline" size="sm" onClick={() => featureSnippet(snippet.id)}>
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteSnippet(snippet.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center">
                      <Braces className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No code snippets yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Snippets shared in Code Hub will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Language Distribution */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Language Distribution
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(
                    codeSnippets.reduce((acc: Record<string, number>, s) => {
                      acc[s.language] = (acc[s.language] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([lang, count]) => (
                    <div key={lang} className="p-3 bg-muted/30 rounded-lg text-center">
                      <p className="text-lg font-bold">{count as number}</p>
                      <p className="text-xs text-muted-foreground capitalize">{lang}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* System Tab - NEW */}
          {activeTab === "system" && (
            <motion.div 
              key="system"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Database Stats */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Database Overview
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Projects", count: projects.length },
                      { label: "Members", count: members.length },
                      { label: "Assignments", count: assignments.length },
                      { label: "Announcements", count: announcements.length },
                      { label: "Badges", count: badges.length },
                      { label: "Code Snippets", count: codeSnippets.length },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">{item.label}</span>
                        <span className="font-semibold text-primary">{item.count} records</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Actions */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    System Actions
                  </h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" onClick={fetchAllData}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh All Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => exportCSV(members, "full-backup")}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Backup (CSV)
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="w-4 h-4 mr-2" />
                      Database Health Check
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-amber-600 hover:text-amber-700">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      View System Logs
                    </Button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
                <h3 className="font-display font-semibold mb-2 flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  These actions are irreversible. Use with extreme caution.
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      if (confirm("Are you sure you want to reset ALL member progress? This cannot be undone!")) {
                        members.forEach(m => resetMemberProgress(m.user_id));
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset All Progress
                  </Button>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  System Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground">Platform Version</span>
                    <p className="font-medium mt-1">TechnoVista v2.0</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground">Last Updated</span>
                    <p className="font-medium mt-1">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground">Admin Session</span>
                    <p className="font-medium mt-1 text-green-600">Active</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground">Storage Usage</span>
                    <p className="font-medium mt-1">Calculating...</p>
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
