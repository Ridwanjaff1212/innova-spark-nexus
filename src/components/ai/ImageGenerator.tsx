import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Loader2, Download, X, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-image`;

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
  disabled?: boolean;
}

export default function ImageGenerator({ onImageGenerated, disabled }: ImageGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await fetch(IMAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        onImageGenerated?.(data.imageUrl, prompt);
        toast({
          title: "Image Generated! 🎨",
          description: "Your AI image has been created successfully.",
        });
      } else {
        throw new Error("No image returned");
      }
    } catch (e) {
      console.error("Image generation error:", e);
      toast({
        title: "Generation Failed",
        description: e instanceof Error ? e.message : "Could not generate image",
        variant: "destructive",
      });
    }

    setIsGenerating(false);
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={`shrink-0 transition-all ${isOpen ? "bg-primary/20 border-primary" : ""}`}
        title="Generate AI Image"
        disabled={disabled}
      >
        <ImageIcon className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-3 right-0 w-80 bg-card border border-border rounded-xl shadow-2xl p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Image Generator
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Describe the image you want..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateImage()}
                disabled={isGenerating}
                className="text-sm"
              />

              <Button
                onClick={generateImage}
                disabled={!prompt.trim() || isGenerating}
                className="w-full"
                variant="gradient"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>

              {generatedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  <img
                    src={generatedImage}
                    alt="AI Generated"
                    className="w-full rounded-lg border border-border"
                  />
                  <Button
                    onClick={downloadImage}
                    size="sm"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
