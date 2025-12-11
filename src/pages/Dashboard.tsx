import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { INSPIRATIONAL_QUOTES, LEVEL_NAMES } from "@/lib/constants";
import { 
  Trophy, 
  FolderKanban, 
  Users, 
  Star, 
  Calendar,
  TrendingUp,
  Zap,
  Target,
  Award,
  FileText,
  Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { exportUserProgressReport } from "@/utils/pdfExport";
import StudentAssignments from "@/components/StudentAssignments";
import ContributionGraph from "@/components/ContributionGraph";
import CodingStreak from "@/components/CodingStreak";
import MysteryChallenge from "@/components/MysteryChallenge";
import LiveActivityFeed from "@/components/LiveActivityFeed";

interface Stats {
  totalProjects: number;
  approvedProjects: number;
  teamCount: number;
  badgeCount: number;
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    approvedProjects: 0,
    teamCount: 0,
    badgeCount: 0,
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [featuredProject, setFeaturedProject] = useState<any>(null);
  const [quote, setQuote] = useState(INSPIRATIONAL_QUOTES[0]);

  useEffect(() => {
    const randomQuote = INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)];
    setQuote(randomQuote);

    if (user) {
      fetchStats();
      fetchAnnouncements();
      fetchFeaturedProject();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    const [projectsRes, teamsRes, badgesRes] = await Promise.all([
      supabase.from("projects").select("id, status").eq("user_id", user.id),
      supabase.from("team_members").select("id").eq("user_id", user.id),
      supabase.from("user_badges").select("id").eq("user_id", user.id),
    ]);

    setStats({
      totalProjects: projectsRes.data?.length || 0,
      approvedProjects: projectsRes.data?.filter(p => p.status === "approved").length || 0,
      teamCount: teamsRes.data?.length || 0,
      badgeCount: badgesRes.data?.length || 0,
    });
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);
    setAnnouncements(data || []);
  };

  const fetchFeaturedProject = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*, profiles(full_name)")
      .eq("is_featured", true)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();
    setFeaturedProject(data);
  };

  const levelName = LEVEL_NAMES[Math.min((profile?.level || 1) - 1, LEVEL_NAMES.length - 1)];
  const xpForNextLevel = (profile?.level || 1) * 200;
  const xpProgress = ((profile?.xp_points || 0) % 200) / 200 * 100;

  const statCards = [
    { label: "My Projects", value: stats.totalProjects, icon: FolderKanban, color: "primary" },
    { label: "Approved", value: stats.approvedProjects, icon: Star, color: "accent" },
    { label: "Teams", value: stats.teamCount, icon: Users, color: "secondary" },
    { label: "Badges", value: stats.badgeCount, icon: Trophy, color: "peach" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-display font-bold">
            Welcome back, <span className="gradient-text">{profile?.full_name?.split(" ")[0]}</span>!
          </h1>
          <p className="text-muted-foreground mt-1">Here's your innovation journey today</p>
        </div>
        <Link to="/projects/new">
          <Button variant="gradient" size="lg">
            <Zap className="mr-2 w-4 h-4" />
            New Project
          </Button>
        </Link>
      </motion.div>

      {/* Quote Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 border-l-4 border-l-primary"
      >
        <p className="text-xl italic text-foreground">"{quote.quote}"</p>
        <p className="text-sm text-muted-foreground mt-2">— {quote.author}</p>
      </motion.div>

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Award className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-display font-semibold">{levelName}</h3>
              <p className="text-muted-foreground">Level {profile?.level || 1}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{profile?.xp_points || 0} XP</p>
            <p className="text-sm text-muted-foreground">{xpForNextLevel - (profile?.xp_points || 0) % 200} XP to next level</p>
          </div>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary via-secondary to-accent"
          />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">TechnoVista ID: {profile?.technovista_id}</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="glass-card p-5 hover-lift"
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}/20 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}`} />
              </div>
              <div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Assignments Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <StudentAssignments />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Events
            </h3>
            <Link to="/events" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          
          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{announcement.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                    </div>
                    {announcement.is_competition && (
                      <span className="px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs">
                        Competition
                      </span>
                    )}
                  </div>
                  {announcement.event_date && (
                    <p className="text-xs text-primary mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(announcement.event_date).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No upcoming events</p>
            </div>
          )}
        </motion.div>

        {/* Featured Project */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-display font-semibold flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-accent" />
            Featured Project
          </h3>
          
          {featuredProject ? (
            <div className="space-y-3">
              <div className="aspect-video rounded-xl bg-muted overflow-hidden">
                {featuredProject.thumbnail_url ? (
                  <img 
                    src={featuredProject.thumbnail_url} 
                    alt={featuredProject.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderKanban className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <h4 className="font-medium">{featuredProject.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{featuredProject.description}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">
                  {featuredProject.category}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No featured project yet</p>
              <p className="text-xs mt-1">Your project could be here!</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Streak and Mystery Challenge Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <CodingStreak />
        <MysteryChallenge />
      </div>

      {/* Contribution Graph */}
      <ContributionGraph />

      {/* Live Activity Feed */}
      <LiveActivityFeed />

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Link to="/projects/new" className="glass-card p-4 hover-lift text-center">
          <FolderKanban className="w-8 h-8 mx-auto mb-2 text-primary" />
          <p className="font-medium">Upload Project</p>
        </Link>
        <Link to="/creative-hub" className="glass-card p-4 hover-lift text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-secondary" />
          <p className="font-medium">Creative Hub</p>
        </Link>
        <Link to="/teams" className="glass-card p-4 hover-lift text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-accent" />
          <p className="font-medium">Join Team</p>
        </Link>
        <Link to="/achievements" className="glass-card p-4 hover-lift text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-peach" />
          <p className="font-medium">Achievements</p>
        </Link>
      </motion.div>
    </div>
  );
}
