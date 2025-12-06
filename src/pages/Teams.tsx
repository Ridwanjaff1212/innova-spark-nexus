import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Plus, UserPlus, Crown, LogOut, MessageSquare, Search, Send, X, CheckCircle, AlertCircle } from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  created_at: string;
  memberCount?: number;
}

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  joined_at: string;
  profile?: {
    full_name: string;
    technovista_id: string | null;
    email: string;
  };
}

export default function Teams() {
  const { user, profile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [inviteId, setInviteId] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, [user]);

  const fetchTeams = async () => {
    setLoading(true);
    const { data: teamsData } = await supabase.from("teams").select("*").order("created_at", { ascending: false });

    // Fetch member counts
    const teamsWithCounts = await Promise.all(
      (teamsData || []).map(async (team) => {
        const { count } = await supabase.from("team_members").select("*", { count: "exact", head: true }).eq("team_id", team.id);
        return { ...team, memberCount: count || 0 };
      })
    );

    setTeams(teamsWithCounts);
    if (user) {
      const { data: memberData } = await supabase.from("team_members").select("team_id").eq("user_id", user.id);
      setMyTeams(memberData?.map((m) => m.team_id) || []);
    }
    setLoading(false);
  };

  const fetchTeamMembers = async (teamId: string) => {
    const { data } = await supabase.from("team_members").select("*").eq("team_id", teamId);
    
    if (data) {
      const membersWithProfiles = await Promise.all(
        data.map(async (member) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, technovista_id, email")
            .eq("user_id", member.user_id)
            .single();
          return { ...member, profile: profileData };
        })
      );
      setTeamMembers((prev) => ({ ...prev, [teamId]: membersWithProfiles as TeamMember[] }));
    }
  };

  const createTeam = async () => {
    if (!user || !newTeam.name) return;
    const { data, error } = await supabase.from("teams").insert({ name: newTeam.name, description: newTeam.description, leader_id: user.id }).select().single();
    if (error) {
      toast.error("Failed to create team");
      return;
    }
    await supabase.from("team_members").insert({ team_id: data.id, user_id: user.id });
    toast.success("Team created! 🎉");
    setShowCreateForm(false);
    setNewTeam({ name: "", description: "" });
    fetchTeams();
  };

  const joinTeam = async (teamId: string) => {
    if (!user) return;
    const { error } = await supabase.from("team_members").insert({ team_id: teamId, user_id: user.id });
    if (error) {
      toast.error("Failed to join team");
      return;
    }
    toast.success("You joined the team! 🤝");
    fetchTeams();
  };

  const leaveTeam = async (teamId: string) => {
    if (!user) return;
    await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", user.id);
    toast.success("You left the team");
    fetchTeams();
  };

  const inviteMemberById = async (teamId: string) => {
    if (!inviteId.trim()) {
      toast.error("Please enter a TechnoVista ID");
      return;
    }

    setInviteLoading(true);

    // Find user by TechnoVista ID
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, full_name, technovista_id")
      .eq("technovista_id", inviteId.trim().toUpperCase())
      .single();

    if (profileError || !profileData) {
      toast.error("No member found with that ID");
      setInviteLoading(false);
      return;
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", profileData.user_id)
      .single();

    if (existingMember) {
      toast.error("This member is already in the team");
      setInviteLoading(false);
      return;
    }

    // Add member to team
    const { error } = await supabase.from("team_members").insert({
      team_id: teamId,
      user_id: profileData.user_id,
    });

    if (error) {
      toast.error("Failed to add member");
      setInviteLoading(false);
      return;
    }

    toast.success(`${profileData.full_name} added to the team! 🎉`);
    setInviteId("");
    setShowInviteModal(null);
    setInviteLoading(false);
    fetchTeams();
    if (expandedTeam === teamId) {
      fetchTeamMembers(teamId);
    }
  };

  const toggleTeamExpand = async (teamId: string) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null);
    } else {
      setExpandedTeam(teamId);
      if (!teamMembers[teamId]) {
        await fetchTeamMembers(teamId);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="gradient-text">Team</span> Collaboration
          </h1>
          <p className="text-muted-foreground mt-1">Join forces, build together</p>
        </div>
        <Button variant="gradient" onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </motion.div>

      {/* Your TechnoVista ID */}
      {profile?.technovista_id && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your TechnoVista ID</p>
              <p className="font-mono font-bold text-lg">{profile.technovista_id}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(profile.technovista_id || "");
              toast.success("ID copied to clipboard!");
            }}
          >
            Copy ID
          </Button>
        </motion.div>
      )}

      {showCreateForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold mb-4">Create New Team</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Team Name *</label>
              <Input placeholder="Enter team name" value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea
                placeholder="What is your team about?"
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-input bg-card/60 px-4 py-3 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="gradient" onClick={createTeam}>
                Create Team
              </Button>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card h-48 animate-pulse" />
          ))}
        </div>
      ) : teams.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, index) => {
            const isMember = myTeams.includes(team.id);
            const isLeader = team.leader_id === user?.id;
            const isExpanded = expandedTeam === team.id;
            const members = teamMembers[team.id] || [];

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-card p-6 hover-lift ${isMember ? "border border-primary/30" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-foreground" />
                  </div>
                  {isLeader && (
                    <span className="flex items-center gap-1 text-xs text-accent">
                      <Crown className="w-3 h-3" /> Leader
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-display font-semibold mb-1">{team.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{team.description || "No description"}</p>

                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => toggleTeamExpand(team.id)}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Users className="w-4 h-4" />
                    {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
                  </button>
                  {isMember ? (
                    <div className="flex gap-2">
                      {isLeader && (
                        <Button variant="ghost" size="sm" onClick={() => setShowInviteModal(team.id)}>
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      {!isLeader && (
                        <Button variant="ghost" size="sm" onClick={() => leaveTeam(team.id)} className="text-destructive hover:text-destructive">
                          <LogOut className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => joinTeam(team.id)}>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  )}
                </div>

                {/* Expanded Members List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border pt-4 mt-4 space-y-2"
                    >
                      <h4 className="text-sm font-medium mb-2">Team Members</h4>
                      {members.length > 0 ? (
                        members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <div>
                              <p className="text-sm font-medium">{member.profile?.full_name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground font-mono">{member.profile?.technovista_id || "No ID"}</p>
                            </div>
                            {member.user_id === team.leader_id && (
                              <Crown className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Loading members...</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 glass-card">
          <Users className="w-16 h-16 mx-auto mb-4 text-primary/50" />
          <h3 className="text-xl font-display font-semibold mb-2">No teams yet</h3>
          <p className="text-muted-foreground mb-4">Be the first to create a team!</p>
          <Button variant="gradient" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </motion.div>
      )}

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowInviteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-semibold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Invite Member
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowInviteModal(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">TechnoVista ID</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., TV2412XXXX"
                      value={inviteId}
                      onChange={(e) => setInviteId(e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                    <Button onClick={() => inviteMemberById(showInviteModal)} disabled={inviteLoading}>
                      {inviteLoading ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter the TechnoVista ID of the member you want to invite
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30">
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    How it works
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Ask the member for their TechnoVista ID</li>
                    <li>• They can find it on their Dashboard or Teams page</li>
                    <li>• The member will be added to your team instantly</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
