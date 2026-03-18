/**
 * AR Settings Control Component
 * Allows users to adjust AR parameters and settings
 */

import React from 'react';
import { ARSettings, DEFAULT_AR_SETTINGS } from '@/lib/arUtils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Settings, RotateCcw } from 'lucide-react';

interface ARSettingsControlProps {
  settings: ARSettings;
  onSettingsChange: (settings: ARSettings) => void;
  onReset?: () => void;
}

export function ARSettingsControl({
  settings,
  onSettingsChange,
  onReset,
}: ARSettingsControlProps) {
  const handleBodyTrackingToggle = (enabled: boolean) => {
    onSettingsChange({
      ...settings,
      enableBodyTracking: enabled,
    });
  };

  const handleClothingVisualizationToggle = (enabled: boolean) => {
    onSettingsChange({
      ...settings,
      enableClothingVisualization: enabled,
    });
  };

  const handleOpacityChange = (value: number[]) => {
    onSettingsChange({
      ...settings,
      clothingOpacity: value[0],
    });
  };

  const handleScaleChange = (value: number[]) => {
    onSettingsChange({
      ...settings,
      bodyModelScale: value[0],
    });
  };

  const handleLightingChange = (value: number[]) => {
    onSettingsChange({
      ...settings,
      lightingIntensity: value[0],
    });
  };

  const handleBackgroundColorChange = (color: string) => {
    onSettingsChange({
      ...settings,
      backgroundColor: color,
    });
  };

  const handleReset = () => {
    onSettingsChange(DEFAULT_AR_SETTINGS);
    onReset?.();
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900">AR Settings</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      {/* Body Tracking Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Body Tracking
          </label>
          <Switch
            checked={settings.enableBodyTracking}
            onCheckedChange={handleBodyTrackingToggle}
          />
        </div>
        <p className="text-xs text-gray-600">
          Enable real-time body pose detection for accurate virtual try-on
        </p>
      </div>

      {/* Clothing Visualization Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Clothing Visualization
          </label>
          <Switch
            checked={settings.enableClothingVisualization}
            onCheckedChange={handleClothingVisualizationToggle}
          />
        </div>
        <p className="text-xs text-gray-600">
          Display clothing on the 3D body model
        </p>
      </div>

      {/* Clothing Opacity Slider */}
      {settings.enableClothingVisualization && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Clothing Opacity
            </label>
            <span className="text-sm text-gray-600">
              {Math.round(settings.clothingOpacity * 100)}%
            </span>
          </div>
          <Slider
            value={[settings.clothingOpacity]}
            onValueChange={handleOpacityChange}
            min={0}
            max={1}
            step={0.1}
            className="w-full"
          />
          <p className="text-xs text-gray-600">
            Adjust how transparent the clothing appears
          </p>
        </div>
      )}

      {/* Body Model Scale Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Body Model Size
          </label>
          <span className="text-sm text-gray-600">
            {(settings.bodyModelScale * 100).toFixed(0)}%
          </span>
        </div>
        <Slider
          value={[settings.bodyModelScale]}
          onValueChange={handleScaleChange}
          min={0.5}
          max={2}
          step={0.1}
          className="w-full"
        />
        <p className="text-xs text-gray-600">
          Adjust the size of the 3D body model
        </p>
      </div>

      {/* Lighting Intensity Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Lighting Intensity
          </label>
          <span className="text-sm text-gray-600">
            {(settings.lightingIntensity * 100).toFixed(0)}%
          </span>
        </div>
        <Slider
          value={[settings.lightingIntensity]}
          onValueChange={handleLightingChange}
          min={0.5}
          max={2}
          step={0.1}
          className="w-full"
        />
        <p className="text-xs text-gray-600">
          Adjust the brightness of the 3D scene
        </p>
      </div>

      {/* Background Color Picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Background Color
        </label>
        <div className="flex gap-2">
          {['#ffffff', '#f3f4f6', '#1f2937', '#000000'].map((color) => (
            <button
              key={color}
              onClick={() => handleBackgroundColorChange(color)}
              className={`w-8 h-8 rounded border-2 transition-all ${
                settings.backgroundColor === color
                  ? 'border-blue-500 scale-110'
                  : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <input
            type="color"
            value={settings.backgroundColor}
            onChange={(e) => handleBackgroundColorChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
            title="Custom color"
          />
        </div>
        <p className="text-xs text-gray-600">
          Choose the background color for the 3D scene
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Use body tracking for the most accurate
          virtual try-on experience. Adjust opacity to see both the clothing
          and your body shape.
        </p>
      </div>
    </div>
  );
}
