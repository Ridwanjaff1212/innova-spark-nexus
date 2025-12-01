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
  return <div className="min-h-screen flex flex-col">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-8 px-6 border-b border-border">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div animate={{
          rotate: 360,
          scale: [1, 1.1, 1]
        }} transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }} className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
          <motion.div animate={{
          rotate: -360,
          scale: [1, 1.2, 1]
        }} transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }} className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-3xl" />
          {/* Floating particles */}
          {[...Array(8)].map((_, i) => <motion.div key={i} className="absolute w-2 h-2 bg-primary/30 rounded-full" style={{
          left: `${10 + i * 12}%`,
          top: `${20 + i % 3 * 25}%`
        }} animate={{
          y: [-20, 20, -20],
          opacity: [0.3, 0.7, 0.3]
        }} transition={{
          duration: 3 + i * 0.5,
          repeat: Infinity,
          delay: i * 0.3
        }} />)}
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Avatar3D isSpeaking={isSpeaking} isThinking={isLoading} />

            <div>
              <motion.h1 initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} className="text-4xl font-display font-bold gradient-text">
                TechnoBot AI
              </motion.h1>
              <motion.p initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.1
            }} className="text-muted-foreground flex items-center gap-2 mt-1">
                <Brain className="w-4 h-4 text-primary" />
                Powered by TechnoVista AI • Voice & Image Enabled
              </motion.p>
              
              <motion.div initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} transition={{
              delay: 0.2
            }} className="flex flex-wrap gap-2 mt-3">
                {[{
                icon: Code,
                label: "Code Analysis"
              }, {
                icon: FileText,
                label: "File Upload"
              }, {
                icon: Video,
                label: "Video Upload"
              }, {
                icon: Wand2,
                label: "Image Gen"
              }, {
                icon: Volume2,
                label: "Read Aloud"
              }, {
                icon: Cpu,
                label: "Voice Input"
              }].map((feature, i) => <motion.span key={feature.label} initial={{
                opacity: 0,
                scale: 0.8
              }} animate={{
                opacity: 1,
                scale: 1
              }} transition={{
                delay: 0.3 + i * 0.1
              }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium">
                    <feature.icon className="w-3 h-3 text-primary" />
                    {feature.label}
                  </motion.span>)}
              </motion.div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={clearChat} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => <motion.div key={i} initial={{
          opacity: 0,
          y: 20,
          scale: 0.95
        }} animate={{
          opacity: 1,
          y: 0,
          scale: 1
        }} exit={{
          opacity: 0,
          scale: 0.95
        }} transition={{
          type: "spring",
          damping: 25,
          stiffness: 300
        }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-3xl flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${msg.role === "user" ? "bg-secondary/20 border border-secondary/30" : "bg-gradient-to-br from-primary to-secondary"}`}>
                  {msg.role === "user" ? <MessageSquare className="w-5 h-5 text-secondary" /> : <Sparkles className="w-5 h-5 text-white" />}
                </div>

                <div className={`relative group ${msg.role === "user" ? "bg-secondary/10 border border-secondary/20" : "bg-card border border-border"} rounded-2xl p-4 ${msg.role === "user" ? "rounded-tr-md" : "rounded-tl-md"}`}>
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{
                __html: formatMessage(msg.content)
              }} />
                  
                  {msg.imageUrl && <motion.img initial={{
                opacity: 0,
                scale: 0.9
              }} animate={{
                opacity: 1,
                scale: 1
              }} src={msg.imageUrl} alt="AI Generated" className="mt-3 rounded-lg max-w-full border border-border" />}

                  {/* Video attachments */}
                  {msg.attachments?.filter(a => a.isVideo).map((video, vi) => (
                    <motion.video
                      key={vi}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      controls
                      className="mt-3 rounded-lg max-w-full border border-border"
                      src={video.content}
                    />
                  ))}
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {msg.role === "assistant" && <TextToSpeech text={msg.content} />}
                    <button onClick={() => copyToClipboard(msg.content, i)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80">
                      {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>)}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role === "user" && <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <motion.div animate={{
              rotate: 360
            }} transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}>
                  <Brain className="w-5 h-5 text-white" />
                </motion.div>
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-md p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">TechnoBot is thinking...</span>
                  <motion.div className="flex gap-1">
                    {[0, 1, 2].map(i => <motion.span key={i} className="w-1.5 h-1.5 bg-primary rounded-full" animate={{
                  y: [0, -5, 0]
                }} transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15
                }} />)}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>}

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

      {/* Input Area */}
      <div className="border-t border-border bg-card/80 backdrop-blur-xl p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.md,.txt,.png,.jpg,.jpeg,.gif,.svg,.mp4,.webm,.mov,.avi" />
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0" title="Upload files">
              <Upload className="w-5 h-5" />
            </Button>

            <ImageGenerator onImageGenerated={handleImageGenerated} />
            <VoiceInput onTranscript={handleVoiceTranscript} disabled={isLoading} />

            <div className="flex-1 relative">
              <Textarea placeholder="Ask me anything about tech, code, or your projects..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }} className="min-h-[56px] max-h-32 resize-none pr-12" disabled={isLoading} />
              <Button variant="gradient" size="icon" onClick={sendMessage} disabled={isLoading || !input.trim() && attachments.length === 0} className="absolute right-2 bottom-2">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3 text-center flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" />
            TechnoVista AI • Voice & Image Generation • File Analysis • Press Enter to send
          </p>
        </div>
      </div>
    </div>;
}