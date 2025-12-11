import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Shield, Zap, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_protected_until: string | null;
}

const CodingStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isStreakActive, setIsStreakActive] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStreak();
    }
  }, [user]);

  const fetchStreak = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setStreak(data);
      // Check if streak is still active (activity within last 24 hours)
      if (data.last_activity_date) {
        const lastActivity = new Date(data.last_activity_date);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        setIsStreakActive(diffDays <= 1);
      }
    } else if (!error) {
      // Create streak record for new user
      await supabase.from('user_streaks').insert({
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
      });
    }
  };

  const recordActivity = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Update streak
    const { data: currentStreak } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let newStreak = 1;
    let longestStreak = currentStreak?.longest_streak || 0;

    if (currentStreak?.last_activity_date) {
      const lastDate = new Date(currentStreak.last_activity_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        toast.info("You've already logged activity today! 🔥");
        return;
      } else if (diffDays === 1) {
        newStreak = (currentStreak.current_streak || 0) + 1;
      }
    }

    if (newStreak > longestStreak) {
      longestStreak = newStreak;
    }

    await supabase
      .from('user_streaks')
      .upsert({
        user_id: user.id,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString(),
      });

    // Also record contribution
    await supabase
      .from('user_contributions')
      .upsert({
        user_id: user.id,
        contribution_date: today,
        contribution_count: 1,
      }, { onConflict: 'user_id,contribution_date' });

    toast.success(`🔥 ${newStreak} day streak! Keep it up!`);
    fetchStreak();
  };

  const getStreakEmoji = (count: number) => {
    if (count >= 30) return '🏆';
    if (count >= 14) return '⭐';
    if (count >= 7) return '🔥';
    if (count >= 3) return '✨';
    return '💪';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      {/* Fire animation background */}
      {(streak?.current_streak || 0) >= 7 && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent"
          />
        </div>
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold flex items-center gap-2">
            <Flame className={`w-5 h-5 ${isStreakActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
            Coding Streak
          </h3>
          {streak?.streak_protected_until && new Date(streak.streak_protected_until) > new Date() && (
            <div className="flex items-center gap-1 text-xs text-blue-500">
              <Shield className="w-4 h-4" />
              Protected
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
            <motion.div
              animate={isStreakActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: isStreakActive ? Infinity : 0 }}
              className="text-4xl font-bold text-orange-500"
            >
              {streak?.current_streak || 0}
            </motion.div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <span className="text-2xl">{getStreakEmoji(streak?.current_streak || 0)}</span>
          </div>

          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
            <div className="text-4xl font-bold text-primary">
              {streak?.longest_streak || 0}
            </div>
            <p className="text-sm text-muted-foreground">Longest Streak</p>
            <Trophy className="w-6 h-6 mx-auto mt-1 text-yellow-500" />
          </div>
        </div>

        <Button 
          onClick={recordActivity} 
          className="w-full" 
          variant={isStreakActive ? "outline" : "default"}
        >
          <Zap className="w-4 h-4 mr-2" />
          {isStreakActive ? "Streak Active Today! ✓" : "Log Today's Activity"}
        </Button>

        {/* Streak milestones */}
        <div className="mt-4 flex justify-between text-xs text-muted-foreground">
          <span className={`${(streak?.current_streak || 0) >= 3 ? 'text-primary' : ''}`}>3 days 🌟</span>
          <span className={`${(streak?.current_streak || 0) >= 7 ? 'text-primary' : ''}`}>7 days 🔥</span>
          <span className={`${(streak?.current_streak || 0) >= 14 ? 'text-primary' : ''}`}>14 days ⭐</span>
          <span className={`${(streak?.current_streak || 0) >= 30 ? 'text-primary' : ''}`}>30 days 🏆</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CodingStreak;
