import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        toast({
          title: "Voice Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive"
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleListening}
        disabled={disabled}
        className={`shrink-0 transition-all duration-300 ${
          isListening 
            ? "bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30" 
            : ""
        }`}
        title={isListening ? "Stop listening" : "Voice input"}
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="listening"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <MicOff className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Mic className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
      
      {/* Listening indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 whitespace-nowrap"
          >
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-white rounded-full"
            />
            Listening...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
