import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SyntaxHighlighter from "@/components/code/SyntaxHighlighter";
import { 
  Send, Code, Bug, FileCheck, BookOpen, Wand2, Loader2, Copy, Check, 
  Trash2, Terminal, Sparkles, Braces, FileCode, Play, Lightbulb,
  ChevronDown, Upload, Zap, Bot, Eye, EyeOff, Maximize2, Minimize2,
  RotateCcw, Download, Share2, Coffee, Rocket, Star, Command
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type CodeMode = "code" | "debug" | "review" | "explain" | "generate";

const modes: { id: CodeMode; label: string; icon: React.ElementType; description: string; color: string; gradient: string }[] = [
  { id: "code", label: "Code Help", icon: Code, description: "General coding assistance", color: "from-blue-500 to-cyan-500", gradient: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20" },
  { id: "debug", label: "Debug", icon: Bug, description: "Find and fix bugs", color: "from-red-500 to-orange-500", gradient: "bg-gradient-to-r from-red-500/20 to-orange-500/20" },
  { id: "review", label: "Review", icon: FileCheck, description: "Code review & best practices", color: "from-purple-500 to-pink-500", gradient: "bg-gradient-to-r from-purple-500/20 to-pink-500/20" },
  { id: "explain", label: "Explain", icon: BookOpen, description: "Understand code concepts", color: "from-amber-500 to-yellow-500", gradient: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20" },
  { id: "generate", label: "Generate", icon: Wand2, description: "Generate new code", color: "from-emerald-500 to-teal-500", gradient: "bg-gradient-to-r from-emerald-500/20 to-teal-500/20" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-code`;

export default function CodeAssistant() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<CodeMode>("code");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewCode, setPreviewCode] = useState<string>(`// 🚀 Live Code Preview
// Write or paste code here to see it highlighted!

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Example usage
console.log(fibonacci(10)); // 55`);
  const [previewLanguage, setPreviewLanguage] = useState("javascript");
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [previewOutput, setPreviewOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Extract code from AI responses
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") {
        const codeMatch = lastMsg.content.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (codeMatch) {
          const [, lang, code] = codeMatch;
          setPreviewCode(code.trim());
          setPreviewLanguage(lang || "javascript");
        }
      }
    }
  }, [messages]);

  const runCode = useCallback(() => {
    if (previewLanguage !== "javascript" && previewLanguage !== "js") {
      setPreviewOutput(`⚠️ Live execution only supports JavaScript.\nShowing: ${previewLanguage} code preview.`);
      return;
    }

    setIsRunning(true);
    setPreviewOutput("");

    try {
      let output = "";
      const customConsole = {
        log: (...args: unknown[]) => { output += args.map(a => JSON.stringify(a, null, 2)).join(" ") + "\n"; },
        error: (...args: unknown[]) => { output += "❌ " + args.join(" ") + "\n"; },
        warn: (...args: unknown[]) => { output += "⚠️ " + args.join(" ") + "\n"; },
        info: (...args: unknown[]) => { output += "ℹ️ " + args.join(" ") + "\n"; },
      };

      const wrappedCode = `
        (function(console) {
          ${previewCode}
        })(customConsole);
      `;

      // eslint-disable-next-line no-new-func
      new Function("customConsole", wrappedCode)(customConsole);

      setPreviewOutput(output || "✅ Code executed successfully (no output)");
    } catch (error) {
      setPreviewOutput(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  }, [previewCode, previewLanguage]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyCodeBlock = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied! 📋", description: "Ready to paste" });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const extension = file.name.split(".").pop() || "";
      const languageMap: Record<string, string> = {
        js: "javascript", ts: "typescript", py: "python", java: "java",
        cpp: "cpp", c: "c", html: "html", css: "css", sql: "sql", json: "json", md: "markdown",
      };
      const language = languageMap[extension] || extension;
      setInput(`\`\`\`${language}\n${content}\n\`\`\`\n\nPlease analyze this code.`);
      setPreviewCode(content);
      setPreviewLanguage(language);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: input }],
          mode,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
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
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
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
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${errorMessage}. Please try again 😅` }]);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }

    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    toast({ title: "Chat cleared 🧹", description: "Ready for new questions" });
  };

  const formatMessage = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("```")) {
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (match) {
          const [, lang, code] = match;
          return (
            <div key={idx} className="relative group my-4">
              <div className="flex items-center justify-between px-4 py-2 bg-black/40 border border-white/10 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs font-mono text-white/60 ml-2">{lang || "code"}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewCode(code.trim());
                      setPreviewLanguage(lang || "javascript");
                      setShowPreview(true);
                    }}
                    className="h-6 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCodeBlock(code.trim())}
                    className="h-6 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
              <div className="rounded-b-xl overflow-hidden border border-t-0 border-white/10">
                <SyntaxHighlighter code={code.trim()} language={lang || "javascript"} showLineNumbers />
              </div>
            </div>
          );
        }
      }
      return (
        <span
          key={idx}
          dangerouslySetInnerHTML={{
            __html: part
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-primary">$1</strong>')
              .replace(/`([^`]+)`/g, '<code class="bg-primary/20 px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
              .replace(/\n/g, '<br />')
          }}
        />
      );
    });
  };

  const currentMode = modes.find(m => m.id === mode)!;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
        
        {/* Floating Code Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 100 }}
            animate={{ 
              opacity: [0, 0.3, 0], 
              y: [-100, -500],
              x: Math.sin(i) * 50
            }}
            transition={{ 
              duration: 10 + Math.random() * 10, 
              repeat: Infinity, 
              delay: Math.random() * 10 
            }}
            className="absolute text-primary/20 font-mono text-xs"
            style={{ left: `${Math.random() * 100}%`, bottom: 0 }}
          >
            {["{ }", "< />", "( )", "[ ]", "=>", "===", "++", "&&"][i % 8]}
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-2xl bg-card/60 border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="relative"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentMode.color} flex items-center justify-center shadow-xl shadow-primary/20`}>
                  <Terminal className="w-7 h-7 text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center"
                >
                  <Sparkles className="w-2 h-2 text-white" />
                </motion.div>
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-2xl lg:text-3xl font-display font-bold bg-gradient-to-r ${currentMode.color} bg-clip-text text-transparent`}>
                    CodeMaster AI
                  </h1>
                  <span className="text-xl">💻</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Professional Coding Assistant</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gradient-to-r ${currentMode.color} text-white`}>
                    {currentMode.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              {/* Mode Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-card/80 border-border/50 hover:border-primary/50 transition-all">
                    <currentMode.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{currentMode.label}</span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-2">
                  {modes.map((m) => (
                    <DropdownMenuItem
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${mode === m.id ? m.gradient + " border border-primary/30" : "hover:bg-muted"}`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mr-3 shadow-lg`}>
                        <m.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{m.label}</div>
                        <div className="text-xs text-muted-foreground">{m.description}</div>
                      </div>
                      {mode === m.id && <Check className="w-4 h-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowPreview(!showPreview)}
                className={`bg-card/80 border-border/50 ${showPreview ? "text-primary border-primary/50" : ""}`}
              >
                {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>

              <Button variant="outline" size="icon" onClick={clearChat} className="bg-card/80 border-border/50 hover:border-red-500/50 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Actions Pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { label: "🐍 Python", prompt: "Help me with Python code", icon: "🐍" },
              { label: "🔧 Fix Bug", prompt: "Please debug and fix this code", icon: "🔧" },
              { label: "💡 Explain", prompt: "Explain this code step by step", icon: "💡" },
              { label: "✍️ Generate", prompt: "Write a function that", icon: "✍️" },
              { label: "✅ Review", prompt: "Review this code for best practices", icon: "✅" },
              { label: "⚡ Optimize", prompt: "Optimize this code for performance", icon: "⚡" },
              { label: "🎨 Refactor", prompt: "Refactor this code for better readability", icon: "🎨" },
              { label: "📝 Document", prompt: "Add documentation and comments to this code", icon: "📝" },
            ].map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setInput(action.prompt)}
                className="shrink-0 px-4 py-2 rounded-full bg-card/60 border border-border/50 text-sm font-medium hover:border-primary/50 hover:bg-primary/10 transition-all flex items-center gap-1.5"
              >
                {action.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex ${showPreview ? 'lg:flex-row' : ''} flex-col gap-4 p-4 lg:p-6 container mx-auto max-w-[1800px]`}>
        {/* Chat Panel */}
        <div className={`flex-1 flex flex-col min-h-0 ${showPreview ? 'lg:max-w-[55%]' : ''}`}>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="relative inline-block mb-6"
                >
                  <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${currentMode.color} flex items-center justify-center shadow-2xl shadow-primary/30`}>
                    <Bot className="w-12 h-12 text-white" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 border-2 border-dashed border-primary/20 rounded-[2rem]"
                  />
                </motion.div>

                <h2 className="text-3xl font-display font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                  Welcome to CodeMaster AI
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Your professional AI coding companion. Ask questions, debug code, get reviews, and more!
                </p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
                  {[
                    { icon: Code, title: "Multi-Language", desc: "Python, JS, Java & more", color: "from-blue-500 to-cyan-500" },
                    { icon: Bug, title: "Smart Debug", desc: "Find & fix errors fast", color: "from-red-500 to-orange-500" },
                    { icon: Eye, title: "Live Preview", desc: "See code in real-time", color: "from-purple-500 to-pink-500" },
                    { icon: Lightbulb, title: "Learn & Grow", desc: "Understand patterns", color: "from-amber-500 to-yellow-500" },
                  ].map((feature, i) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="p-4 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all cursor-default"
                    >
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Command className="w-4 h-4" />
                  <span>Pro tip: Press</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">Enter</kbd>
                  <span>to send, or paste code directly!</span>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", damping: 20 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[90%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-primary/80 to-primary"
                          : `bg-gradient-to-br ${currentMode.color}`
                      }`}
                    >
                      {msg.role === "user" ? (
                        <FileCode className="w-5 h-5 text-white" />
                      ) : (
                        <Braces className="w-5 h-5 text-white" />
                      )}
                    </motion.div>

                    <div className={`relative group rounded-2xl px-5 py-4 shadow-lg ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30"
                        : "bg-card/90 border border-border/50 backdrop-blur-sm"
                    }`}>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {formatMessage(msg.content)}
                      </div>

                      {msg.role === "assistant" && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="absolute -top-2 -right-2 flex gap-1"
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => copyToClipboard(msg.content, i)}
                            className="h-7 w-7 p-0 rounded-lg shadow-lg"
                          >
                            {copiedIndex === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex gap-3"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentMode.color} flex items-center justify-center shadow-lg`}>
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
                <div className="bg-card/90 border border-border/50 rounded-2xl px-5 py-4 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          className="w-2 h-2 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                    <span className="text-muted-foreground text-sm">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 shadow-xl">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Paste your code or describe what you need... ✨"
                  className="min-h-[80px] max-h-[200px] resize-none pr-12 bg-background/50 border-border/30 focus:border-primary/50 font-mono text-sm rounded-xl"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".js,.ts,.py,.java,.cpp,.c,.html,.css,.sql,.json,.md,.txt"
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-primary"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className={`h-full px-6 rounded-xl bg-gradient-to-r ${currentMode.color} hover:opacity-90 shadow-lg shadow-primary/20`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`${isPreviewExpanded ? 'fixed inset-4 z-50' : 'lg:w-[45%]'} flex flex-col bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden`}
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-white/80 font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Live Preview
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs font-mono">
                    {previewLanguage}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-white/60 hover:text-white hover:bg-white/10">
                        <Code className="w-4 h-4 mr-1" />
                        {previewLanguage}
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {["javascript", "python", "java", "cpp", "html", "css", "sql", "json"].map(lang => (
                        <DropdownMenuItem key={lang} onClick={() => setPreviewLanguage(lang)}>
                          {lang}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewCode("")}
                    className="h-7 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCodeBlock(previewCode)}
                    className="h-7 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                    className="h-7 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    {isPreviewExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Preview Tabs */}
              <Tabs defaultValue="editor" className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none bg-black/20 border-b border-white/10 p-0 h-auto">
                  <TabsTrigger value="editor" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-4">
                    <FileCode className="w-4 h-4 mr-2" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="output" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 px-4">
                    <Terminal className="w-4 h-4 mr-2" />
                    Output
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="flex-1 m-0 flex flex-col">
                  <div className="flex-1 relative">
                    <textarea
                      ref={previewTextareaRef}
                      value={previewCode}
                      onChange={(e) => setPreviewCode(e.target.value)}
                      className="absolute inset-0 w-full h-full bg-[#0d1117] text-gray-100 font-mono text-sm p-4 resize-none focus:outline-none"
                      style={{ caretColor: "white" }}
                      spellCheck={false}
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-black/30 border-t border-white/10">
                    <div className="text-xs text-white/40 font-mono">
                      {previewCode.split("\n").length} lines • {previewCode.length} chars
                    </div>
                    <Button
                      onClick={runCode}
                      disabled={isRunning}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white shadow-lg"
                    >
                      {isRunning ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Run Code
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="output" className="flex-1 m-0 bg-[#0d1117] p-4 overflow-auto">
                  <pre className="font-mono text-sm text-gray-100 whitespace-pre-wrap">
                    {previewOutput || (
                      <span className="text-gray-500 flex items-center gap-2">
                        <Coffee className="w-4 h-4" />
                        Click "Run Code" to see output here...
                      </span>
                    )}
                  </pre>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
