import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROJECT_CATEGORIES } from "@/lib/constants";
import { Plus, Search, Github, ExternalLink, Clock, CheckCircle, Star, Eye } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  github_url: string | null;
  demo_url: string | null;
  thumbnail_url: string | null;
  status: string | null;
  is_featured: boolean | null;
  created_at: string;
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"my" | "all">("my");

  useEffect(() => {
    fetchProjects();
  }, [viewMode, user]);

  const fetchProjects = async () => {
    setLoading(true);
    let query = supabase.from("projects").select("*").order("created_at", { ascending: false });

    if (viewMode === "my" && user) {
      query = query.eq("user_id", user.id);
    } else {
      query = query.eq("status", "approved");
    }

    const { data } = await query;
    setProjects(data || []);
    setLoading(false);
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || project.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <span className="px-2 py-1 rounded-full bg-accent/20 text-accent text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case "pending":
        return <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold"><span className="gradient-text">Project</span> Showcase</h1>
          <p className="text-muted-foreground mt-1">Discover amazing student innovations</p>
        </div>
        <Link to="/projects/new"><Button variant="gradient" size="lg"><Plus className="mr-2 w-4 h-4" />Upload Project</Button></Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "my" ? "default" : "outline"} onClick={() => setViewMode("my")}>My Projects</Button>
          <Button variant={viewMode === "all" ? "default" : "outline"} onClick={() => setViewMode("all")}><Eye className="mr-2 w-4 h-4" />Gallery</Button>
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="h-12 px-4 rounded-xl border border-input bg-card/60 text-foreground">
          <option value="all">All Categories</option>
          {PROJECT_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
        </select>
      </motion.div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => (<div key={i} className="glass-card h-64 animate-pulse" />))}</div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.05 }} className="glass-card overflow-hidden hover-lift group">
              <div className="aspect-video bg-muted overflow-hidden relative">
                {project.thumbnail_url ? (<img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />) : (<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20"><span className="text-4xl">🚀</span></div>)}
                {project.is_featured && (<div className="absolute top-2 right-2"><Star className="w-6 h-6 text-accent fill-accent" /></div>)}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-display font-semibold text-lg line-clamp-1">{project.title}</h3>
                  {getStatusBadge(project.status)}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-full bg-muted">{project.category}</span>
                  <div className="flex gap-2">
                    {project.github_url && (<a href={project.github_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted transition-colors"><Github className="w-4 h-4" /></a>)}
                    {project.demo_url && (<a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted transition-colors"><ExternalLink className="w-4 h-4" /></a>)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 glass-card">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-display font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">{viewMode === "my" ? "You haven't uploaded any projects yet." : "No projects match your search."}</p>
          {viewMode === "my" && (<Link to="/projects/new"><Button variant="gradient"><Plus className="mr-2 w-4 h-4" />Upload Your First Project</Button></Link>)}
        </motion.div>
      )}
    </div>
  );
}