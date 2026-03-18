import { useState } from "react";
import { TryOnModeSelector, type TryOnMode } from "@/components/TryOnModeSelector";
import ARTryOn from "@/pages/ARTryOn";
import { VirtualTryOnUpload } from "@/components/VirtualTryOnUpload";
import { useLocation } from "wouter";

/**
 * Unified Try-On Page
 * 
 * This page allows customers to choose between two try-on experiences:
 * 1. AR Try-On: Real-time augmented reality using camera
 * 2. Upload Try-On: Upload body photo + clothing image for AI generation
 * 
 * The page preserves all existing upload workflow and features while adding AR as an alternative.
 */
export default function TryOnPage() {
  const [selectedMode, setSelectedMode] = useState<TryOnMode>(null);
  const [, setLocation] = useLocation(); // eslint-disable-line @typescript-eslint/no-unused-vars
  // setLocation is used for potential future navigation enhancements

  // If AR mode is selected, show the AR Try-On component
  if (selectedMode === "ar") {
    return (
      <div className="min-h-screen bg-background">
      <button
        onClick={() => setSelectedMode(null)}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm"
      >
        ← Back
      </button>
        <ARTryOn />
      </div>
    );
  }

  // If Upload mode is selected, show the Upload Try-On component
  if (selectedMode === "upload") {
    return (
      <div className="min-h-screen bg-background">
        <button
          onClick={() => setSelectedMode(null)}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors"
        >
          ← Back to Mode Selection
        </button>
        <VirtualTryOnUpload />
      </div>
    );
  }

  // Default: Show mode selector
  return (
    <div className="min-h-screen bg-background">
      <TryOnModeSelector onSelectMode={setSelectedMode} selectedMode={selectedMode} />
    </div>
  );
}
