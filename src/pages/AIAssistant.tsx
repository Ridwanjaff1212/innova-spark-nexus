import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Loader2, Upload, Code, FileText, Brain, Cpu, MessageSquare, Trash2, Copy, Check, FileCode, Image as ImageIcon, File, Wand2, Video, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Avatar3D from "@/components/ai/Avatar3D";
import VoiceInput from "@/components/ai/VoiceInput";
import ImageGenerator from "@/components/ai/ImageGenerator";
import TextToSpeech from "@/components/ai/TextToSpeech";
type Message = {
  role: "user" | "assistant";
  content: string;
  attachments?: {
    name: string;
    type: string;
    content: string;
    isVideo?: boolean;
  }[];
  imageUrl?: string;
  videoUrl?: string;
};
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
export default function AIAssistant() {
  const {
    toast
  } = useToast();
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! 👋 I'm **TechnoBot**, your advanced AI assistant powered by cutting-edge technology. I can help you with:\n\n🚀 **Tech Projects** - Get guidance on your innovations\n💻 **Code Review** - Upload code for analysis\n🎨 **Image Generation** - Create AI art with Gemini\n🎤 **Voice Input** - Talk to me directly\n🎬 **Video Upload** - Share videos for discussion\n🔊 **Read Aloud** - I can speak my responses\n💡 **Brainstorming** - Generate creative ideas\n\nHow can I assist you today?"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [attachments, setAttachments] = useState<{
    name: string;
    type: string;
    content: string;
  }[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: file.type.startsWith("video/") ? "Max video size is 50MB" : "Max file size is 5MB",
          variant: "destructive"
        });
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const isVideo = file.type.startsWith("video/");
        setAttachments(prev => [...prev, {
          name: file.name,
          type: file.type || "text/plain",
          content,
          isVideo
        }]);
        if (isVideo) {
          toast({
            title: "Video attached! 🎬",
            description: `${file.name} ready to share`
          });
        }
      };
      if (file.type.startsWith("text/") || file.name.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|html|css|json|md)$/)) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  const handleVoiceTranscript = (text: string) => {
    setInput(prev => prev + (prev ? " " : "") + text);
    toast({
      title: "Voice captured! 🎤",
      description: text.slice(0, 50) + (text.length > 50 ? "..." : "")
    });
  };
  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    setMessages(prev => [...prev, {
      role: "user",
      content: `🎨 Generate image: ${prompt}`
    }, {
      role: "assistant",
      content: `Here's your AI-generated image based on: "${prompt}"`,
      imageUrl
    }]);
  };
  const sendMessage = async () => {
    if (!input.trim() && attachments.length === 0 || isLoading) return;
    let messageContent = input;
    if (attachments.length > 0) {
      messageContent += "\n\n📎 Attachments:\n";
      attachments.forEach(att => {
        if (att.content.startsWith("data:")) {
          messageContent += `- [${att.name}] (Binary file)\n`;
        } else {
          messageContent += `- [${att.name}]:\n\`\`\`\n${att.content.slice(0, 3000)}\n\`\`\`\n`;
        }
      });
    }
    const userMsg: Message = {
      role: "user",
      content: messageContent,
      attachments
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);
    let assistantContent = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: [...messages, {
            role: "user",
            content: messageContent
          }]
        })
      });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }
      if (!resp.body) throw new Error("No response body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      setIsSpeaking(true);
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, {
          stream: true
        });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > 1) {
                  return prev.map((m, i) => i === prev.length - 1 ? {
                    ...m,
                    content: assistantContent
                  } : m);
                }
                return [...prev, {
                  role: "assistant",
                  content: assistantContent
                }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Something went wrong";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Oops! ${errorMessage}. Please try again 😅`
      }]);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
    setIsLoading(false);
    setIsSpeaking(false);
  };
  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Chat cleared! 🧹 How can I help you today?"
    }]);
  };
  const getFileIcon = (name: string) => {
    if (name.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|html|css|json)$/)) return <FileCode className="w-4 h-4" />;
    if (name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return <ImageIcon className="w-4 h-4" />;
    if (name.match(/\.(mp4|webm|mov|avi|mkv)$/)) return <Video className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };
  const formatMessage = (content: string) => {
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>').replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-lg my-2 overflow-x-auto text-sm font-mono"><code>$1</code></pre>');
  };
  return <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Animated Gradient Mesh Background */}
      <div className="fixed inset-0 -z-10">
        <motion.div 
          animate={{ 
            background: [
              "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(var(--secondary) / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 20%, hsl(var(--secondary) / 0.15) 0%, transparent 50%)",
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0"
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Hero Header with Holographic Effect */}
      <div className="relative backdrop-blur-xl bg-card/40 border-b border-border/50 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        
        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 rounded-full"
              style={{
                left: `${15 + i * 20}%`,
                top: `${-10 + (i % 2) * 60}%`,
                background: `radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)`
              }}
              animate={{
                y: [0, -30, 0],
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}
        </div>

        <div className="relative container mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-10">
              {/* Enhanced Avatar with Glow Ring */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-6 rounded-full bg-gradient-to-r from-primary via-secondary to-accent opacity-20 blur-2xl"
                />
                <Avatar3D isSpeaking={isSpeaking} isThinking={isLoading} />
              </div>

              <div className="space-y-4">
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-display font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
                  >
                    TechnoBot AI
                  </motion.h1>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 mt-2"
                  >
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-green-500"
                      />
                      <span className="text-xs font-medium text-muted-foreground">Online</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Powered by TechnoVista AI</span>
                  </motion.div>
                </div>
                
                {/* Feature Pills with Glass Effect */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-wrap gap-2"
                >
                  {[
                    { icon: Code, label: "Code Analysis", color: "from-blue-500/20 to-cyan-500/20" },
                    { icon: Wand2, label: "Image Gen", color: "from-purple-500/20 to-pink-500/20" },
                    { icon: Volume2, label: "Read Aloud", color: "from-green-500/20 to-emerald-500/20" },
                    { icon: Video, label: "Video", color: "from-orange-500/20 to-red-500/20" },
                  ].map((feature, i) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="relative group"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <div className="relative flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm bg-card/60 border border-border/50 hover:border-primary/50 transition-all">
                        <feature.icon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium">{feature.label}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearChat} 
              className="gap-2 backdrop-blur-sm bg-card/60 hover:bg-card/80 border-border/50"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Area with Parallax Effect */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 container mx-auto max-w-5xl">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-3xl flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar with Animated Border */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="relative flex-shrink-0"
                >
                  {msg.role === "assistant" && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent opacity-20 blur-md"
                    />
                  )}
                  <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ${
                    msg.role === "user" 
                      ? "bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/30" 
                      : "bg-gradient-to-br from-primary via-secondary to-accent shadow-lg shadow-primary/20"
                  }`}>
                    {msg.role === "user" ? (
                      <MessageSquare className="w-5 h-5 text-secondary" />
                    ) : (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Message Bubble with Glass Effect */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="relative group"
                >
                  {/* Glow Effect */}
                  {msg.role === "assistant" && (
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  )}
                  
                  <div className={`relative ${
                    msg.role === "user" 
                      ? "bg-secondary/5 backdrop-blur-sm border border-secondary/20" 
                      : "bg-card/80 backdrop-blur-md border border-border/50 shadow-xl"
                  } rounded-3xl p-5 ${msg.role === "user" ? "rounded-tr-lg" : "rounded-tl-lg"}`}>
                    {/* Inner Shine Effect */}
                    {msg.role === "assistant" && (
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    
                    <div className="relative text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert" 
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} 
                    />
                    
                    {msg.imageUrl && (
                      <motion.img 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={msg.imageUrl} 
                        alt="AI Generated" 
                        className="mt-4 rounded-2xl max-w-full border border-border/50 shadow-lg" 
                      />
                    )}

                    {msg.attachments?.filter(a => a.isVideo).map((video, vi) => (
                      <motion.video
                        key={vi}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        controls
                        className="mt-4 rounded-2xl max-w-full border border-border/50 shadow-lg"
                        src={video.content}
                      />
                    ))}
                    
                    {/* Floating Action Buttons */}
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5">
                      {msg.role === "assistant" && <TextToSpeech text={msg.content} />}
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => copyToClipboard(msg.content, i)} 
                        className="p-2 rounded-xl backdrop-blur-xl bg-card/90 border border-border/50 hover:border-primary/50 shadow-lg transition-all"
                      >
                        {copiedIndex === i ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex gap-4">
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-5 h-5 text-white" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl bg-primary/20 blur-md"
                />
              </div>
              
              <div className="relative bg-card/80 backdrop-blur-md border border-border/50 rounded-3xl rounded-tl-lg p-5 shadow-xl">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-secondary/5" />
                <div className="relative flex items-center gap-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">TechnoBot is thinking</span>
                  <motion.div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.span 
                        key={i} 
                        className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full" 
                        animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: "auto",
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} className="border-t border-border bg-muted/30 px-6 py-3">
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, i) => <motion.div key={i} initial={{
            scale: 0
          }} animate={{
            scale: 1
          }} exit={{
            scale: 0
          }} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-sm">
                  {getFileIcon(att.name)}
                  <span className="max-w-32 truncate">{att.name}</span>
                  <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>)}
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* Premium Input Area with Glass Morphism */}
      <div className="relative border-t border-border/50 backdrop-blur-2xl bg-card/60">
        {/* Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="container mx-auto max-w-5xl p-6">
          <div className="relative group">
            {/* Floating Glow Effect */}
            <motion.div
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.02, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -inset-2 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"
            />
            
            <div className="relative backdrop-blur-xl bg-card/80 rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
              <Textarea 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }} 
                placeholder="Ask TechnoBot anything... (Shift+Enter for new line)" 
                className="min-h-[120px] pr-40 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base" 
                disabled={isLoading} 
              />
              
              {/* Action Buttons with Glass Effect */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  multiple 
                  accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.md,.txt,.png,.jpg,.jpeg,.gif,.svg,.webp,.mp4,.webm,.mov,.avi,.mkv" 
                  className="hidden" 
                />
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="h-11 w-11 rounded-2xl backdrop-blur-sm bg-card/50 hover:bg-primary/10 border border-border/30 shadow-sm" 
                    disabled={isLoading}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <ImageGenerator onImageGenerated={handleImageGenerated} disabled={isLoading} />
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <VoiceInput onTranscript={handleVoiceTranscript} disabled={isLoading} />
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  {!isLoading && (input.trim() || attachments.length > 0) && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur-md opacity-50"
                    />
                  )}
                  <Button 
                    onClick={sendMessage} 
                    disabled={isLoading || (!input.trim() && attachments.length === 0)} 
                    size="icon" 
                    className="relative h-11 w-11 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/30"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4 text-center flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" />
            TechnoVista AI • Voice & Image Generation • File Analysis
          </p>
        </div>
      </div>
    </div>;
}