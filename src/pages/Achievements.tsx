import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star, Award, Lock } from "lucide-react";

interface Badge { id: string; name: string; description: string | null; icon: string | null; xp_required: number | null; category: string | null; }

export default function Achievements() {
  const { user, profile } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  useEffect(() => { fetchBadges(); }, [user]);

  const fetchBadges = async () => {
    const { data: allBadges } = await supabase.from("badges").select("*").order("xp_required", { ascending: true });
    setBadges(allBadges || []);
    if (user) { const { data: earned } = await supabase.from("user_badges").select("badge_id").eq("user_id", user.id); setEarnedBadges(earned?.map(e => e.badge_id) || []); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-4xl font-display font-bold"><span className="gradient-text">Achievements</span> & Badges</h1>
        <p className="text-muted-foreground mt-2">Your journey of innovation</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 text-center">
        <div className="flex items-center justify-center gap-8">
          <div><Award className="w-12 h-12 text-primary mx-auto mb-2" /><p className="text-3xl font-bold">{earnedBadges.length}</p><p className="text-sm text-muted-foreground">Badges Earned</p></div>
          <div><Star className="w-12 h-12 text-accent mx-auto mb-2" /><p className="text-3xl font-bold">{profile?.xp_points || 0}</p><p className="text-sm text-muted-foreground">Total XP</p></div>
          <div><Trophy className="w-12 h-12 text-secondary mx-auto mb-2" /><p className="text-3xl font-bold">Level {profile?.level || 1}</p><p className="text-sm text-muted-foreground">Current Level</p></div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map((badge, index) => {
          const isEarned = earnedBadges.includes(badge.id);
          return (
            <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className={`glass-card p-5 text-center hover-lift ${isEarned ? "border border-accent/30" : "opacity-60"}`}>
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl ${isEarned ? "bg-gradient-to-br from-primary to-secondary" : "bg-muted"}`}>{isEarned ? badge.icon || "🏆" : <Lock className="w-6 h-6 text-muted-foreground" />}</div>
              <h3 className="font-display font-semibold">{badge.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
              <p className="text-xs text-primary mt-2">{badge.xp_required} XP required</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}