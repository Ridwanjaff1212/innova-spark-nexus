import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SyntaxHighlighter from "@/components/code/SyntaxHighlighter";
import { 
  Send, Code, Bug, FileCheck, BookOpen, Wand2, Loader2, Copy, Check, 
  Trash2, Terminal, Sparkles, Braces, FileCode, Play, Lightbulb,
  ChevronDown, Upload, Zap, History, Bot, Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type CodeMode = "code" | "debug" | "review" | "explain" | "generate";

const modes: { id: CodeMode; label: string; icon: React.ElementType; description: string; color: string }[] = [
  { id: "code", label: "Code Help", icon: Code, description: "General coding assistance", color: "from-blue-500 to-cyan-500" },
  { id: "debug", label: "Debug", icon: Bug, description: "Find and fix bugs", color: "from-red-500 to-orange-500" },
  { id: "review", label: "Review", icon: FileCheck, description: "Code review & best practices", color: "from-purple-500 to-pink-500" },
  { id: "explain", label: "Explain", icon: BookOpen, description: "Understand code concepts", color: "from-amber-500 to-yellow-500" },
  { id: "generate", label: "Generate", icon: Wand2, description: "Generate new code", color: "from-emerald-500 to-teal-500" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-code`;

export default function CodeAssistant() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<CodeMode>("code");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        js: "javascript",
        ts: "typescript",
        py: "python",
        java: "java",
        cpp: "cpp",
        c: "c",
        html: "html",
        css: "css",
        sql: "sql",
        json: "json",
        md: "markdown",
      };
      const language = languageMap[extension] || extension;
      setInput(`\`\`\`${language}\n${content}\n\`\`\`\n\nPlease analyze this code.`);
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
              <div className="flex items-center justify-between px-4 py-2 bg-muted/80 border border-border/50 rounded-t-lg">
                <span className="text-xs font-mono text-muted-foreground">{lang || "code"}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCodeBlock(code.trim())}
                  className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
              <SyntaxHighlighter code={code.trim()} language={lang || "javascript"} showLineNumbers />
            </div>
          );
        }
      }
      return (
        <span
          key={idx}
          dangerouslySetInnerHTML={{
            __html: part
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
              .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
              .replace(/\n/g, '<br />')
          }}
        />
      );
    });
  };

  const currentMode = modes.find(m => m.id === mode)!;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-card/80 border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentMode.color} flex items-center justify-center shadow-lg`}
              >
                <Terminal className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 className={`text-2xl font-display font-bold bg-gradient-to-r ${currentMode.color} bg-clip-text text-transparent`}>
                  CodeMaster AI
                </h1>
                <p className="text-sm text-muted-foreground">Professional Coding Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={`gap-2 bg-card/60 border-border/50`}>
                    <currentMode.icon className="w-4 h-4" />
                    {currentMode.label}
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {modes.map((m) => (
                    <DropdownMenuItem
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={mode === m.id ? "bg-primary/10" : ""}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center mr-3`}>
                        <m.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{m.label}</div>
                        <div className="text-xs text-muted-foreground">{m.description}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="icon" onClick={clearChat} className="bg-card/60 border-border/50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {[
              { label: "🐍 Python help", prompt: "Help me with Python code" },
              { label: "🔧 Fix my code", prompt: "Please debug and fix this code" },
              { label: "💡 Explain this", prompt: "Explain this code step by step" },
              { label: "📝 Write a function", prompt: "Write a function that" },
              { label: "✅ Best practices", prompt: "Review this code for best practices" },
              { label: "⚡ Optimize", prompt: "Optimize this code for performance" },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => setInput(action.prompt)}
                className="shrink-0 bg-card/40 border-border/30 hover:bg-card/60"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 container mx-auto max-w-4xl">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${currentMode.color} flex items-center justify-center shadow-xl`}>
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Welcome to CodeMaster AI</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Your professional coding assistant. Ask questions, debug code, get reviews, and more.
            </p>

            <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { icon: Code, title: "Code Snippets", desc: "Get help with any programming language" },
                { icon: Bug, title: "Debug Issues", desc: "Find and fix errors in your code" },
                { icon: Lightbulb, title: "Learn Concepts", desc: "Understand algorithms and patterns" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-4 rounded-2xl bg-card border border-border"
                >
                  <feature.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-3xl flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  msg.role === "user"
                    ? "bg-primary/20 border border-primary/30"
                    : `bg-gradient-to-br ${currentMode.color}`
                }`}>
                  {msg.role === "user" ? (
                    <FileCode className="w-5 h-5 text-primary" />
                  ) : (
                    <Braces className="w-5 h-5 text-white" />
                  )}
                </div>

                <div className={`relative group rounded-2xl px-5 py-4 ${
                  msg.role === "user"
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-card border border-border"
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {formatMessage(msg.content)}
                  </div>

                  {msg.role === "assistant" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(msg.content, i)}
                      className="absolute top-2 right-2 h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedIndex === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentMode.color} flex items-center justify-center`}>
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Analyzing</span>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ...
                </motion.span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border p-4">
        <div className="container mx-auto max-w-4xl">
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
                placeholder="Paste your code or describe what you need..."
                className="min-h-[60px] max-h-[200px] resize-none pr-24 bg-card border-border/50 focus:border-primary/50 font-mono text-sm"
              />
              <div className="absolute right-2 bottom-2 flex gap-2">
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
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  <Upload className="w-4 h-4" />
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className={`h-9 w-9 rounded-lg bg-gradient-to-r ${currentMode.color}`}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Shift+Enter for new line • Upload files or paste code • Supports Python, JavaScript, TypeScript, Java, C++, and more
          </p>
        </div>
      </div>
    </div>
  );
}
