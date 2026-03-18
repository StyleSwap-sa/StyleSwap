import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Download, Share2, X, ChevronLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface StyleSwapWidgetProps {
  apiKey: string;
  productId: string;
  productImage?: string;
  productName?: string;
  onTryOnComplete?: (result: { imageUrl: string; tryonId: string }) => void;
  primaryColor?: string;
  accentColor?: string;
  containerWidth?: string;
}

type Step = 'initial' | 'garment-type' | 'body-upload' | 'garment-upload' | 'processing' | 'result';

const GARMENT_TYPES = [
  { id: 'dress', label: 'Dress', icon: '👗' },
  { id: 'shirt', label: 'Shirt', icon: '👔' },
  { id: 'pants', label: 'Pants', icon: '👖' },
  { id: 'skirt', label: 'Skirt', icon: '🩱' },
  { id: 'jacket', label: 'Jacket', icon: '🧥' },
];

export const StyleSwapWidget: React.FC<StyleSwapWidgetProps> = ({
  apiKey,
  productId,
  productImage,
  productName = 'Product',
  onTryOnComplete,
  primaryColor = '#FF6B35',
  accentColor = '#004E89',
  containerWidth = '100%',
}) => {
  const [step, setStep] = useState<Step>('initial');
  const [selectedGarmentType, setSelectedGarmentType] = useState<string | null>(null);
  const [bodyImage, setBodyImage] = useState<File | null>(null);
  const [garmentImage, setGarmentImage] = useState<File | null>(null);
  const [tryOnResult, setTryOnResult] = useState<{ imageUrl: string; tryonId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const bodyInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  const handleBodyImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBodyImage(file);
      setStep('garment-upload');
    }
  };

  const handleGarmentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGarmentImage(file);
      generateTryOn(file);
    }
  };

  const generateTryOn = async (garmentFile: File) => {
    if (!bodyImage || !selectedGarmentType) {
      setError('Missing required information');
      return;
    }

    setIsLoading(true);
    setStep('processing');
    setError(null);

    try {
      // TODO: Call tRPC procedure to generate try-on
      // const result = await trpc.tryons.generate.mutate({
      //   bodyImage: bodyImage,
      //   garmentImage: garmentFile,
      //   garmentType: selectedGarmentType,
      //   productId: productId,
      // });

      // Mock result for now
      setTimeout(() => {
        const mockResult = {
          imageUrl: URL.createObjectURL(garmentFile),
          tryonId: 'tryon_' + Date.now(),
        };
        setTryOnResult(mockResult);
        setStep('result');
        setIsLoading(false);
        onTryOnComplete?.(mockResult);
      }, 2000);
    } catch (err) {
      setError('Failed to generate try-on. Please try again.');
      setIsLoading(false);
      setStep('garment-upload');
    }
  };

  const reset = () => {
    setStep('initial');
    setSelectedGarmentType(null);
    setBodyImage(null);
    setGarmentImage(null);
    setTryOnResult(null);
    setError(null);
  };

  const downloadResult = () => {
    if (tryOnResult) {
      const link = document.createElement('a');
      link.href = tryOnResult.imageUrl;
      link.download = `styleswap-tryon-${Date.now()}.png`;
      link.click();
    }
  };

  const shareResult = () => {
    if (tryOnResult && navigator.share) {
      navigator.share({
        title: 'StyleSwap Try-On',
        text: `Check out my try-on with ${productName}!`,
        url: window.location.href,
      });
    }
  };

  const containerStyle = {
    width: containerWidth,
    maxWidth: '500px',
    margin: '0 auto',
  };

  const buttonStyle = {
    backgroundColor: primaryColor,
    color: 'white',
  };

  return (
    <div style={containerStyle} className="font-sans">
      {/* Initial Step */}
      {step === 'initial' && (
        <Card className="shadow-lg border-0">
          <CardHeader style={{ backgroundColor: primaryColor, color: 'white' }}>
            <CardTitle className="text-xl">Try On {productName}</CardTitle>
            <p className="text-sm opacity-90 mt-2">See how this looks on you in seconds</p>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {productImage && (
              <img src={productImage} alt={productName} className="w-full rounded-lg mb-4" />
            )}
            <Button
              onClick={() => setStep('garment-type')}
              className="w-full h-12 text-base"
              style={buttonStyle}
            >
              Start Try-On
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Upload a photo of yourself and we'll show you how this looks
            </p>
          </CardContent>
        </Card>
      )}

      {/* Garment Type Selection */}
      {step === 'garment-type' && (
        <Card className="shadow-lg border-0">
          <CardHeader style={{ backgroundColor: primaryColor, color: 'white' }}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('initial')}
                className="hover:opacity-80 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <CardTitle>Select Garment Type</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {GARMENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedGarmentType(type.id);
                    setStep('body-upload');
                  }}
                  className={`p-4 rounded-lg border-2 transition text-center ${
                    selectedGarmentType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Body Image Upload */}
      {step === 'body-upload' && (
        <Card className="shadow-lg border-0">
          <CardHeader style={{ backgroundColor: primaryColor, color: 'white' }}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('garment-type')}
                className="hover:opacity-80 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <CardTitle>Upload Your Photo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div
              onClick={() => bodyInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition"
            >
              <Upload className="mx-auto mb-3 text-gray-400" size={32} />
              <p className="font-medium mb-1">Click to upload your photo</p>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            </div>
            <input
              ref={bodyInputRef}
              type="file"
              accept="image/*"
              onChange={handleBodyImageSelect}
              className="hidden"
            />
            {bodyImage && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">✓ Photo selected</p>
                <img
                  src={URL.createObjectURL(bodyImage)}
                  alt="Body"
                  className="w-full rounded-lg max-h-64 object-cover"
                />
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Garment Image Upload */}
      {step === 'garment-upload' && (
        <Card className="shadow-lg border-0">
          <CardHeader style={{ backgroundColor: primaryColor, color: 'white' }}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('body-upload')}
                className="hover:opacity-80 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <CardTitle>Upload Garment Photo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div
              onClick={() => garmentInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition"
            >
              <Upload className="mx-auto mb-3 text-gray-400" size={32} />
              <p className="font-medium mb-1">Click to upload garment photo</p>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            </div>
            <input
              ref={garmentInputRef}
              type="file"
              accept="image/*"
              onChange={handleGarmentImageSelect}
              className="hidden"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Processing Step */}
      {step === 'processing' && (
        <Card className="shadow-lg border-0">
          <CardHeader style={{ backgroundColor: primaryColor, color: 'white' }}>
            <CardTitle>Generating Try-On</CardTitle>
          </CardHeader>
          <CardContent className="pt-12 pb-12 text-center space-y-4">
            <Loader2 className="mx-auto animate-spin" size={48} style={{ color: primaryColor }} />
            <p className="font-medium">Creating your try-on...</p>
            <p className="text-sm text-gray-500">This usually takes 10-15 seconds</p>
          </CardContent>
        </Card>
      )}

      {/* Result Step */}
      {step === 'result' && tryOnResult && (
        <Card className="shadow-lg border-0">
          <CardHeader style={{ backgroundColor: primaryColor, color: 'white' }}>
            <div className="flex items-center justify-between">
              <CardTitle>Your Try-On Result</CardTitle>
              <button
                onClick={reset}
                className="hover:opacity-80 transition"
              >
                <X size={20} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <img
              src={tryOnResult.imageUrl}
              alt="Try-on result"
              className="w-full rounded-lg"
            />
            <div className="flex gap-2">
              <Button
                onClick={downloadResult}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download
              </Button>
              <Button
                onClick={shareResult}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                Share
              </Button>
            </div>
            <Button
              onClick={reset}
              className="w-full"
              style={buttonStyle}
            >
              Try Another
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
