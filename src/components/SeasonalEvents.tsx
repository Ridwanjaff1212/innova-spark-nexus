import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Snowflake, Sun, Leaf, Flower2, Gift, Star, 
  Trophy, Calendar, Clock, Sparkles, PartyPopper
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SeasonalEvent {
  id: string;
  name: string;
  description: string | null;
  theme: string;
  start_date: string;
  end_date: string;
  xp_multiplier: number | null;
  is_active: boolean | null;
  special_challenges: unknown;
}

const THEME_CONFIGS: Record<string, { icon: any; colors: string; gradient: string }> = {
  winter: { 
    icon: Snowflake, 
    colors: 'text-blue-400', 
    gradient: 'from-blue-500/20 to-cyan-500/20' 
  },
  summer: { 
    icon: Sun, 
    colors: 'text-yellow-400', 
    gradient: 'from-yellow-500/20 to-orange-500/20' 
  },
  autumn: { 
    icon: Leaf, 
    colors: 'text-orange-400', 
    gradient: 'from-orange-500/20 to-red-500/20' 
  },
  spring: { 
    icon: Flower2, 
    colors: 'text-pink-400', 
    gradient: 'from-pink-500/20 to-green-500/20' 
  },
  holiday: { 
    icon: Gift, 
    colors: 'text-red-400', 
    gradient: 'from-red-500/20 to-green-500/20' 
  },
  anniversary: { 
    icon: PartyPopper, 
    colors: 'text-purple-400', 
    gradient: 'from-purple-500/20 to-pink-500/20' 
  },
  default: { 
    icon: Star, 
    colors: 'text-primary', 
    gradient: 'from-primary/20 to-secondary/20' 
  },
};

export default function SeasonalEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<SeasonalEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<SeasonalEvent | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('seasonal_events')
      .select('*')
      .gte('end_date', now)
      .order('start_date', { ascending: true });
    
    if (data) {
      setEvents(data as SeasonalEvent[]);
      const active = data.find(e => e.is_active);
      if (active) {
        setActiveEvent(active as SeasonalEvent);
      }
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const celebrateEvent = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const themeConfig = activeEvent 
    ? THEME_CONFIGS[activeEvent.theme] || THEME_CONFIGS.default 
    : THEME_CONFIGS.default;
  const ThemeIcon = themeConfig.icon;

  return (
    <div className="space-y-4">
      {/* Active Event Banner */}
      {activeEvent && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r ${themeConfig.gradient} border border-border`}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 rounded-full ${themeConfig.colors} opacity-40`}
                initial={{ 
                  x: Math.random() * 100 + '%', 
                  y: Math.random() * 100 + '%' 
                }}
                animate={{ 
                  y: [null, '-100%'],
                  opacity: [0.4, 0]
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2, 
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className={`w-16 h-16 rounded-2xl bg-background/50 flex items-center justify-center ${themeConfig.colors}`}
              >
                <ThemeIcon className="w-8 h-8" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-display font-bold">{activeEvent.name}</h2>
                  <Badge variant="secondary" className="animate-pulse">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {activeEvent.xp_multiplier || 1}x XP
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">{activeEvent.description || ''}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1 text-accent-foreground">
                    <Clock className="w-4 h-4" />
                    {getTimeRemaining(activeEvent.end_date)}
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={celebrateEvent} variant="outline" className="gap-2">
              <PartyPopper className="w-4 h-4" />
              Celebrate!
            </Button>
          </div>
        </motion.div>
      )}

      {/* Upcoming Events */}
      {events.filter(e => !e.is_active).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <AnimatePresence>
                {events.filter(e => !e.is_active).map((event, idx) => {
                  const config = THEME_CONFIGS[event.theme] || THEME_CONFIGS.default;
                  const EventIcon = config.icon;
                  
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${config.gradient} border border-border/50`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center ${config.colors}`}>
                          <EventIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{event.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Starts {new Date(event.start_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {event.xp_multiplier || 1}x XP
                      </Badge>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Events */}
      {events.length === 0 && (
        <Card className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium">No Upcoming Events</h3>
          <p className="text-sm text-muted-foreground">Check back soon for seasonal events!</p>
        </Card>
      )}
    </div>
  );
}
