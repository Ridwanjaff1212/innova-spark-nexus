import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, Trophy } from "lucide-react";
import SeasonalEvents from "@/components/SeasonalEvents";

interface Announcement { id: string; title: string; content: string; event_date: string | null; is_competition: boolean | null; created_at: string; }

export default function Events() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from("announcements").select("*").order("event_date", { ascending: true });
    setAnnouncements(data || []);
  };

  const getTimeUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    if (diff < 0) return "Past event";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hour${hours > 1 ? "s" : ""} left`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-4xl font-display font-bold"><span className="gradient-text">Events</span> & Competitions</h1>
        <p className="text-muted-foreground mt-2">Stay updated with club activities</p>
      </motion.div>

      {/* Seasonal Events Section */}
      <SeasonalEvents />

      {announcements.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold">Upcoming Events</h2>
          {announcements.map((event, index) => (
            <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className={`glass-card p-6 hover-lift ${event.is_competition ? "border-l-4 border-l-secondary" : "border-l-4 border-l-primary"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${event.is_competition ? "bg-secondary/20" : "bg-primary/20"}`}>{event.is_competition ? <Trophy className="w-7 h-7 text-secondary" /> : <Calendar className="w-7 h-7 text-primary" />}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">{event.is_competition && <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs">Competition</span>}</div>
                    <h3 className="text-xl font-display font-semibold">{event.title}</h3>
                    <p className="text-muted-foreground mt-1">{event.content}</p>
                  </div>
                </div>
                {event.event_date && (
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{new Date(event.event_date).toLocaleDateString()}</p>
                    <p className="text-xs text-accent flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{getTimeUntil(event.event_date)}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 glass-card">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-primary/50" />
          <h3 className="text-xl font-display font-semibold mb-2">No events yet</h3>
          <p className="text-muted-foreground">Check back soon for upcoming events!</p>
        </motion.div>
      )}
    </div>
  );
}