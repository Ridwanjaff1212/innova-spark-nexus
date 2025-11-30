import { motion } from "framer-motion";
import { Bot, Zap, Sparkles, Brain, Cpu, Waves } from "lucide-react";

interface Avatar3DProps {
  isSpeaking?: boolean;
  isThinking?: boolean;
}

export default function Avatar3D({ isSpeaking, isThinking }: Avatar3DProps) {
  return (
    <motion.div 
      className="relative"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Outer glow */}
      <motion.div
        animate={{ 
          boxShadow: isSpeaking 
            ? ["0 0 40px hsl(var(--primary) / 0.4)", "0 0 60px hsl(var(--primary) / 0.6)", "0 0 40px hsl(var(--primary) / 0.4)"]
            : "0 0 30px hsl(var(--primary) / 0.3)"
        }}
        transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
        className="absolute inset-0 rounded-3xl"
      />
      
      {/* Main avatar container */}
      <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent p-1.5 shadow-2xl relative overflow-visible">
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-card via-card/90 to-card/80 flex items-center justify-center relative overflow-hidden">
          {/* Background particles */}
          <div className="absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/40 rounded-full"
                style={{
                  left: `${20 + i * 12}%`,
                  top: `${30 + (i % 3) * 20}%`,
                }}
                animate={{
                  y: [-10, 10, -10],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>

          {/* Robot face with eyes */}
          <div className="relative z-10">
            {isThinking ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-14 h-14 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
              >
                <Bot className="w-14 h-14 text-primary" />
              </motion.div>
            )}
            
            {/* Eyes glow effect */}
            <motion.div
              className="absolute top-3 left-3 w-3 h-2 bg-primary/60 rounded-full blur-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute top-3 right-3 w-3 h-2 bg-primary/60 rounded-full blur-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
          </div>

          {/* Inner glowing rings */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.2, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-2 rounded-xl border-2 border-primary/30"
          />
          <motion.div
            animate={{ scale: [1.1, 1.25, 1.1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
            className="absolute inset-1 rounded-xl border-2 border-secondary/20"
          />
        </div>
      </div>

      {/* Floating icons around avatar */}
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1]
        }}
        transition={{ rotate: { duration: 15, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
        className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center shadow-lg"
      >
        <Sparkles className="w-4 h-4 text-white" />
      </motion.div>

      <motion.div
        animate={{ 
          rotate: -360,
          y: [0, -3, 0]
        }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, y: { duration: 2, repeat: Infinity } }}
        className="absolute -bottom-2 -left-3 w-7 h-7 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg"
      >
        <Cpu className="w-3.5 h-3.5 text-white" />
      </motion.div>

      {/* Status indicator */}
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-card flex items-center justify-center shadow-lg ${
          isSpeaking ? "bg-green-500" : isThinking ? "bg-amber-500" : "bg-green-500"
        }`}
      >
        {isSpeaking ? (
          <Waves className="w-3.5 h-3.5 text-white" />
        ) : (
          <Zap className="w-3.5 h-3.5 text-white" />
        )}
      </motion.div>

      {/* Sound waves when speaking */}
      <AnimatePresenceWrapper isSpeaking={isSpeaking} />
    </motion.div>
  );
}

function AnimatePresenceWrapper({ isSpeaking }: { isSpeaking?: boolean }) {
  if (!isSpeaking) return null;
  
  return (
    <>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            delay: i * 0.3,
            ease: "easeOut"
          }}
          className="absolute inset-0 rounded-3xl border-2 border-primary/40"
        />
      ))}
    </>
  );
}
