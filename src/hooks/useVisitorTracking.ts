import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const getVisitorId = () => {
  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("visitor_id", visitorId);
  }
  return visitorId;
};

export const useVisitorTracking = (pagePath?: string) => {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const visitorId = getVisitorId();
        await supabase.from("visitor_logs").insert({
          visitor_id: visitorId,
          page_visited: pagePath || window.location.pathname,
          user_agent: navigator.userAgent.substring(0, 200),
        });
      } catch (error) {
        // Silent fail - don't interrupt user experience
        console.debug("Visitor tracking failed:", error);
      }
    };

    trackVisit();
  }, [pagePath]);
};

export const getVisitorStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: todayData } = await supabase
    .from("visitor_logs")
    .select("visitor_id")
    .gte("created_at", today.toISOString());

  const { data: weekData } = await supabase
    .from("visitor_logs")
    .select("visitor_id")
    .gte("created_at", weekAgo.toISOString());

  const { count: totalVisits } = await supabase
    .from("visitor_logs")
    .select("*", { count: "exact", head: true });

  const uniqueToday = new Set(todayData?.map(v => v.visitor_id) || []).size;
  const uniqueWeek = new Set(weekData?.map(v => v.visitor_id) || []).size;

  return {
    todayVisits: todayData?.length || 0,
    uniqueToday,
    weekVisits: weekData?.length || 0,
    uniqueWeek,
    totalVisits: totalVisits || 0,
  };
};