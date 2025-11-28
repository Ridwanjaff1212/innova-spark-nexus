import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lightbulb, Sparkles, Target, Plus, Send, Rocket, Palette, Code, Puzzle } from "lucide-react";

interface Post { id: string; title: string; content: string | null; type: string | null; created_at: string; user_id: string; }
interface Challenge { id: string; title: string; description: string | null; xp_reward: number | null; deadline: string | null; }

export default function CreativeHub() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [newPost, setNewPost] = useState({ title: "", content: "", type: "idea" });
  const [showPostForm, setShowPostForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"ideas" | "challenges" | "resources">("ideas");

  useEffect(() => { fetchPosts(); fetchChallenges(); }, []);

  const fetchPosts = async () => { const { data } = await supabase.from("creative_hub_posts").select("*").order("created_at", { ascending: false }); setPosts(data || []); };
  const fetchChallenges = async () => { const { data } = await supabase.from("challenges").select("*").order("deadline", { ascending: true }); setChallenges(data || []); };

  const submitPost = async () => {
    if (!user || !newPost.title) return;
    const { error } = await supabase.from("creative_hub_posts").insert({ user_id: user.id, title: newPost.title, content: newPost.content, type: newPost.type });
    if (error) { toast.error("Failed to post idea"); return; }
    toast.success("Idea shared! 💡"); setNewPost({ title: "", content: "", type: "idea" }); setShowPostForm(false); fetchPosts();
  };

  const resources = [
    { title: "GitHub README Templates", description: "Beautiful templates", icon: Code, link: "#" },
    { title: "Design Inspiration", description: "UI/UX patterns", icon: Palette, link: "#" },
    { title: "Problem Solving Guide", description: "Innovation techniques", icon: Puzzle, link: "#" },
    { title: "Tech Stack Guide", description: "Choose the right tools", icon: Rocket, link: "#" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-4xl font-display font-bold"><span className="gradient-text">Creative</span> Hub</h1>
        <p className="text-muted-foreground mt-2">Where ideas spark and innovation begins</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center gap-2">
        {[{ id: "ideas", label: "Ideas Board", icon: Lightbulb }, { id: "challenges", label: "Mini Challenges", icon: Target }, { id: "resources", label: "Resources", icon: Sparkles }].map((tab) => (
          <Button key={tab.id} variant={activeTab === tab.id ? "gradient" : "glass"} onClick={() => setActiveTab(tab.id as any)}><tab.icon className="w-4 h-4 mr-2" />{tab.label}</Button>
        ))}
      </motion.div>

      {activeTab === "ideas" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-end"><Button variant="gradient" onClick={() => setShowPostForm(!showPostForm)}><Plus className="w-4 h-4 mr-2" />Share Idea</Button></div>
          {showPostForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <h3 className="text-lg font-display font-semibold mb-4">Share Your Idea</h3>
              <div className="space-y-4">
                <div><label className="text-sm font-medium mb-1 block">Title</label><Input placeholder="What's your idea?" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} /></div>
                <div><label className="text-sm font-medium mb-1 block">Description</label><textarea placeholder="Tell us more..." value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} rows={3} className="w-full rounded-xl border border-input bg-card/60 px-4 py-3 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-none" /></div>
                <div className="flex gap-2">{["idea", "question", "discussion"].map((type) => (<Button key={type} variant={newPost.type === type ? "default" : "outline"} size="sm" onClick={() => setNewPost({ ...newPost, type })}>{type.charAt(0).toUpperCase() + type.slice(1)}</Button>))}</div>
                <div className="flex gap-2"><Button variant="gradient" onClick={submitPost}><Send className="w-4 h-4 mr-2" />Post</Button><Button variant="ghost" onClick={() => setShowPostForm(false)}>Cancel</Button></div>
              </div>
            </motion.div>
          )}
          <div className="grid md:grid-cols-2 gap-4">{posts.map((post, index) => (<motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="glass-card p-5 hover-lift"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0"><Lightbulb className="w-5 h-5 text-primary-foreground" /></div><div className="flex-1 min-w-0"><span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">{post.type}</span><h4 className="font-medium mt-1">{post.title}</h4>{post.content && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.content}</p>}<p className="text-xs text-muted-foreground mt-2">{new Date(post.created_at).toLocaleDateString()}</p></div></div></motion.div>))}</div>
          {posts.length === 0 && <div className="text-center py-16 glass-card"><Lightbulb className="w-16 h-16 mx-auto mb-4 text-primary/50" /><h3 className="text-xl font-display font-semibold mb-2">No ideas yet</h3><p className="text-muted-foreground">Be the first to share!</p></div>}
        </motion.div>
      )}

      {activeTab === "challenges" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.length > 0 ? challenges.map((challenge, index) => (<motion.div key={challenge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} className="glass-card p-6 hover-lift border-l-4 border-l-secondary"><Target className="w-8 h-8 text-secondary mb-3" /><h3 className="text-lg font-display font-semibold mb-2">{challenge.title}</h3><p className="text-sm text-muted-foreground mb-4">{challenge.description}</p><div className="flex items-center justify-between"><span className="text-accent font-semibold">+{challenge.xp_reward} XP</span>{challenge.deadline && <span className="text-xs text-muted-foreground">Due: {new Date(challenge.deadline).toLocaleDateString()}</span>}</div></motion.div>)) : <div className="col-span-full text-center py-16 glass-card"><Target className="w-16 h-16 mx-auto mb-4 text-secondary/50" /><h3 className="text-xl font-display font-semibold mb-2">No active challenges</h3><p className="text-muted-foreground">Check back soon!</p></div>}
        </motion.div>
      )}

      {activeTab === "resources" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
          {resources.map((resource, index) => (<motion.a key={resource.title} href={resource.link} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="glass-card p-6 hover-lift flex items-center gap-4 group"><div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><resource.icon className="w-7 h-7 text-primary" /></div><div><h3 className="font-display font-semibold group-hover:text-primary transition-colors">{resource.title}</h3><p className="text-sm text-muted-foreground">{resource.description}</p></div></motion.a>))}
        </motion.div>
      )}
    </div>
  );
}