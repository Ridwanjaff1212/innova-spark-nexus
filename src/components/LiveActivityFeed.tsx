import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Code, FolderKanban, Trophy, Users, MessageSquare, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: any;
  created_at: string;
  user_name?: string;
}

const LiveActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed'
        },
        (payload) => {
          const newActivity = payload.new as ActivityItem;
          setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setActivities(data);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_submitted': return <FolderKanban className="w-4 h-4 text-blue-500" />;
      case 'project_approved': return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'code_snippet': return <Code className="w-4 h-4 text-green-500" />;
      case 'team_joined': return <Users className="w-4 h-4 text-purple-500" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-orange-500" />;
      case 'challenge_completed': return <Zap className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-primary" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project_submitted': return 'from-blue-500/20 to-blue-500/5';
      case 'project_approved': return 'from-yellow-500/20 to-yellow-500/5';
      case 'code_snippet': return 'from-green-500/20 to-green-500/5';
      case 'team_joined': return 'from-purple-500/20 to-purple-500/5';
      case 'comment': return 'from-orange-500/20 to-orange-500/5';
      case 'challenge_completed': return 'from-red-500/20 to-red-500/5';
      default: return 'from-primary/20 to-primary/5';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-green-500"
        />
        <h3 className="text-lg font-display font-semibold">Live Activity</h3>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-lg bg-gradient-to-r ${getActivityColor(activity.activity_type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-xs mt-1">Be the first to make a move!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default LiveActivityFeed;
