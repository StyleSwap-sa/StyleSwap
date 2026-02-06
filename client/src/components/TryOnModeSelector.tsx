import { useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type TryOnMode = "ar" | "upload" | null;

interface TryOnModeSelectorProps {
  onSelectMode: (mode: TryOnMode) => void;
  selectedMode: TryOnMode;
}

export function TryOnModeSelector({ onSelectMode, selectedMode }: TryOnModeSelectorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-3">Choose Your Try-On Experience</h1>
        <p className="text-sm sm:text-lg text-muted-foreground">
          Select how you'd like to virtually try on clothing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {/* AR Try-On Option */}
        <Card
          className={`cursor-pointer transition-all duration-300 ${
            selectedMode === "ar"
              ? "ring-2 ring-primary shadow-lg"
              : "hover:shadow-md"
          }`}
          onClick={() => onSelectMode("ar")}
        >
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <Camera className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl">AR Try-On</CardTitle>
            <CardDescription>Real-time virtual fitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">✓</span>
                <span>Use your camera for real-time try-on</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">✓</span>
                <span>See how clothes fit instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">✓</span>
                <span>Adjust settings (opacity, scale, lighting)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">✓</span>
                <span>Capture and share screenshots</span>
              </li>
            </ul>
            <div className="pt-4">
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded">
                📱 Best on mobile devices with camera access
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Try-On Option */}
        <Card
          className={`cursor-pointer transition-all duration-300 ${
            selectedMode === "upload"
              ? "ring-2 ring-primary shadow-lg"
              : "hover:shadow-md"
          }`}
          onClick={() => onSelectMode("upload")}
        >
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-secondary/10 rounded-lg">
                <Upload className="w-8 h-8 text-secondary" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl">Upload Try-On</CardTitle>
            <CardDescription>Upload your photos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-secondary font-bold mt-0.5">✓</span>
                <span>Upload your body photo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary font-bold mt-0.5">✓</span>
                <span>Upload clothing image</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary font-bold mt-0.5">✓</span>
                <span>AI generates realistic try-on</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary font-bold mt-0.5">✓</span>
                <span>Save and share results</span>
              </li>
            </ul>
            <div className="pt-4">
              <p className="text-xs text-blue-600 bg-blue-50 p-3 rounded">
                💡 Works on all devices - desktop & mobile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {selectedMode && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="min-w-48"
            onClick={() => {
              // This will be handled by parent component
            }}
          >
            {selectedMode === "ar" ? "Start AR Try-On" : "Upload Photos"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="min-w-48"
            onClick={() => onSelectMode(null)}
          >
            Change Selection
          </Button>
        </div>
      )}
    </div>
  );
}
