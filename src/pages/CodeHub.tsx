import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SyntaxHighlighter from "@/components/code/SyntaxHighlighter";
import { 
  Code, Terminal, Braces, Plus, Send, Copy, Star, Eye, MessageSquare,
  Users, Flame, Crown, Heart, Share2, Bookmark, Zap, GitBranch, Globe,
  BookOpen, FileCode, Database, Cpu, Layers, Bug, CheckCircle, Clock,
  Award, TrendingUp, Search, Filter, ChevronDown, Play, X
} from "lucide-react";

interface Snippet {
  id: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  category: string | null;
  tags: string[] | null;
  likes_count: number | null;
  views_count: number | null;
  is_featured: boolean | null;
  created_at: string;
  user_id: string;
}

interface CodingChallenge {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  xp_reward: number;
  deadline: string | null;
  language: string;
  starter_code: string | null;
  is_active: boolean;
}

interface ReviewRequest {
  id: string;
  snippet_id: string;
  requester_id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  snippet?: Snippet;
  responses?: ReviewResponse[];
}

interface ReviewResponse {
  id: string;
  request_id: string;
  reviewer_id: string;
  feedback: string;
  rating: number;
  xp_earned: number;
  created_at: string;
}

const LANGUAGES = [
  { id: "javascript", label: "JavaScript", icon: "🟨" },
  { id: "typescript", label: "TypeScript", icon: "🔷" },
  { id: "python", label: "Python", icon: "🐍" },
  { id: "html", label: "HTML", icon: "🌐" },
  { id: "css", label: "CSS", icon: "🎨" },
  { id: "java", label: "Java", icon: "☕" },
  { id: "cpp", label: "C++", icon: "⚡" },
  { id: "sql", label: "SQL", icon: "🗃️" },
];

const CATEGORIES = [
  { id: "general", label: "General", icon: Code },
  { id: "algorithms", label: "Algorithms", icon: Cpu },
  { id: "web", label: "Web Dev", icon: Globe },
  { id: "database", label: "Database", icon: Database },
  { id: "utils", label: "Utilities", icon: Layers },
  { id: "debugging", label: "Debugging", icon: Bug },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", color: "text-green-600 bg-green-100" },
  { id: "medium", label: "Medium", color: "text-amber-600 bg-amber-100" },
  { id: "hard", label: "Hard", color: "text-red-600 bg-red-100" },
];

export default function CodeHub() {
  const { user, profile } = useAuth();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [showSnippetForm, setShowSnippetForm] = useState(false);
  const [showReviewRequestForm, setShowReviewRequestForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"snippets" | "challenges" | "reviews" | "resources">("snippets");
  const [likedSnippets, setLikedSnippets] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [newSnippet, setNewSnippet] = useState({
    title: "",
    description: "",
    code: "",
    language: "javascript",
    category: "general",
  });
  const [newReviewRequest, setNewReviewRequest] = useState({
    snippet_id: "",
    title: "",
    description: "",
  });
  const [newReview, setNewReview] = useState({
    feedback: "",
    rating: 5,
  });

  useEffect(() => {
    fetchSnippets();
    fetchChallenges();
    fetchReviewRequests();
    if (user) fetchCompletedChallenges();
  }, [user]);

  const fetchSnippets = async () => {
    const { data } = await supabase
      .from("code_hub_snippets")
      .select("*")
      .order("created_at", { ascending: false });
    setSnippets((data as Snippet[]) || []);
  };

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from("coding_challenges")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setChallenges((data as CodingChallenge[]) || []);
  };

  const fetchReviewRequests = async () => {
    const { data } = await supabase
      .from("code_review_requests")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Fetch associated snippets and responses
    if (data) {
      const enrichedRequests = await Promise.all(data.map(async (req) => {
        const { data: snippet } = await supabase
          .from("code_hub_snippets")
          .select("*")
          .eq("id", req.snippet_id)
          .single();
        const { data: responses } = await supabase
          .from("review_responses")
          .select("*")
          .eq("request_id", req.id);
        return { ...req, snippet, responses: responses || [] };
      }));
      setReviewRequests(enrichedRequests as ReviewRequest[]);
    }
  };

  const fetchCompletedChallenges = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("challenge_completions")
      .select("challenge_id")
      .eq("user_id", user.id);
    setCompletedChallenges(data?.map(c => c.challenge_id) || []);
  };

  const submitSnippet = async () => {
    if (!user || !newSnippet.title || !newSnippet.code) {
      toast.error("Please fill in title and code");
      return;
    }
    const { error } = await supabase.from("code_hub_snippets").insert({
      user_id: user.id,
      title: newSnippet.title,
      description: newSnippet.description,
      code: newSnippet.code,
      language: newSnippet.language,
      category: newSnippet.category,
    });
    if (error) {
      toast.error("Failed to share snippet");
      return;
    }
    toast.success("Snippet shared! 🚀");
    setNewSnippet({ title: "", description: "", code: "", language: "javascript", category: "general" });
    setShowSnippetForm(false);
    fetchSnippets();
  };

  const completeChallenge = async (challengeId: string, xpReward: number) => {
    if (!user) {
      toast.error("Please login to complete challenges");
      return;
    }
    
    const { error } = await supabase.from("challenge_completions").insert({
      challenge_id: challengeId,
      user_id: user.id,
      xp_earned: xpReward,
    });
    
    if (error) {
      if (error.code === "23505") {
        toast.error("You've already completed this challenge!");
      } else {
        toast.error("Failed to complete challenge");
      }
      return;
    }

    // Award XP to user
    if (profile) {
      const newXP = (profile.xp_points || 0) + xpReward;
      const newLevel = Math.floor(newXP / 100) + 1;
      await supabase.from("profiles").update({ xp_points: newXP, level: newLevel }).eq("user_id", user.id);
    }

    toast.success(`Challenge completed! +${xpReward} XP 🎉`);
    fetchCompletedChallenges();
  };

  const submitReviewRequest = async () => {
    if (!user || !newReviewRequest.snippet_id || !newReviewRequest.title) {
      toast.error("Please select a snippet and add a title");
      return;
    }

    const { error } = await supabase.from("code_review_requests").insert({
      snippet_id: newReviewRequest.snippet_id,
      requester_id: user.id,
      title: newReviewRequest.title,
      description: newReviewRequest.description,
    });

    if (error) {
      toast.error("Failed to submit review request");
      return;
    }

    toast.success("Review request submitted! 📝");
    setNewReviewRequest({ snippet_id: "", title: "", description: "" });
    setShowReviewRequestForm(false);
    fetchReviewRequests();
  };

  const submitReview = async (requestId: string) => {
    if (!user || !newReview.feedback) {
      toast.error("Please provide feedback");
      return;
    }

    const xpEarned = 25; // Base XP for reviews
    const { error } = await supabase.from("review_responses").insert({
      request_id: requestId,
      reviewer_id: user.id,
      feedback: newReview.feedback,
      rating: newReview.rating,
      xp_earned: xpEarned,
    });

    if (error) {
      toast.error("Failed to submit review");
      return;
    }

    // Award XP to reviewer
    if (profile) {
      const newXP = (profile.xp_points || 0) + xpEarned;
      const newLevel = Math.floor(newXP / 100) + 1;
      await supabase.from("profiles").update({ xp_points: newXP, level: newLevel }).eq("user_id", user.id);
    }

    toast.success(`Review submitted! +${xpEarned} XP 🌟`);
    setNewReview({ feedback: "", rating: 5 });
    setShowReviewForm(null);
    fetchReviewRequests();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const toggleLike = (snippetId: string) => {
    setLikedSnippets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(snippetId)) {
        newSet.delete(snippetId);
      } else {
        newSet.add(snippetId);
      }
      return newSet;
    });
  };

  const filteredSnippets = snippets.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = !selectedLanguage || s.language === selectedLanguage;
    return matchesSearch && matchesLanguage;
  });

  const mySnippets = snippets.filter(s => s.user_id === user?.id);

  const resources = [
    { title: "MDN Web Docs", description: "Comprehensive web development documentation", icon: Globe, link: "https://developer.mozilla.org", badge: "Essential" },
    { title: "Stack Overflow", description: "Q&A platform for programmers", icon: MessageSquare, link: "https://stackoverflow.com", badge: "Popular" },
    { title: "GitHub", description: "Code hosting and collaboration", icon: GitBranch, link: "https://github.com", badge: "Must-have" },
    { title: "LeetCode", description: "Coding challenges and interview prep", icon: Code, link: "https://leetcode.com", badge: "Practice" },
    { title: "freeCodeCamp", description: "Free coding tutorials and certifications", icon: BookOpen, link: "https://freecodecamp.org", badge: "Learning" },
    { title: "DevDocs", description: "API documentation browser", icon: FileCode, link: "https://devdocs.io", badge: "Reference" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-background to-cyan-500/10 p-8 md:p-12"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">
                <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">Code</span> Hub
              </h1>
              <p className="text-muted-foreground">Share, learn, and collaborate on code</p>
            </div>
          </motion.div>

          <div className="flex flex-wrap gap-6 mt-6">
            {[
              { label: "Code Snippets", value: snippets.length, icon: Braces },
              { label: "Challenges", value: challenges.length, icon: Zap },
              { label: "Review Requests", value: reviewRequests.filter(r => r.status === "pending").length, icon: MessageSquare },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="flex gap-2 p-1.5 bg-muted/50 backdrop-blur rounded-2xl">
          {[
            { id: "snippets", label: "Snippets Library", icon: Braces },
            { id: "challenges", label: "Code Challenges", icon: Zap },
            { id: "reviews", label: "Peer Reviews", icon: MessageSquare },
            { id: "resources", label: "Resources", icon: BookOpen },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={`rounded-xl ${activeTab === tab.id ? "shadow-md" : ""}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Snippets Tab */}
        {activeTab === "snippets" && (
          <motion.div
            key="snippets"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search snippets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedLanguage || ""}
                  onChange={(e) => setSelectedLanguage(e.target.value || null)}
                  className="px-3 py-2 rounded-xl border border-input bg-background text-sm"
                >
                  <option value="">All Languages</option>
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.icon} {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={() => setShowSnippetForm(!showSnippetForm)} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Share Snippet
              </Button>
            </div>

            {/* Snippet Form */}
            <AnimatePresence>
              {showSnippetForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-card p-6 space-y-4">
                    <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-emerald-500" />
                      Share Your Code
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Snippet title"
                        value={newSnippet.title}
                        onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <select
                          value={newSnippet.language}
                          onChange={(e) => setNewSnippet({ ...newSnippet, language: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-sm"
                        >
                          {LANGUAGES.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                              {lang.icon} {lang.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newSnippet.category}
                          onChange={(e) => setNewSnippet({ ...newSnippet, category: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-sm"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <Input
                      placeholder="Brief description of what this code does"
                      value={newSnippet.description}
                      onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value })}
                    />

                    <div className="relative">
                      <textarea
                        placeholder="Paste your code here..."
                        value={newSnippet.code}
                        onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
                        rows={10}
                        className="w-full rounded-xl border border-input bg-card/60 px-4 py-3 font-mono text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={submitSnippet} className="rounded-xl bg-emerald-500 hover:bg-emerald-600">
                        <Send className="w-4 h-4 mr-2" />
                        Share Snippet
                      </Button>
                      <Button variant="ghost" onClick={() => setShowSnippetForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Snippets Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredSnippets.map((snippet, index) => (
                <motion.div
                  key={snippet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-5 hover-lift group cursor-pointer"
                  onClick={() => setSelectedSnippet(snippet)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {LANGUAGES.find((l) => l.id === snippet.language)?.icon || "📄"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-medium">
                        {snippet.language}
                      </span>
                      {snippet.is_featured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-xs font-medium flex items-center gap-1">
                          <Star className="w-3 h-3" /> Featured
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); copyCode(snippet.code); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <h4 className="font-display font-semibold group-hover:text-emerald-500 transition-colors">
                    {snippet.title}
                  </h4>
                  {snippet.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {snippet.description}
                    </p>
                  )}

                  <div className="mt-3 rounded-lg overflow-hidden">
                    <SyntaxHighlighter 
                      code={snippet.code.slice(0, 200) + (snippet.code.length > 200 ? "..." : "")} 
                      language={snippet.language}
                      maxHeight="120px"
                    />
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-muted-foreground">
                      {new Date(snippet.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(snippet.id); }}
                        className={`p-2 rounded-lg transition-colors ${
                          likedSnippets.has(snippet.id)
                            ? "text-red-500 bg-red-500/10"
                            : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${likedSnippets.has(snippet.id) ? "fill-current" : ""}`} />
                      </button>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {snippet.views_count || 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredSnippets.length === 0 && (
              <div className="text-center py-16 glass-card rounded-3xl">
                <Braces className="w-16 h-16 mx-auto mb-4 text-emerald-500/50" />
                <h3 className="text-xl font-display font-semibold mb-2">No snippets yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to share your code!</p>
                <Button onClick={() => setShowSnippetForm(true)} className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Share First Snippet
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Code Challenges Tab */}
        {activeTab === "challenges" && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold">Coding Challenges</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flame className="w-4 h-4 text-orange-500" />
                Complete challenges to earn XP
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.length > 0 ? (
                challenges.map((challenge, index) => {
                  const isCompleted = completedChallenges.includes(challenge.id);
                  const difficultyStyle = DIFFICULTIES.find(d => d.id === challenge.difficulty);
                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`glass-card p-6 hover-lift relative overflow-hidden group ${isCompleted ? "opacity-75" : ""}`}
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${difficultyStyle?.color || ""}`}>
                          {challenge.difficulty}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold">
                          +{challenge.xp_reward} XP
                        </span>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <Terminal className="w-6 h-6 text-emerald-600" />
                        )}
                      </div>

                      <h3 className="text-lg font-display font-semibold mb-2 pr-24">
                        {challenge.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {challenge.description}
                      </p>

                      {challenge.language !== "any" && (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-muted text-xs mb-3">
                          {LANGUAGES.find(l => l.id === challenge.language)?.icon} {challenge.language}
                        </span>
                      )}

                      {challenge.deadline && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                          <Clock className="w-3 h-3" />
                          Due: {new Date(challenge.deadline).toLocaleDateString()}
                        </div>
                      )}

                      <Button
                        variant={isCompleted ? "outline" : "default"}
                        className={`w-full rounded-xl ${!isCompleted ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                        onClick={() => !isCompleted && completeChallenge(challenge.id, challenge.xp_reward)}
                        disabled={isCompleted}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Start Challenge
                          </>
                        )}
                      </Button>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-16 glass-card rounded-3xl">
                  <Zap className="w-16 h-16 mx-auto mb-4 text-emerald-500/50" />
                  <h3 className="text-xl font-display font-semibold mb-2">No challenges yet</h3>
                  <p className="text-muted-foreground">Admins will post coding challenges soon!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Peer Reviews Tab */}
        {activeTab === "reviews" && (
          <motion.div
            key="reviews"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold">Peer Code Reviews</h2>
              <Button onClick={() => setShowReviewRequestForm(true)} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Request Review
              </Button>
            </div>

            {/* Review Request Form */}
            <AnimatePresence>
              {showReviewRequestForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-card p-6 space-y-4">
                    <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-cyan-500" />
                      Request Code Review
                    </h3>

                    <select
                      value={newReviewRequest.snippet_id}
                      onChange={(e) => setNewReviewRequest({ ...newReviewRequest, snippet_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm"
                    >
                      <option value="">Select one of your snippets</option>
                      {mySnippets.map((snippet) => (
                        <option key={snippet.id} value={snippet.id}>
                          {snippet.title} ({snippet.language})
                        </option>
                      ))}
                    </select>

                    <Input
                      placeholder="What would you like feedback on?"
                      value={newReviewRequest.title}
                      onChange={(e) => setNewReviewRequest({ ...newReviewRequest, title: e.target.value })}
                    />

                    <textarea
                      placeholder="Add more context about what you're trying to achieve..."
                      value={newReviewRequest.description}
                      onChange={(e) => setNewReviewRequest({ ...newReviewRequest, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl border border-input bg-card/60 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 resize-none"
                    />

                    <div className="flex gap-2">
                      <Button onClick={submitReviewRequest} className="rounded-xl bg-cyan-500 hover:bg-cyan-600">
                        <Send className="w-4 h-4 mr-2" />
                        Submit Request
                      </Button>
                      <Button variant="ghost" onClick={() => setShowReviewRequestForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Review Requests List */}
            <div className="space-y-4">
              {reviewRequests.length > 0 ? (
                reviewRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-display font-semibold">{request.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            request.status === "pending" 
                              ? "bg-amber-500/20 text-amber-600" 
                              : "bg-emerald-500/20 text-emerald-600"
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        {request.description && (
                          <p className="text-sm text-muted-foreground">{request.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {request.snippet && (
                      <div className="mb-4 p-4 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">
                            {LANGUAGES.find((l) => l.id === request.snippet?.language)?.icon || "📄"}
                          </span>
                          <span className="font-medium">{request.snippet.title}</span>
                        </div>
                        <SyntaxHighlighter 
                          code={request.snippet.code.slice(0, 300) + (request.snippet.code.length > 300 ? "..." : "")} 
                          language={request.snippet.language}
                          maxHeight="150px"
                        />
                      </div>
                    )}

                    {/* Existing Reviews */}
                    {request.responses && request.responses.length > 0 && (
                      <div className="space-y-3 mb-4">
                        <h5 className="text-sm font-medium flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Reviews ({request.responses.length})
                        </h5>
                        {request.responses.map((response) => (
                          <div key={response.id} className="p-3 rounded-lg bg-background border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3 h-3 ${i < response.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-emerald-600">+{response.xp_earned} XP</span>
                            </div>
                            <p className="text-sm">{response.feedback}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Review Button/Form */}
                    {request.requester_id !== user?.id && (
                      showReviewForm === request.id ? (
                        <div className="space-y-3 p-4 rounded-xl bg-muted/30">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Rating:</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                className="p-1"
                              >
                                <Star className={`w-5 h-5 ${star <= newReview.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            placeholder="Write your feedback..."
                            value={newReview.feedback}
                            onChange={(e) => setNewReview({ ...newReview, feedback: e.target.value })}
                            rows={3}
                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-none"
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => submitReview(request.id)} size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                              <Send className="w-4 h-4 mr-2" />
                              Submit (+25 XP)
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowReviewForm(request.id)}
                          className="rounded-xl"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Write Review (+25 XP)
                        </Button>
                      )
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-16 glass-card rounded-3xl">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-cyan-500/50" />
                  <h3 className="text-xl font-display font-semibold mb-2">No review requests yet</h3>
                  <p className="text-muted-foreground mb-4">Be the first to request feedback on your code!</p>
                  <Button onClick={() => setShowReviewRequestForm(true)} className="bg-cyan-500 hover:bg-cyan-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Request Review
                  </Button>
                </div>
              )}
            </div>

            {/* Review Guidelines */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Review Guidelines
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { title: "Be Constructive", desc: "Focus on improvements, not criticism", icon: "💡" },
                  { title: "Be Specific", desc: "Point to exact lines and suggest fixes", icon: "🎯" },
                  { title: "Earn XP", desc: "Get 25 XP for each quality review", icon: "⭐" },
                ].map((guideline) => (
                  <div key={guideline.title} className="p-4 rounded-xl bg-muted/50">
                    <span className="text-2xl">{guideline.icon}</span>
                    <h4 className="font-semibold mt-2">{guideline.title}</h4>
                    <p className="text-sm text-muted-foreground">{guideline.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Resources Tab */}
        {activeTab === "resources" && (
          <motion.div
            key="resources"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-display font-semibold">Coding Resources</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource, index) => (
                <motion.a
                  key={resource.title}
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-5 hover-lift group block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <resource.icon className="w-5 h-5 text-emerald-500" />
                    </div>
                    {resource.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                        {resource.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-semibold group-hover:text-emerald-500 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                </motion.a>
              ))}
            </div>

            {/* Quick Tips */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Pro Tips for Learning
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Practice coding daily, even if just for 15 minutes",
                  "Read other people's code to learn new patterns",
                  "Don't be afraid to ask questions",
                  "Build projects to apply what you learn",
                  "Participate in code reviews",
                  "Keep a coding journal of what you learn",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snippet Detail Modal */}
      <AnimatePresence>
        {selectedSnippet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedSnippet(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">
                      {LANGUAGES.find((l) => l.id === selectedSnippet.language)?.icon || "📄"}
                    </span>
                    <h3 className="text-xl font-display font-semibold">{selectedSnippet.title}</h3>
                  </div>
                  {selectedSnippet.description && (
                    <p className="text-muted-foreground">{selectedSnippet.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyCode(selectedSnippet.code)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedSnippet(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="p-6 overflow-auto max-h-[60vh]">
                <SyntaxHighlighter 
                  code={selectedSnippet.code} 
                  language={selectedSnippet.language}
                  showLineNumbers
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
