import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Sparkles, ExternalLink, Copy, Eye, Palette, 
  Github, Globe, Mail, Linkedin, Twitter,
  FolderKanban, Trophy, Code, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  github_url: string;
  demo_url: string;
  thumbnail_url: string;
  status: string;
}

interface Portfolio {
  id: string;
  slug: string;
  title: string;
  bio: string | null;
  theme: string;
  social_links: Record<string, string> | null;
  is_public: boolean | null;
  views_count: number | null;
}

interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

const THEMES = [
  { value: 'modern', label: 'Modern Minimal', colors: 'from-zinc-900 to-zinc-800' },
  { value: 'gradient', label: 'Gradient Flow', colors: 'from-purple-900 to-blue-900' },
  { value: 'nature', label: 'Nature Green', colors: 'from-green-900 to-emerald-800' },
  { value: 'sunset', label: 'Sunset Warm', colors: 'from-orange-900 to-red-900' },
  { value: 'ocean', label: 'Ocean Blue', colors: 'from-blue-900 to-cyan-800' },
  { value: 'gold', label: 'Royal Gold', colors: 'from-yellow-900 to-amber-800' },
];

export default function Portfolio() {
  const { user, profile } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    bio: '',
    theme: 'modern',
    github: '',
    linkedin: '',
    twitter: '',
    website: '',
  });

  useEffect(() => {
    if (user) {
      fetchPortfolio();
      fetchProjects();
    }
  }, [user]);

  const fetchPortfolio = async () => {
    const { data } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    
    if (data) {
      const socialLinks = (data.social_links || {}) as SocialLinks;
      setPortfolio(data as Portfolio);
      setEditForm({
        title: data.title,
        bio: data.bio || '',
        theme: data.theme,
        github: socialLinks.github || '',
        linkedin: socialLinks.linkedin || '',
        twitter: socialLinks.twitter || '',
        website: socialLinks.website || '',
      });
    }
  };

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user?.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    
    setProjects(data || []);
  };

  const generatePortfolio = async () => {
    if (!user || !profile) return;
    
    setIsGenerating(true);
    
    // Generate unique slug
    const baseSlug = profile.full_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    
    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        slug,
        title: `${profile.full_name}'s Portfolio`,
        bio: profile.bio || `Hi! I'm ${profile.full_name}, a student developer passionate about technology.`,
        theme: 'modern',
        social_links: {},
      })
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to generate portfolio');
      setIsGenerating(false);
      return;
    }
    
    setPortfolio(data as Portfolio);
    setEditForm({
      title: data.title,
      bio: data.bio || '',
      theme: data.theme,
      github: '',
      linkedin: '',
      twitter: '',
      website: '',
    });
    
    confetti({ particleCount: 100, spread: 70 });
    toast.success('Portfolio generated! 🎉');
    setIsGenerating(false);
  };

  const savePortfolio = async () => {
    if (!portfolio) return;
    
    const { error } = await supabase
      .from('portfolios')
      .update({
        title: editForm.title,
        bio: editForm.bio,
        theme: editForm.theme,
        social_links: {
          github: editForm.github,
          linkedin: editForm.linkedin,
          twitter: editForm.twitter,
          website: editForm.website,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', portfolio.id);
    
    if (error) {
      toast.error('Failed to save portfolio');
      return;
    }
    
    toast.success('Portfolio saved!');
    setIsEditing(false);
    fetchPortfolio();
  };

  const copyLink = () => {
    if (!portfolio) return;
    const url = `${window.location.origin}/p/${portfolio.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Portfolio link copied!');
  };

  const themeConfig = THEMES.find(t => t.value === editForm.theme) || THEMES[0];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in Required</h2>
          <p className="text-muted-foreground">Please sign in to create your portfolio</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Portfolio Generator</h1>
            <p className="text-muted-foreground">Create a beautiful portfolio in one click</p>
          </div>
        </div>
        {portfolio && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={copyLink} className="gap-2">
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide Preview' : 'Preview'}
            </Button>
          </div>
        )}
      </motion.div>

      {/* No Portfolio - Generate */}
      {!portfolio && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="text-center py-16">
            <Sparkles className="w-20 h-20 mx-auto text-primary mb-6" />
            <h2 className="text-2xl font-display font-bold mb-2">Create Your Portfolio</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Generate a beautiful portfolio website showcasing your projects with just one click!
            </p>
            <Button 
              onClick={generatePortfolio} 
              disabled={isGenerating}
              size="lg"
              className="gap-2"
            >
              <Zap className="w-5 h-5" />
              {isGenerating ? 'Generating...' : 'Generate Portfolio'}
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Portfolio Editor */}
      {portfolio && !showPreview && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Edit Form */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Customize Portfolio
              </CardTitle>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={savePortfolio}>Save</Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit</Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Portfolio Title</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Your Portfolio Title"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Bio</label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Tell visitors about yourself..."
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Theme</label>
                <Select
                  value={editForm.theme}
                  onValueChange={(v) => setEditForm({ ...editForm, theme: v })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEMES.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        {theme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Social Links</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-muted-foreground" />
                    <Input
                      value={editForm.github}
                      onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                      disabled={!isEditing}
                      placeholder="GitHub URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-muted-foreground" />
                    <Input
                      value={editForm.linkedin}
                      onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                      disabled={!isEditing}
                      placeholder="LinkedIn URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-muted-foreground" />
                    <Input
                      value={editForm.twitter}
                      onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Twitter URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <Input
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Website URL"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats & Projects */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Portfolio Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <Badge variant="secondary">{portfolio.views_count}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Projects</span>
                  <Badge variant="secondary">{projects.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={portfolio.is_public ? 'default' : 'outline'}>
                    {portfolio.is_public ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FolderKanban className="w-4 h-4" />
                  Featured Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <div className="space-y-2">
                    {projects.slice(0, 5).map((project) => (
                      <div key={project.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                        <span className="truncate">{project.title}</span>
                        <Badge variant="outline" className="text-xs">{project.category}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No approved projects yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Portfolio Preview */}
      {portfolio && showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-2xl overflow-hidden bg-gradient-to-br ${themeConfig.colors} min-h-[600px] p-8`}
        >
          <div className="max-w-4xl mx-auto text-white">
            {/* Preview Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-full bg-white/20 mx-auto mb-6 flex items-center justify-center text-4xl font-bold"
              >
                {profile?.full_name?.charAt(0) || 'U'}
              </motion.div>
              <h1 className="text-4xl font-display font-bold mb-4">{editForm.title}</h1>
              <p className="text-white/80 max-w-xl mx-auto">{editForm.bio}</p>
              
              {/* Social Links */}
              <div className="flex items-center justify-center gap-4 mt-6">
                {editForm.github && (
                  <a href={editForm.github} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {editForm.linkedin && (
                  <a href={editForm.linkedin} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {editForm.twitter && (
                  <a href={editForm.twitter} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {editForm.website && (
                  <a href={editForm.website} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition"
                >
                  <h3 className="font-semibold mb-2">{project.title}</h3>
                  <p className="text-sm text-white/70 line-clamp-2 mb-3">{project.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                      {project.category}
                    </Badge>
                    {project.github_url && (
                      <ExternalLink className="w-4 h-4 text-white/60" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {projects.length === 0 && (
              <div className="text-center py-12 text-white/60">
                <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Projects will appear here once approved</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
