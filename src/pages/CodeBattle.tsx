import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Swords, Users, Clock, Trophy, Play, Plus, Zap, Crown, 
  Timer, Code, Send, Eye, AlertCircle, CheckCircle, XCircle,
  Medal, Target, Flame, RefreshCw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SyntaxHighlighter from "@/components/code/SyntaxHighlighter";
import confetti from "canvas-confetti";

interface Battle {
  id: string;
  title: string;
  description: string;
  problem_statement: string;
  starter_code: string;
  difficulty: string;
  time_limit_seconds: number;
  max_participants: number;
  status: string;
  started_at: string | null;
  created_by: string;
  participants?: Participant[];
}

interface Participant {
  id: string;
  battle_id: string;
  user_id: string;
  username: string;
  status: string;
  score: number;
  submission_code: string | null;
  submission_time: string | null;
  is_correct: boolean;
}

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  battles_won: number;
  battles_played: number;
  total_score: number;
  win_streak: number;
  best_streak: number;
}

export default function CodeBattle() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("lobby");
  const [battles, setBattles] = useState<Battle[]>([]);
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBattle, setNewBattle] = useState({
    title: "",
    description: "",
    problem_statement: "",
    starter_code: "// Write your solution here\n\nfunction solution() {\n  \n}",
    difficulty: "medium",
    time_limit_seconds: 900,
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchBattles();
    fetchLeaderboard();

    // Subscribe to battle updates
    const battlesChannel = supabase
      .channel('battles-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'code_battles' }, () => {
        fetchBattles();
        if (currentBattle) {
          fetchBattleDetails(currentBattle.id);
        }
      })
      .subscribe();

    // Subscribe to participant updates
    const participantsChannel = supabase
      .channel('participants-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_participants' }, () => {
        if (currentBattle) {
          fetchParticipants(currentBattle.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(battlesChannel);
      supabase.removeChannel(participantsChannel);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentBattle?.id]);

  useEffect(() => {
    if (currentBattle?.status === 'active' && currentBattle.started_at) {
      const startTime = new Date(currentBattle.started_at).getTime();
      const endTime = startTime + (currentBattle.time_limit_seconds * 1000);
      
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleBattleEnd();
        }
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [currentBattle?.status, currentBattle?.started_at]);

  const fetchBattles = async () => {
    const { data } = await supabase
      .from('code_battles')
      .select('*')
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false });
    setBattles(data || []);
  };

  const fetchBattleDetails = async (battleId: string) => {
    const { data } = await supabase
      .from('code_battles')
      .select('*')
      .eq('id', battleId)
      .single();
    if (data) {
      setCurrentBattle(data);
      setCode(data.starter_code || "");
    }
  };

  const fetchParticipants = async (battleId: string) => {
    const { data } = await supabase
      .from('battle_participants')
      .select('*')
      .eq('battle_id', battleId)
      .order('score', { ascending: false });
    setParticipants(data || []);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('battle_leaderboard')
      .select('*')
      .order('battles_won', { ascending: false })
      .limit(20);
    setLeaderboard(data || []);
  };

  const createBattle = async () => {
    if (!user || !profile || !newBattle.title || !newBattle.problem_statement) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { data, error } = await supabase
      .from('code_battles')
      .insert({
        ...newBattle,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create battle");
      return;
    }

    toast.success("Battle arena created! 🎮");
    setShowCreateModal(false);
    setNewBattle({
      title: "",
      description: "",
      problem_statement: "",
      starter_code: "// Write your solution here\n\nfunction solution() {\n  \n}",
      difficulty: "medium",
      time_limit_seconds: 900,
    });
    fetchBattles();
  };

  const joinBattle = async (battle: Battle) => {
    if (!user || !profile) {
      toast.error("Please log in to join battles");
      return;
    }

    const { error } = await supabase
      .from('battle_participants')
      .insert({
        battle_id: battle.id,
        user_id: user.id,
        username: profile.full_name,
      });

    if (error) {
      if (error.code === '23505') {
        toast.info("You're already in this battle!");
      } else {
        toast.error("Failed to join battle");
        return;
      }
    } else {
      toast.success("Joined the battle! ⚔️");
    }

    setCurrentBattle(battle);
    setCode(battle.starter_code || "");
    fetchParticipants(battle.id);
    setActiveTab("arena");
  };

  const startBattle = async () => {
    if (!currentBattle || !user) return;

    const { error } = await supabase
      .from('code_battles')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', currentBattle.id);

    if (!error) {
      toast.success("Battle started! 🚀");
      fetchBattleDetails(currentBattle.id);
    }
  };

  const submitCode = async () => {
    if (!currentBattle || !user) return;
    setIsSubmitting(true);

    // Simple validation - in production you'd run actual tests
    const isCorrect = code.length > 50 && code.includes('return');
    const score = isCorrect ? Math.max(100, 1000 - Math.floor((currentBattle.time_limit_seconds - timeLeft) / 10)) : 0;

    const { error } = await supabase
      .from('battle_participants')
      .update({
        submission_code: code,
        submission_time: new Date().toISOString(),
        is_correct: isCorrect,
        score,
        status: 'submitted',
      })
      .eq('battle_id', currentBattle.id)
      .eq('user_id', user.id);

    if (!error) {
      if (isCorrect) {
        confetti({ particleCount: 100, spread: 70 });
        toast.success(`Submitted! Score: ${score} points 🎉`);
      } else {
        toast.warning("Code submitted but tests failed");
      }
      fetchParticipants(currentBattle.id);
    }
    setIsSubmitting(false);
  };

  const handleBattleEnd = async () => {
    if (!currentBattle) return;

    await supabase
      .from('code_battles')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', currentBattle.id);

    toast.info("Battle ended! ⏱️");
    fetchBattles();
    setCurrentBattle(null);
    setActiveTab("lobby");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'text-green-500 bg-green-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20';
      case 'hard': return 'text-red-500 bg-red-500/20';
      default: return 'text-primary bg-primary/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Swords className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Code Battle Arena</h1>
            <p className="text-muted-foreground">Compete in real-time coding challenges</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="gradient">
          <Plus className="w-4 h-4 mr-2" />
          Create Battle
        </Button>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lobby" className="gap-2">
            <Users className="w-4 h-4" /> Lobby
          </TabsTrigger>
          <TabsTrigger value="arena" className="gap-2" disabled={!currentBattle}>
            <Swords className="w-4 h-4" /> Arena
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="w-4 h-4" /> Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Lobby Tab */}
        <TabsContent value="lobby" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {battles.map((battle, index) => (
                <motion.div
                  key={battle.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-5 hover-lift"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{battle.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(battle.difficulty)}`}>
                        {battle.difficulty}
                      </span>
                    </div>
                    {battle.status === 'active' && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-3 h-3 rounded-full bg-green-500"
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{battle.description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.floor(battle.time_limit_seconds / 60)}m
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {battle.max_participants} max
                    </span>
                  </div>
                  <Button 
                    onClick={() => joinBattle(battle)} 
                    className="w-full"
                    variant={battle.status === 'active' ? 'default' : 'outline'}
                  >
                    {battle.status === 'active' ? (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Join Live Battle
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Enter Lobby
                      </>
                    )}
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {battles.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12 text-muted-foreground"
              >
                <Swords className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No active battles</p>
                <p className="text-sm">Create one to start competing!</p>
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* Arena Tab */}
        <TabsContent value="arena" className="space-y-4">
          {currentBattle && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Problem & Code Editor */}
              <div className="lg:col-span-2 space-y-4">
                {/* Timer Bar */}
                {currentBattle.status === 'active' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass-card p-4 flex items-center justify-between ${
                      timeLeft <= 60 ? 'border-red-500 bg-red-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Timer className={`w-6 h-6 ${timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
                      <span className="text-2xl font-mono font-bold">{formatTime(timeLeft)}</span>
                    </div>
                    <Button onClick={submitCode} disabled={isSubmitting} variant="gradient">
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Submitting...' : 'Submit Code'}
                    </Button>
                  </motion.div>
                )}

                {/* Problem Statement */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-display font-semibold">{currentBattle.title}</h2>
                    <span className={`text-xs px-3 py-1 rounded-full ${getDifficultyColor(currentBattle.difficulty)}`}>
                      {currentBattle.difficulty}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-muted-foreground">{currentBattle.problem_statement}</p>
                  </div>
                </div>

                {/* Code Editor */}
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Code className="w-5 h-5 text-primary" />
                      Your Solution
                    </h3>
                  </div>
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="font-mono text-sm min-h-[400px] bg-muted/50"
                    placeholder="Write your code here..."
                    disabled={currentBattle.status !== 'active'}
                  />
                </div>
              </div>

              {/* Participants Sidebar */}
              <div className="space-y-4">
                {/* Battle Status */}
                <div className="glass-card p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Battle Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        currentBattle.status === 'active' ? 'bg-green-500/20 text-green-500' :
                        currentBattle.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {currentBattle.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Participants</span>
                      <span>{participants.length}/{currentBattle.max_participants}</span>
                    </div>
                  </div>
                  
                  {currentBattle.status === 'waiting' && currentBattle.created_by === user?.id && (
                    <Button onClick={startBattle} className="w-full mt-4" variant="gradient" disabled={participants.length < 2}>
                      <Play className="w-4 h-4 mr-2" />
                      Start Battle
                    </Button>
                  )}
                </div>

                {/* Live Participants */}
                <div className="glass-card p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Live Rankings
                  </h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                      {participants.map((p, index) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          layout
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            p.user_id === user?.id ? 'bg-primary/20 border border-primary/30' : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg w-6">
                              {index === 0 && p.score > 0 ? <Crown className="w-5 h-5 text-yellow-500" /> : `#${index + 1}`}
                            </span>
                            <div>
                              <p className="font-medium text-sm">{p.username}</p>
                              <div className="flex items-center gap-1">
                                {p.status === 'submitted' ? (
                                  p.is_correct ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  )
                                ) : (
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {p.status === 'submitted' ? 'Submitted' : 'Coding...'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="font-bold text-primary">{p.score}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <div className="glass-card p-6">
            <h2 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              All-Time Leaderboard
            </h2>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' :
                    index === 1 ? 'bg-gradient-to-r from-slate-400/20 to-slate-300/20 border border-slate-400/30' :
                    index === 2 ? 'bg-gradient-to-r from-orange-600/20 to-orange-500/20 border border-orange-600/30' :
                    'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-2xl w-10">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <div>
                      <p className="font-semibold">{entry.username}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{entry.battles_played} battles</span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {entry.best_streak} streak
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">{entry.battles_won} wins</p>
                    <p className="text-xs text-muted-foreground">{entry.total_score} pts</p>
                  </div>
                </motion.div>
              ))}
              
              {leaderboard.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No battles completed yet</p>
                  <p className="text-sm">Be the first champion!</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Battle Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                <Swords className="w-6 h-6 text-primary" />
                Create Battle Arena
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Battle Title *</label>
                  <Input
                    value={newBattle.title}
                    onChange={(e) => setNewBattle({ ...newBattle, title: e.target.value })}
                    placeholder="e.g., Array Challenge #1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Input
                    value={newBattle.description}
                    onChange={(e) => setNewBattle({ ...newBattle, description: e.target.value })}
                    placeholder="Brief description of the challenge"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Problem Statement *</label>
                  <Textarea
                    value={newBattle.problem_statement}
                    onChange={(e) => setNewBattle({ ...newBattle, problem_statement: e.target.value })}
                    placeholder="Describe the coding problem in detail..."
                    className="min-h-[150px]"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Starter Code</label>
                  <Textarea
                    value={newBattle.starter_code}
                    onChange={(e) => setNewBattle({ ...newBattle, starter_code: e.target.value })}
                    placeholder="// Starter code template"
                    className="font-mono min-h-[100px]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Difficulty</label>
                    <select
                      value={newBattle.difficulty}
                      onChange={(e) => setNewBattle({ ...newBattle, difficulty: e.target.value })}
                      className="w-full p-2 rounded-lg bg-muted border border-border"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Time Limit (minutes)</label>
                    <Input
                      type="number"
                      value={newBattle.time_limit_seconds / 60}
                      onChange={(e) => setNewBattle({ ...newBattle, time_limit_seconds: parseInt(e.target.value) * 60 })}
                      min={5}
                      max={60}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={createBattle} variant="gradient" className="flex-1">
                    <Swords className="w-4 h-4 mr-2" />
                    Create Battle
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
