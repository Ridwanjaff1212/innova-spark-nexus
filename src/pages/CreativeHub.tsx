import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Lightbulb, Sparkles, Target, Plus, Send, Rocket, Palette, Code, Puzzle,
  Users, Flame, Crown, MessageSquare, Heart, Share2, Bookmark, Zap, 
  Wand2, Brain, Layers, GitBranch, Globe, BookOpen, Video, Mic
} from "lucide-react";

interface Post { 
  id: string; 
  title: string; 
  content: string | null; 
  type: string | null; 
  created_at: string; 
  user_id: string; 
}

interface Challenge { 
  id: string; 
  title: string; 
  description: string | null; 
  xp_reward: number | null; 
  deadline: string | null; 
}

export default function CreativeHub() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [newPost, setNewPost] = useState({ title: "", content: "", type: "idea" });
  const [showPostForm, setShowPostForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"ideas" | "challenges" | "resources" | "inspiration">("ideas");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => { 
    fetchPosts(); 
    fetchChallenges(); 
  }, []);

  const fetchPosts = async () => { 
    const { data } = await supabase.from("creative_hub_posts").select("*").order("created_at", { ascending: false }); 
    setPosts(data || []); 
  };

  const fetchChallenges = async () => { 
    const { data } = await supabase.from("challenges").select("*").order("deadline", { ascending: true }); 
    setChallenges(data || []); 
  };

  const submitPost = async () => {
    if (!user || !newPost.title) return;
    const { error } = await supabase.from("creative_hub_posts").insert({ 
      user_id: user.id, 
      title: newPost.title, 
      content: newPost.content, 
      type: newPost.type 
    });
    if (error) { 
      toast.error("Failed to post idea"); 
      return; 
    }
    toast.success("Idea shared! 💡"); 
    setNewPost({ title: "", content: "", type: "idea" }); 
    setShowPostForm(false); 
    fetchPosts();
  };

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const inspirationBoards = [
    { title: "AI & Machine Learning", icon: Brain, color: "from-purple-500 to-pink-500", items: 12 },
    { title: "Web Development", icon: Globe, color: "from-blue-500 to-cyan-500", items: 18 },
    { title: "IoT & Robotics", icon: Layers, color: "from-green-500 to-emerald-500", items: 9 },
    { title: "Game Development", icon: Rocket, color: "from-orange-500 to-red-500", items: 15 },
  ];

  const resources = [
    { title: "GitHub Templates", description: "Beautiful README & project templates", icon: GitBranch, link: "#", badge: "Popular" },
    { title: "Design Systems", description: "UI/UX patterns & components", icon: Palette, link: "#", badge: "New" },
    { title: "Problem Solving", description: "Innovation frameworks & techniques", icon: Puzzle, link: "#" },
    { title: "Tech Stack Guide", description: "Choose the right tools for your project", icon: Rocket, link: "#" },
    { title: "Video Tutorials", description: "Learn from experts", icon: Video, link: "#", badge: "Featured" },
    { title: "Documentation Hub", description: "Best practices & guides", icon: BookOpen, link: "#" },
  ];

  const postTypes = [
    { id: "idea", label: "Idea", icon: Lightbulb, color: "bg-yellow-500" },
    { id: "question", label: "Question", icon: MessageSquare, color: "bg-blue-500" },
    { id: "discussion", label: "Discussion", icon: Users, color: "bg-purple-500" },
    { id: "showcase", label: "Showcase", icon: Sparkles, color: "bg-pink-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 md:p-12"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <motion.div 
            initial={{ scale: 0.9 }} 
            animate={{ scale: 1 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">
                <span className="gradient-text">Creative</span> Hub
              </h1>
              <p className="text-muted-foreground">Where ideas spark and innovation begins</p>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 mt-6">
            {[
              { label: "Ideas Shared", value: posts.length, icon: Lightbulb },
              { label: "Active Challenges", value: challenges.length, icon: Target },
              { label: "Collaborators", value: "50+", icon: Users },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
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
            { id: "ideas", label: "Ideas Board", icon: Lightbulb },
            { id: "challenges", label: "Challenges", icon: Target },
            { id: "inspiration", label: "Inspiration", icon: Sparkles },
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

      {/* Ideas Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "ideas" && (
          <motion.div 
            key="ideas"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Post Form Toggle */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-semibold">Recent Ideas</h2>
              <Button onClick={() => setShowPostForm(!showPostForm)} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Share Idea
              </Button>
            </div>

            {/* Post Form */}
            <AnimatePresence>
              {showPostForm && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-card p-6 space-y-4">
                    <h3 className="text-lg font-display font-semibold">Share Your Idea</h3>
                    
                    {/* Post Type Selection */}
                    <div className="flex gap-2">
                      {postTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setNewPost({ ...newPost, type: type.id })}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                            newPost.type === type.id 
                              ? "border-primary bg-primary/10 text-foreground" 
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </button>
                      ))}
                    </div>

                    <Input 
                      placeholder="What's your brilliant idea?" 
                      value={newPost.title} 
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="text-lg"
                    />
                    
                    <textarea 
                      placeholder="Tell us more about it..." 
                      value={newPost.content} 
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} 
                      rows={4} 
                      className="w-full rounded-xl border border-input bg-card/60 px-4 py-3 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-none"
                    />

                    <div className="flex gap-2">
                      <Button onClick={submitPost} className="rounded-xl">
                        <Send className="w-4 h-4 mr-2" />
                        Post Idea
                      </Button>
                      <Button variant="ghost" onClick={() => setShowPostForm(false)}>Cancel</Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Posts Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {posts.map((post, index) => (
                <motion.div 
                  key={post.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-5 hover-lift group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      post.type === "idea" ? "bg-yellow-500/20" :
                      post.type === "question" ? "bg-blue-500/20" :
                      post.type === "showcase" ? "bg-pink-500/20" : "bg-purple-500/20"
                    }`}>
                      {post.type === "idea" ? <Lightbulb className="w-6 h-6 text-yellow-600" /> :
                       post.type === "question" ? <MessageSquare className="w-6 h-6 text-blue-600" /> :
                       post.type === "showcase" ? <Sparkles className="w-6 h-6 text-pink-600" /> :
                       <Users className="w-6 h-6 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                          {post.type}
                        </span>
                      </div>
                      <h4 className="font-display font-semibold group-hover:text-primary transition-colors">
                        {post.title}
                      </h4>
                      {post.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {post.content}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleLike(post.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              likedPosts.has(post.id) 
                                ? "text-red-500 bg-red-500/10" 
                                : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                          </button>
                          <button className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {posts.length === 0 && (
              <div className="text-center py-16 glass-card rounded-3xl">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                <h3 className="text-xl font-display font-semibold mb-2">No ideas yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to share your brilliant idea!</p>
                <Button onClick={() => setShowPostForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Share First Idea
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Challenges Tab */}
        {activeTab === "challenges" && (
          <motion.div 
            key="challenges"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold">Active Challenges</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flame className="w-4 h-4 text-orange-500" />
                Earn XP by completing challenges
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.length > 0 ? challenges.map((challenge, index) => (
                <motion.div 
                  key={challenge.id} 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 hover-lift relative overflow-hidden group"
                >
                  {/* XP Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary/70 text-primary-foreground text-sm font-bold">
                    +{challenge.xp_reward} XP
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-orange-600" />
                  </div>

                  <h3 className="text-lg font-display font-semibold mb-2 pr-20">
                    {challenge.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {challenge.description}
                  </p>

                  {challenge.deadline && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <Zap className="w-3 h-3" />
                      Due: {new Date(challenge.deadline).toLocaleDateString()}
                    </div>
                  )}

                  <Button variant="outline" className="w-full rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    Accept Challenge
                  </Button>
                </motion.div>
              )) : (
                <div className="col-span-full text-center py-16 glass-card rounded-3xl">
                  <Target className="w-16 h-16 mx-auto mb-4 text-orange-500/50" />
                  <h3 className="text-xl font-display font-semibold mb-2">No active challenges</h3>
                  <p className="text-muted-foreground">Check back soon for new challenges!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Inspiration Tab */}
        {activeTab === "inspiration" && (
          <motion.div 
            key="inspiration"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-display font-semibold">Inspiration Boards</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {inspirationBoards.map((board, index) => (
                <motion.div
                  key={board.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 hover-lift cursor-pointer group"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${board.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <board.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-display font-semibold">{board.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{board.items} projects</p>
                </motion.div>
              ))}
            </div>

            {/* Featured Projects */}
            <div className="mt-8">
              <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Featured Work
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[1, 2, 3].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="glass-card overflow-hidden group cursor-pointer"
                  >
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary/50" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold group-hover:text-primary transition-colors">
                        Featured Project {i + 1}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        A showcase of innovation
                      </p>
                    </div>
                  </motion.div>
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
            <h2 className="text-xl font-display font-semibold">Tools & Resources</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource, index) => (
                <motion.a 
                  key={resource.title} 
                  href={resource.link}
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 hover-lift flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                    <resource.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold group-hover:text-primary transition-colors">
                        {resource.title}
                      </h3>
                      {resource.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                          {resource.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}