import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Sparkles, User, Shield, ArrowRight, Eye, EyeOff, Rocket } from "lucide-react";

type AuthMode = "welcome" | "login" | "signup" | "admin";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signIn, signInAsAdmin } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, grade, section);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome to TechnoVista! 🚀");
      navigate("/dashboard");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back! 🎉");
      navigate("/dashboard");
    }
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !adminPin) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await signInAsAdmin(email, password, adminPin);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Admin access granted! 🔐");
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl animate-spin-slow" />
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/40 rounded-full"
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            opacity: 0 
          }}
          animate={{ 
            y: [null, Math.random() * -200],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {mode === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
                <h1 className="text-5xl font-display font-bold gradient-text mb-2">TechnoVista</h1>
                <p className="text-xl text-muted-foreground mb-2">Dream | Build | Innovate</p>
                <p className="text-sm text-muted-foreground/70 mb-8">ICSK Khaitan Techno Club 2025</p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <Button
                  variant="gradient"
                  size="xl"
                  className="w-full"
                  onClick={() => setMode("login")}
                >
                  <User className="mr-2" />
                  Member Login
                  <ArrowRight className="ml-2" />
                </Button>

                <Button
                  variant="glass"
                  size="lg"
                  className="w-full"
                  onClick={() => setMode("admin")}
                >
                  <Shield className="mr-2" />
                  Admin Portal
                </Button>

                <p className="text-sm text-muted-foreground">
                  New member?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-primary hover:underline font-medium"
                  >
                    Join TechnoVista
                  </button>
                </p>
              </motion.div>
            </motion.div>
          )}

          {mode === "signup" && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8"
            >
              <div className="text-center mb-6">
                <Rocket className="w-12 h-12 mx-auto text-primary mb-2" />
                <h2 className="text-2xl font-display font-bold">Join TechnoVista</h2>
                <p className="text-muted-foreground text-sm">Start your innovation journey</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Full Name *</label>
                  <Input
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Email *</label>
                  <Input
                    type="email"
                    placeholder="your.email@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Grade</label>
                    <Input
                      placeholder="e.g. 10"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Section</label>
                    <Input
                      placeholder="e.g. A"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Password *</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Join TechnoVista"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Already a member?{" "}
                <button onClick={() => setMode("login")} className="text-primary hover:underline">
                  Sign in
                </button>
              </p>

              <button
                onClick={() => setMode("welcome")}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground w-full text-center"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8"
            >
              <div className="text-center mb-6">
                <User className="w-12 h-12 mx-auto text-primary mb-2" />
                <h2 className="text-2xl font-display font-bold">Welcome Back</h2>
                <p className="text-muted-foreground text-sm">Continue your journey</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    placeholder="your.email@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                New here?{" "}
                <button onClick={() => setMode("signup")} className="text-primary hover:underline">
                  Join TechnoVista
                </button>
              </p>

              <button
                onClick={() => setMode("welcome")}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground w-full text-center"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {mode === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 border-secondary/30"
            >
              <div className="text-center mb-6">
                <Shield className="w-12 h-12 mx-auto text-secondary mb-2" />
                <h2 className="text-2xl font-display font-bold">Admin Portal</h2>
                <p className="text-muted-foreground text-sm">Restricted Access</p>
              </div>

              <form onSubmit={handleAdminSignIn} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    placeholder="admin@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Admin PIN</label>
                  <Input
                    type="password"
                    placeholder="Enter admin PIN"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    required
                    className="border-secondary/30 focus:border-secondary"
                  />
                </div>

                <Button type="submit" variant="secondary" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Access Admin Portal"}
                </Button>
              </form>

              <button
                onClick={() => setMode("welcome")}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground w-full text-center"
              >
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}