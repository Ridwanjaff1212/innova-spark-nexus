import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Send,
  CheckCircle,
  Clock,
  Calendar,
  Target,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  deadline: string | null;
  assigned_to_all: boolean;
  assigned_to: string[];
  status: string;
  created_at: string;
}

interface Completion {
  id: string;
  assignment_id: string;
  user_id: string;
  completed_at: string;
}

export default function StudentAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    if (!user) return;
    setLoading(true);

    const [assignmentsRes, completionsRes] = await Promise.all([
      supabase
        .from("assignments")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("assignment_completions")
        .select("*")
        .eq("user_id", user.id),
    ]);

    // Filter assignments for this user
    const allAssignments = (assignmentsRes.data || []) as Assignment[];
    const userAssignments = allAssignments.filter(
      (a) => a.assigned_to_all || a.assigned_to?.includes(user.id)
    );

    setAssignments(userAssignments);
    setCompletions((completionsRes.data as Completion[]) || []);
    setLoading(false);
  };

  const markComplete = async (assignmentId: string) => {
    if (!user) return;

    const { error } = await supabase.from("assignment_completions").insert({
      assignment_id: assignmentId,
      user_id: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast.info("Already marked as complete");
      } else {
        toast.error("Failed to mark as complete");
      }
      return;
    }

    toast.success("Assignment marked as complete!");
    fetchAssignments();
  };

  const isCompleted = (assignmentId: string) =>
    completions.some((c) => c.assignment_id === assignmentId);

  const getPriorityStyle = (priority: string) => {
    const styles: Record<string, string> = {
      low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      normal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      high: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return styles[priority] || styles.normal;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tech_news":
        return Target;
      case "research":
        return Sparkles;
      default:
        return Send;
    }
  };

  const pendingAssignments = assignments.filter((a) => !isCompleted(a.id));
  const completedAssignments = assignments.filter((a) => isCompleted(a.id));

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <Send className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <h3 className="font-semibold text-lg">No Assignments</h3>
        <p className="text-sm text-muted-foreground">
          You don't have any assignments yet. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-display font-semibold flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          My Assignments
        </h3>
        <span className="text-sm text-muted-foreground">
          {pendingAssignments.length} pending
        </span>
      </div>

      {/* Pending Assignments */}
      {pendingAssignments.length > 0 && (
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingAssignments.length})
          </h4>
          <AnimatePresence>
            {pendingAssignments.map((assignment, index) => {
              const TypeIcon = getTypeIcon(assignment.type);
              const isOverdue =
                assignment.deadline &&
                new Date(assignment.deadline) < new Date();

              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                    isOverdue
                      ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
                      : "bg-muted/30 border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isOverdue ? "bg-red-100" : "bg-primary/10"
                        }`}
                      >
                        <TypeIcon
                          className={`w-5 h-5 ${
                            isOverdue ? "text-red-600" : "text-primary"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-medium">{assignment.title}</h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${getPriorityStyle(
                              assignment.priority
                            )}`}
                          >
                            {assignment.priority}
                          </span>
                          {isOverdue && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {assignment.description}
                        </p>
                        {assignment.deadline && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due:{" "}
                            {new Date(assignment.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markComplete(assignment.id)}
                      className="shrink-0"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Done
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Completed Assignments */}
      {completedAssignments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Completed ({completedAssignments.length})
          </h4>
          {completedAssignments.slice(0, 3).map((assignment) => (
            <div
              key={assignment.id}
              className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 opacity-75"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium line-through">
                    {assignment.title}
                  </span>
                </div>
                <span className="text-xs text-green-600">Completed</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
