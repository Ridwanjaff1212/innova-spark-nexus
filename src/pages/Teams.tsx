import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Plus, UserPlus, Crown, LogOut, MessageSquare } from "lucide-react";

interface Team { id: string; name: string; description: string | null; leader_id: string | null; created_at: string; memberCount?: number; }

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTeams(); }, [user]);

  const fetchTeams = async () => {
    setLoading(true);
    const { data: teamsData } = await supabase.from("teams").select("*").order("created_at", { ascending: false });
    
    // Fetch member counts
    const teamsWithCounts = await Promise.all((teamsData || []).map(async (team) => {
      const { count } = await supabase.from("team_members").select("*", { count: "exact", head: true }).eq("team_id", team.id);
      return { ...team, memberCount: count || 0 };
    }));
    
    setTeams(teamsWithCounts);
    if (user) { const { data: memberData } = await supabase.from("team_members").select("team_id").eq("user_id", user.id); setMyTeams(memberData?.map(m => m.team_id) || []); }
    setLoading(false);
  };

  const createTeam = async () => {
    if (!user || !newTeam.name) return;
    const { data, error } = await supabase.from("teams").insert({ name: newTeam.name, description: newTeam.description, leader_id: user.id }).select().single();
    if (error) { toast.error("Failed to create team"); return; }
    await supabase.from("team_members").insert({ team_id: data.id, user_id: user.id });
    toast.success("Team created! 🎉"); setShowCreateForm(false); setNewTeam({ name: "", description: "" }); fetchTeams();
  };

  const joinTeam = async (teamId: string) => { if (!user) return; const { error } = await supabase.from("team_members").insert({ team_id: teamId, user_id: user.id }); if (error) { toast.error("Failed to join team"); return; } toast.success("You joined the team! 🤝"); fetchTeams(); };
  const leaveTeam = async (teamId: string) => { if (!user) return; await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", user.id); toast.success("You left the team"); fetchTeams(); };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="text-3xl font-display font-bold"><span className="gradient-text">Team</span> Collaboration</h1><p className="text-muted-foreground mt-1">Join forces, build together</p></div>
        <Button variant="gradient" onClick={() => setShowCreateForm(!showCreateForm)}><Plus className="w-4 h-4 mr-2" />Create Team</Button>
      </motion.div>

      {showCreateForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold mb-4">Create New Team</h3>
          <div className="space-y-4">
            <div><label className="text-sm font-medium mb-1 block">Team Name *</label><Input placeholder="Enter team name" value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium mb-1 block">Description</label><textarea placeholder="What is your team about?" value={newTeam.description} onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })} rows={3} className="w-full rounded-xl border border-input bg-card/60 px-4 py-3 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-none" /></div>
            <div className="flex gap-2"><Button variant="gradient" onClick={createTeam}>Create Team</Button><Button variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button></div>
          </div>
        </motion.div>
      )}

      {loading ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="glass-card h-48 animate-pulse" />)}</div> : teams.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, index) => {
            const isMember = myTeams.includes(team.id);
            const isLeader = team.leader_id === user?.id;
            return (
              <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`glass-card p-6 hover-lift ${isMember ? "border border-primary/30" : ""}`}>
                <div className="flex items-start justify-between mb-3"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center"><Users className="w-6 h-6 text-primary-foreground" /></div>{isLeader && <span className="flex items-center gap-1 text-xs text-accent"><Crown className="w-3 h-3" /> Leader</span>}</div>
                <h3 className="text-lg font-display font-semibold mb-1">{team.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{team.description || "No description"}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</span>
                  {isMember ? (<div className="flex gap-2"><Button variant="ghost" size="sm"><MessageSquare className="w-4 h-4" /></Button>{!isLeader && <Button variant="ghost" size="sm" onClick={() => leaveTeam(team.id)} className="text-destructive hover:text-destructive"><LogOut className="w-4 h-4" /></Button>}</div>) : (<Button size="sm" onClick={() => joinTeam(team.id)}><UserPlus className="w-4 h-4 mr-1" />Join</Button>)}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 glass-card"><Users className="w-16 h-16 mx-auto mb-4 text-primary/50" /><h3 className="text-xl font-display font-semibold mb-2">No teams yet</h3><p className="text-muted-foreground mb-4">Be the first to create a team!</p><Button variant="gradient" onClick={() => setShowCreateForm(true)}><Plus className="w-4 h-4 mr-2" />Create Team</Button></motion.div>
      )}
    </div>
  );
}