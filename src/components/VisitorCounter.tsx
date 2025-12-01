import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from("visitor_logs")
        .select("visitor_id", { count: "exact", head: true });
      
      // Get unique visitors
      const { data } = await supabase
        .from("visitor_logs")
        .select("visitor_id");
      
      const uniqueVisitors = new Set(data?.map(v => v.visitor_id) || []).size;
      setCount(uniqueVisitors);
    };

    fetchCount();
  }, []);

  if (count === null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border text-xs text-muted-foreground">
        <Eye className="w-3 h-3" />
        <span>{count.toLocaleString()} visitors</span>
      </div>
    </motion.div>
  );
}