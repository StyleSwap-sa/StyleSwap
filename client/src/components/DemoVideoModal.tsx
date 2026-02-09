import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
    title: "For Boutique Partners",
    description: "See how boutique owners use StyleSwap to increase conversions and reduce returns. Learn about the dashboard, analytics, and payout system.",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    duration: "5:30",
    audience: "boutique",
  },
  {
    id: "customer-demo",
    title: "For Customers",
    description: "Experience the customer perspective. Watch how easy it is to upload a photo and try on clothes virtually before making a purchase.",
    url: "https://www.youtube.com/embed/9bZkp7q19f0",
    duration: "3:45",
    audience: "customer",
  },
  {
    id: "full-demo",
    title: "Complete Platform Overview",
    description: "Get a comprehensive walkthrough of the entire StyleSwap platform, from boutique setup to customer try-ons to payouts.",
    url: "https://www.youtube.com/embed/jNQXAC9IVRw",
    duration: "8:15",
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
          <div className="aspect-video">
            {selectedVideo.url.includes("youtube") ? (
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
