import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Clock, Sparkles, Zap, Lock, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  xp_reward: number;
  time_limit_minutes: number;
  expires_at: string;
}

const MysteryChallenge = () => {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    fetchActiveChallenge();
  }, [user]);

  useEffect(() => {
    if (challenge?.expires_at) {
      const interval = setInterval(() => {
        const now = new Date();
        const expiry = new Date(challenge.expires_at);
        const diff = expiry.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('Expired');
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${minutes}m`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [challenge]);

  const fetchActiveChallenge = async () => {
    const { data } = await supabase
      .from('mystery_challenges')
      .select('*')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && user) {
      setChallenge(data);
      
      // Check if user already completed this challenge
      const { data: completion } = await supabase
        .from('mystery_challenge_completions')
        .select('id')
        .eq('challenge_id', data.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsCompleted(!!completion);
    }
  };

  const revealChallenge = () => {
    setIsRevealed(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const completeChallenge = async () => {
    if (!user || !challenge) return;

    const { error } = await supabase
      .from('mystery_challenge_completions')
      .insert({
        challenge_id: challenge.id,
        user_id: user.id,
        xp_earned: challenge.xp_reward,
      });

    if (!error) {
      setIsCompleted(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success(`🎉 Challenge completed! +${challenge.xp_reward} XP`);
      
      // Record contribution
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('user_contributions').upsert({
        user_id: user.id,
        contribution_date: today,
        contribution_count: 2,
        contribution_type: 'challenge'
      }, { onConflict: 'user_id,contribution_date' });
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'code': return '💻';
      case 'creative': return '🎨';
      case 'quiz': return '🧠';
      case 'social': return '🤝';
      default: return '⚡';
    }
  };

  if (!challenge) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 text-center"
      >
        <Gift className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <h3 className="text-lg font-display font-semibold">Mystery Challenge</h3>
        <p className="text-sm text-muted-foreground mt-2">
          No active challenge right now. Check back soon!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      {/* Animated background */}
      <motion.div
        animate={{
          background: [
            'linear-gradient(45deg, hsl(var(--primary) / 0.1), transparent)',
            'linear-gradient(135deg, hsl(var(--secondary) / 0.1), transparent)',
            'linear-gradient(225deg, hsl(var(--accent) / 0.1), transparent)',
            'linear-gradient(315deg, hsl(var(--primary) / 0.1), transparent)',
          ]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Mystery Challenge
          </h3>
          {timeLeft && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {timeLeft}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ 
                  rotate: [0, -5, 5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block"
              >
                <Gift className="w-20 h-20 text-primary mx-auto" />
              </motion.div>
              <p className="text-muted-foreground mt-4 mb-4">
                A mystery challenge awaits!
              </p>
              <Button onClick={revealChallenge} variant="gradient">
                <Zap className="w-4 h-4 mr-2" />
                Reveal Challenge
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{getChallengeIcon(challenge.challenge_type)}</span>
                <div>
                  <h4 className="font-semibold text-lg">{challenge.title}</h4>
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                <span className="text-sm font-medium">Reward</span>
                <span className="font-bold text-primary">+{challenge.xp_reward} XP</span>
              </div>

              {isCompleted ? (
                <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-green-500/20 text-green-500">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Completed!</span>
                </div>
              ) : (
                <Button onClick={completeChallenge} className="w-full" variant="default">
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MysteryChallenge;
