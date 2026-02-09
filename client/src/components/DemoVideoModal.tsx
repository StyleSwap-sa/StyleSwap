import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Play } from "lucide-react";

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
}

export default function DemoVideoModal({ isOpen, onClose, videoUrl }: DemoVideoModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Default demo video URL - can be replaced with actual video
  const demoVideoUrl = videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 bg-background rounded-lg overflow-hidden shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-background/80 hover:bg-background rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Video Container */}
        <div className="relative w-full bg-black">
          <div className="aspect-video">
            {demoVideoUrl.includes("youtube") ? (
              <iframe
                width="100%"
                height="100%"
                src={demoVideoUrl}
                title="StyleSwap Virtual Try-On Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <video
                width="100%"
                height="100%"
                controls
                autoPlay
                className="w-full h-full"
              >
                <source src={demoVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>

        {/* Video Info */}
        <div className="p-6 bg-background border-t border-border">
          <h3 className="text-xl font-bold mb-2">How Virtual Try-On Works</h3>
          <p className="text-muted-foreground mb-4">
            See how StyleSwap's AI-powered virtual try-on technology helps your customers make confident purchasing decisions. This demo shows the complete try-on workflow from upload to final result.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={onClose}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/b2b-signup"}
              className="text-primary border-primary hover:bg-primary/10"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
