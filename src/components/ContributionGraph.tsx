import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ContributionDay {
  date: string;
  count: number;
}

const ContributionGraph = () => {
  const { user } = useAuth();
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const [totalContributions, setTotalContributions] = useState(0);

  useEffect(() => {
    if (user) {
      fetchContributions();
    }
  }, [user]);

  const fetchContributions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_contributions')
      .select('contribution_date, contribution_count')
      .eq('user_id', user.id)
      .gte('contribution_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('contribution_date', { ascending: true });

    if (data) {
      setContributions(data.map(d => ({ date: d.contribution_date, count: d.contribution_count })));
      setTotalContributions(data.reduce((sum, d) => sum + d.contribution_count, 0));
    }
  };

  // Generate last 365 days
  const generateDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const contribution = contributions.find(c => c.date === dateStr);
      days.push({
        date: dateStr,
        count: contribution?.count || 0,
        dayOfWeek: date.getDay(),
      });
    }
    return days;
  };

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count <= 2) return 'bg-primary/30';
    if (count <= 5) return 'bg-primary/50';
    if (count <= 10) return 'bg-primary/70';
    return 'bg-primary';
  };

  const days = generateDays();
  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];

  days.forEach((day, index) => {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
    if (index === days.length - 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold">Contribution Activity</h3>
        <span className="text-sm text-muted-foreground">
          {totalContributions} contributions in the last year
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Month labels */}
          <div className="flex gap-1 mb-1 pl-8">
            {months.map((month, i) => (
              <span key={i} className="text-xs text-muted-foreground" style={{ width: `${100 / 12}%` }}>
                {month}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-1">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, i) => (
                <span key={i} className="text-xs text-muted-foreground h-3 leading-3">
                  {day}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                    const day = week.find(d => d.dayOfWeek === dayIndex);
                    if (!day) return <div key={dayIndex} className="w-3 h-3" />;
                    
                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger>
                          <motion.div
                            whileHover={{ scale: 1.3 }}
                            className={`w-3 h-3 rounded-sm ${getIntensity(day.count)} cursor-pointer`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {day.count} contribution{day.count !== 1 ? 's' : ''} on{' '}
                            {new Date(day.date).toLocaleDateString()}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-xs text-muted-foreground">Less</span>
            {['bg-muted', 'bg-primary/30', 'bg-primary/50', 'bg-primary/70', 'bg-primary'].map((color, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContributionGraph;
