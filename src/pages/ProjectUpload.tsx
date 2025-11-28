import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROJECT_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";
import { ArrowLeft, Upload, Github, Link as LinkIcon, FileText, Image, Save, Send, Loader2 } from "lucide-react";

export default function ProjectUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", category: PROJECT_CATEGORIES[0], github_url: "", demo_url: "" });
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [files, setFiles] = useState<string[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "thumbnail" | "file") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingFile(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("project-files").upload(fileName, file);
    if (error) { toast.error("Failed to upload file"); setUploadingFile(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("project-files").getPublicUrl(fileName);
    if (type === "thumbnail") setThumbnailUrl(publicUrl);
    else setFiles([...files, publicUrl]);
    setUploadingFile(false);
    toast.success("File uploaded!");
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!user) return;
    if (!formData.title) { toast.error("Please enter a project title"); return; }
    setLoading(true);
    const { error } = await supabase.from("projects").insert({
      user_id: user.id, title: formData.title, description: formData.description, category: formData.category,
      github_url: formData.github_url || null, demo_url: formData.demo_url || null, thumbnail_url: thumbnailUrl || null,
      files: files.length > 0 ? files : null, status: asDraft ? "draft" : "pending",
    });
    if (error) { toast.error("Failed to submit project"); setLoading(false); return; }
    setLoading(false);
    toast.success(asDraft ? "Draft saved!" : "Project submitted for review! 🎉");
    navigate("/projects");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
        <div><h1 className="text-3xl font-display font-bold"><span className="gradient-text">Upload</span> Project</h1><p className="text-muted-foreground mt-1">Share your innovation with the community</p></div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 space-y-6">
        <div><label className="text-sm font-medium mb-2 block">Project Title *</label><Input placeholder="Enter a catchy title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
        <div><label className="text-sm font-medium mb-2 block">Description</label><textarea placeholder="Describe your project..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={5} className="w-full rounded-xl border border-input bg-card/60 px-4 py-3 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-none" /></div>
        <div><label className="text-sm font-medium mb-2 block">Category</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-input bg-card/60 text-foreground">{PROJECT_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
        <div><label className="text-sm font-medium mb-2 block">Project Thumbnail</label><div className="flex items-center gap-4">{thumbnailUrl ? (<div className="relative w-32 h-20 rounded-lg overflow-hidden"><img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" /><button onClick={() => setThumbnailUrl("")} className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-xs">×</button></div>) : (<label className="flex-1 h-20 border-2 border-dashed border-input rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"><Image className="w-5 h-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{uploadingFile ? "Uploading..." : "Upload thumbnail"}</span><input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "thumbnail")} className="hidden" disabled={uploadingFile} /></label>)}</div></div>
        <div><label className="text-sm font-medium mb-2 block flex items-center gap-2"><Github className="w-4 h-4" />GitHub Repository URL</label><Input placeholder="https://github.com/username/repo" value={formData.github_url} onChange={(e) => setFormData({ ...formData, github_url: e.target.value })} /></div>
        <div><label className="text-sm font-medium mb-2 block flex items-center gap-2"><LinkIcon className="w-4 h-4" />Live Demo URL</label><Input placeholder="https://your-demo-site.com" value={formData.demo_url} onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })} /></div>
        <div><label className="text-sm font-medium mb-2 block flex items-center gap-2"><FileText className="w-4 h-4" />Additional Files</label><div className="space-y-2">{files.map((file, index) => (<div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"><FileText className="w-4 h-4 text-primary" /><span className="text-sm truncate flex-1">{file.split("/").pop()}</span><button onClick={() => setFiles(files.filter((_, i) => i !== index))} className="text-destructive hover:bg-destructive/10 p-1 rounded">×</button></div>))}<label className="flex items-center gap-2 p-4 border-2 border-dashed border-input rounded-xl cursor-pointer hover:border-primary/50 transition-colors"><Upload className="w-5 h-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{uploadingFile ? "Uploading..." : "Add files"}</span><input type="file" onChange={(e) => handleFileUpload(e, "file")} className="hidden" disabled={uploadingFile} /></label></div></div>
        <div className="flex gap-4 pt-4"><Button variant="outline" size="lg" className="flex-1" onClick={() => handleSubmit(true)} disabled={loading}><Save className="mr-2 w-4 h-4" />Save Draft</Button><Button variant="gradient" size="lg" className="flex-1" onClick={() => handleSubmit(false)} disabled={loading}>{loading ? (<Loader2 className="mr-2 w-4 h-4 animate-spin" />) : (<Send className="mr-2 w-4 h-4" />)}Submit for Review</Button></div>
      </motion.div>
    </div>
  );
}