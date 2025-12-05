import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import emblem from "@/assets/icsk-emblem.png";

interface LoadingScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export default function LoadingScreen({ onComplete, minDuration = 2500 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 2;
      });
    }, minDuration / 50);

    return () => clearInterval(interval);
  }, [onComplete, minDuration]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      >
        {/* Subtle vine decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Corner vine SVGs */}
          <svg className="absolute top-0 left-0 w-48 h-48 opacity-10" viewBox="0 0 200 200">
            <path
              d="M0,100 Q50,50 100,50 T200,0"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              className="animate-pulse"
            />
            <path
              d="M0,150 Q75,100 100,100 T150,50"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
            />
          </svg>
          <svg className="absolute bottom-0 right-0 w-48 h-48 opacity-10 rotate-180" viewBox="0 0 200 200">
            <path
              d="M0,100 Q50,50 100,50 T200,0"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* Main emblem container */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Glow ring */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
              transform: "scale(1.5)",
            }}
          />

          {/* Metallic emblem */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-2xl relative bg-white">
                {/* Metallic shine overlay */}
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
                  className="absolute inset-0 z-10"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.3) 50%, transparent 100%)",
                  }}
                />
                <img 
                  src={emblem} 
                  alt="ICSK Emblem" 
                  className="w-full h-full object-contain p-2"
                />
              </div>
            </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            <span className="gradient-text">TechnoVista</span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-muted-foreground mt-2 font-display"
          >
            ICSK Khaitan Techno Club 2025
          </motion.p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "200px" }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-8"
        >
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {progress < 100 ? "Loading..." : "Welcome!"}
          </p>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 text-sm text-muted-foreground font-display"
        >
          Dream • Build • Innovate
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}