import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoVideoModal({
  isOpen,
  onClose,
}: DemoVideoModalProps) {
  if (!isOpen) return null;

  const infographicUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663284718291/ZPdGKPgoDfICOxjS.png";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border/20 bg-background">
          <h2 className="text-2xl font-bold">Virtual Try-On Workflow</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <p className="text-muted-foreground text-lg">
              Follow these simple steps to experience the power of StyleSwap's AI-powered virtual try-on technology:
            </p>
            
            {/* Infographic */}
            <div className="bg-secondary/5 rounded-lg p-4 overflow-auto max-h-[50vh]">
              <img 
                src={infographicUrl}
                alt="Virtual Try-On Workflow Steps"
                className="w-full h-auto"
              />
            </div>

            {/* Steps Description */}
            <div className="grid gap-4 mt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Upload Body Photo</h4>
                  <p className="text-sm text-muted-foreground">
                    Capture or upload a clear, full-body photo in fitted clothes for best results.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Select Garment</h4>
                  <p className="text-sm text-muted-foreground">
                    Browse and choose the desired item from the boutique's collection.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Choose Type</h4>
                  <p className="text-sm text-muted-foreground">
                    Specify whether you want to try on the top or bottom of the outfit.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">AI Generates</h4>
                  <p className="text-sm text-muted-foreground">
                    StyleSwap's AI seamlessly fits the garment to your photo in seconds.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <div>
                  <h4 className="font-semibold mb-1">View Result</h4>
                  <p className="text-sm text-muted-foreground">
                    See the final try-on result, save it, and share with friends.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border/20">
            <Button 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onClose}
            >
              Get Started Now
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => window.open(infographicUrl, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
