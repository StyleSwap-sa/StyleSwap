/**
 * AR Try-On Page
 * Complete AR virtual try-on experience with camera, 3D models, and settings
 */

import React, { useState } from 'react';
import { ARCamera } from '@/components/ARCamera';
import { AR3DScene } from '@/components/AR3DScene';
import { ARSettingsControl } from '@/components/ARSettings';
import { PoseData, ARSettings, DEFAULT_AR_SETTINGS } from '@/lib/arUtils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Share2, RotateCcw } from 'lucide-react';

export default function ARTryOn() {
  const [poseData, setPoseData] = useState<PoseData | undefined>();
  const [clothingImageUrl, setClothingImageUrl] = useState<string>('');
  const [clothingType, setClothingType] = useState<'shirt' | 'pants' | 'dress'>(
    'shirt'
  );
  const [arSettings, setArSettings] = useState<ARSettings>(DEFAULT_AR_SETTINGS);
  const [arActive, setArActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle pose detection
  const handlePoseDetected = (pose: PoseData) => {
    setPoseData(pose);
  };

  // Handle clothing image upload
  const handleClothingUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setClothingImageUrl(url);
      setError(null);
      setSuccessMessage('Clothing image loaded successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  // Handle screenshot
  const handleScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      setError('No canvas found');
      return;
    }

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `ar-tryon-${Date.now()}.png`;
    link.click();

    setSuccessMessage('Screenshot saved successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle share
  const handleShare = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      setError('No canvas found');
      return;
    }

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `ar-tryon-${Date.now()}.png`, {
          type: 'image/png',
        });

        if (navigator.share) {
          await navigator.share({
            title: 'StyleSwap AR Try-On',
            text: 'Check out my virtual try-on with StyleSwap!',
            files: [file],
          });
          setSuccessMessage('Shared successfully');
        } else {
          setError('Share not supported on this device');
        }
        setTimeout(() => setSuccessMessage(null), 3000);
      });
    } catch (err) {
      console.error('Share error:', err);
      setError('Failed to share');
    }
  };

  // Handle reset
  const handleReset = () => {
    setPoseData(undefined);
    setClothingImageUrl('');
    setArSettings(DEFAULT_AR_SETTINGS);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            AR Virtual Try-On
          </h1>
          <p className="text-lg text-gray-600">
            See how clothes fit on your body in real-time with augmented reality
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            {successMessage}
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Camera and 3D Scene */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera">Live Camera</TabsTrigger>
                <TabsTrigger value="3d">3D Preview</TabsTrigger>
              </TabsList>

              {/* Camera Tab */}
              <TabsContent value="camera" className="space-y-4">
                <ARCamera
                  onPoseDetected={handlePoseDetected}
                  onError={setError}
                  isActive={arActive}
                />
                <p className="text-sm text-gray-600">
                  Position your full body in the frame for the best experience.
                  Make sure you're in good lighting.
                </p>
              </TabsContent>

              {/* 3D Preview Tab */}
              <TabsContent value="3d" className="space-y-4">
                <AR3DScene
                  poseData={poseData}
                  clothingImageUrl={clothingImageUrl}
                  clothingType={clothingType}
                  arSettings={arSettings}
                  onError={setError}
                />
                <p className="text-sm text-gray-600">
                  3D visualization of your virtual try-on. Upload clothing to
                  see it on the model.
                </p>
              </TabsContent>
            </Tabs>

            {/* Clothing Upload Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Upload Clothing</h3>

              {/* Clothing Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Clothing Type
                </label>
                <div className="flex gap-2">
                  {(['shirt', 'pants', 'dress'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setClothingType(type)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        clothingType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Clothing Image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleClothingUpload}
                    className="hidden"
                    id="clothing-upload"
                  />
                  <label
                    htmlFor="clothing-upload"
                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Upload className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </span>
                  </label>
                </div>
              </div>

              {/* Current Clothing Preview */}
              {clothingImageUrl && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Current Clothing
                  </label>
                  <img
                    src={clothingImageUrl}
                    alt="Current clothing"
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Settings and Controls */}
          <div className="space-y-6">
            {/* AR Settings */}
            <ARSettingsControl
              settings={arSettings}
              onSettingsChange={setArSettings}
              onReset={handleReset}
            />

            {/* Action Buttons */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

              <Button
                onClick={handleScreenshot}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Download Screenshot
              </Button>

              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Result
              </Button>

              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All
              </Button>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-blue-900">Tips for Best Results</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Wear fitted clothing for accurate body tracking</li>
                <li>• Ensure good lighting in your room</li>
                <li>• Stand 3-4 feet away from camera</li>
                <li>• Keep your full body visible in frame</li>
                <li>• Use high-quality clothing images</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
