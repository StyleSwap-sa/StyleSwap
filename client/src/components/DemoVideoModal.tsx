import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, AlertCircle } from "lucide-react";

export interface DemoVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: string;
  audience: "boutique" | "customer" | "both";
}

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos?: DemoVideo[];
  defaultVideoId?: string;
}

const DEFAULT_VIDEOS: DemoVideo[] = [
  {
    id: "boutique-demo",
    title: "Virtual Try-On for Boutique Partners",
    description: "Watch how StyleSwap's AI-powered virtual try-on technology helps boutique owners increase conversions, reduce returns, and boost customer confidence. See the complete workflow from upload to final try-on result.",
    url: "",
    duration: "Coming Soon",
    audience: "boutique",
  },
  {
    id: "customer-demo",
    title: "Virtual Try-On for Customers",
    description: "Experience how customers use StyleSwap to virtually try on clothes before purchasing. Upload a photo, select a garment, and see realistic AI-generated try-on results in seconds.",
    url: "",
    duration: "Coming Soon",
    audience: "customer",
  },
  {
    id: "full-demo",
    title: "Complete Virtual Try-On Workflow",
    description: "Get a comprehensive walkthrough of the entire StyleSwap virtual try-on process, from image upload and garment selection to AI generation and final result display.",
    url: "",
    duration: "Coming Soon",
    audience: "both",
  },
];

export default function DemoVideoModal({
  isOpen,
  onClose,
  videos = DEFAULT_VIDEOS,
  defaultVideoId = "boutique-demo",
}: DemoVideoModalProps) {
  const [selectedVideoId, setSelectedVideoId] = useState(defaultVideoId);

  const selectedVideo = videos.find((v) => v.id === selectedVideoId) || videos[0];

  if (!isOpen) return null;

  const hasVideo = selectedVideo.url && selectedVideo.url.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-background rounded-lg overflow-hidden shadow-2xl">
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
          <div className="aspect-video flex items-center justify-center">
            {hasVideo ? (
              selectedVideo.url.includes("youtube") ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={selectedVideo.url}
                  title={selectedVideo.title}
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
                  <source src={selectedVideo.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                <AlertCircle className="w-16 h-16 text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Demo Video Coming Soon
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    We're preparing high-quality virtual try-on demo videos. Check back soon to see how StyleSwap transforms the fashion retail experience.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Selector Tabs */}
        {videos.length > 1 && (
          <div className="border-b border-border bg-background/50">
            <div className="flex gap-2 p-4 overflow-x-auto">
              {videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideoId(video.id)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedVideoId === video.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {video.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Video Info */}
        <div className="p-6 bg-background border-t border-border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold mb-2">{selectedVideo.title}</h3>
              <p className="text-muted-foreground mb-4">{selectedVideo.description}</p>
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
              {selectedVideo.duration}
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
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
