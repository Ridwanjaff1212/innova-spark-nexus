import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Users, FolderKanban, Calendar, CheckCircle, Star, Plus, Trash2, Download } from "lucide-react";

export default function Admin() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"projects" | "members" | "announcements">("projects");
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", event_date: "", is_competition: false });

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    if (activeTab === "projects") { const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false }); setProjects(data || []); }
    if (activeTab === "members") { const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }); setMembers(data || []); }
    if (activeTab === "announcements") { const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }); setAnnouncements(data || []); }
  };

  const approveProject = async (id: string) => { await supabase.from("projects").update({ status: "approved" }).eq("id", id); toast.success("Project approved!"); fetchData(); };
  const featureProject = async (id: string) => { await supabase.from("projects").update({ is_featured: true, status: "approved" }).eq("id", id); toast.success("Project featured!"); fetchData(); };
  const deleteProject = async (id: string) => { await supabase.from("projects").delete().eq("id", id); toast.success("Project deleted"); fetchData(); };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title) return;
    await supabase.from("announcements").insert({ title: newAnnouncement.title, content: newAnnouncement.content, event_date: newAnnouncement.event_date || null, is_competition: newAnnouncement.is_competition });
    toast.success("Announcement created!"); setNewAnnouncement({ title: "", content: "", event_date: "", is_competition: false }); fetchData();
  };

  const exportCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${filename}.csv`; a.click();
  };

  if (!isAdmin) return <div className="text-center py-16"><Shield className="w-16 h-16 mx-auto mb-4 text-destructive/50" /><h2 className="text-2xl font-display font-bold">Access Denied</h2><p className="text-muted-foreground">Admin access required</p></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold"><Shield className="inline w-8 h-8 mr-2 text-secondary" /><span className="gradient-text">Admin</span> Control Center</h1>
        <p className="text-muted-foreground mt-1">Manage TechnoVista platform</p>
      </motion.div>

      <div className="flex gap-2 flex-wrap">
        {[{ id: "projects", label: "Projects", icon: FolderKanban }, { id: "members", label: "Members", icon: Users }, { id: "announcements", label: "Announcements", icon: Calendar }].map((tab) => (
          <Button key={tab.id} variant={activeTab === tab.id ? "secondary" : "outline"} onClick={() => setActiveTab(tab.id as any)}><tab.icon className="w-4 h-4 mr-2" />{tab.label}</Button>
        ))}
      </div>

      {activeTab === "projects" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center"><h2 className="text-xl font-display font-semibold">Project Management ({projects.length})</h2><Button variant="outline" onClick={() => exportCSV(projects, "projects")}><Download className="w-4 h-4 mr-2" />Export CSV</Button></div>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50"><tr><th className="p-3 text-left">Title</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Actions</th></tr></thead>
              <tbody>{projects.map((p) => (<tr key={p.id} className="border-t border-border"><td className="p-3 font-medium">{p.title}</td><td className="p-3 text-sm text-muted-foreground">{p.category}</td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${p.status === "approved" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>{p.status}</span></td><td className="p-3 flex gap-2"><Button size="sm" variant="ghost" onClick={() => approveProject(p.id)}><CheckCircle className="w-4 h-4" /></Button><Button size="sm" variant="ghost" onClick={() => featureProject(p.id)}><Star className="w-4 h-4" /></Button><Button size="sm" variant="ghost" onClick={() => deleteProject(p.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button></td></tr>))}</tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === "members" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center"><h2 className="text-xl font-display font-semibold">Members ({members.length})</h2><Button variant="outline" onClick={() => exportCSV(members, "members")}><Download className="w-4 h-4 mr-2" />Export CSV</Button></div>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50"><tr><th className="p-3 text-left">Name</th><th className="p-3 text-left">ID</th><th className="p-3 text-left">XP</th><th className="p-3 text-left">Level</th></tr></thead>
              <tbody>{members.map((m) => (<tr key={m.id} className="border-t border-border"><td className="p-3 font-medium">{m.full_name}</td><td className="p-3 text-sm text-primary">{m.technovista_id}</td><td className="p-3">{m.xp_points}</td><td className="p-3">{m.level}</td></tr>))}</tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === "announcements" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-lg font-display font-semibold mb-4">Create Announcement</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Input placeholder="Title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} />
              <Input type="date" value={newAnnouncement.event_date} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, event_date: e.target.value })} />
              <textarea placeholder="Content" value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} className="md:col-span-2 rounded-xl border border-input bg-card/60 px-4 py-3 min-h-[100px]" />
              <label className="flex items-center gap-2"><input type="checkbox" checked={newAnnouncement.is_competition} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, is_competition: e.target.checked })} /> Competition</label>
              <Button variant="gradient" onClick={createAnnouncement}><Plus className="w-4 h-4 mr-2" />Create</Button>
            </div>
          </div>
          <div className="space-y-2">{announcements.map((a) => (<div key={a.id} className="glass-card p-4 flex justify-between items-center"><div><h4 className="font-medium">{a.title}</h4><p className="text-sm text-muted-foreground">{a.content}</p></div><Button size="sm" variant="ghost" onClick={async () => { await supabase.from("announcements").delete().eq("id", a.id); fetchData(); }} className="text-destructive"><Trash2 className="w-4 h-4" /></Button></div>))}</div>
        </motion.div>
      )}
    </div>
  );
}