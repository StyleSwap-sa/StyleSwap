/**
 * AR 3D Scene Component
 * Renders 3D body model and clothing using Three.js
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  create3DBodyModel,
  create3DClothingModel,
  setupSceneLighting,
  updateBodyModelFromPose,
  setClothingOpacity,
  setSceneBackground,
  PoseData,
  ARSettings,
  DEFAULT_AR_SETTINGS,
} from '@/lib/arUtils';
import { AlertCircle, Loader2 } from 'lucide-react';

interface AR3DSceneProps {
  poseData?: PoseData;
  clothingImageUrl?: string;
  clothingType?: 'shirt' | 'pants' | 'dress';
  arSettings?: Partial<ARSettings>;
  onError?: (error: string) => void;
}

export function AR3DScene({
  poseData,
  clothingImageUrl,
  clothingType = 'shirt',
  arSettings = {},
  onError,
}: AR3DSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bodyModelRef = useRef<THREE.Group | null>(null);
  const clothingModelRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settings = { ...DEFAULT_AR_SETTINGS, ...arSettings };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera setup
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 2;
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Setup lighting
      setupSceneLighting(scene, settings.lightingIntensity);

      // Set background
      setSceneBackground(scene, settings.backgroundColor);

      // Create body model
      const bodyModel = create3DBodyModel(scene, settings.bodyModelScale);
      bodyModelRef.current = bodyModel;

      // Load clothing if provided
      if (clothingImageUrl) {
        create3DClothingModel(scene, clothingImageUrl, clothingType)
          .then((clothingModel) => {
            clothingModelRef.current = clothingModel;
            setClothingOpacity(clothingModel, settings.clothingOpacity);
          })
          .catch((err) => {
            console.error('Error loading clothing model:', err);
          });
      }

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);

        // Update body model from pose
        if (poseData && settings.enableBodyTracking && bodyModelRef.current) {
          updateBodyModelFromPose(
            bodyModelRef.current,
            poseData,
            width,
            height
          );
        }

        // Auto-rotate if no pose data
        if (!poseData && bodyModelRef.current) {
          bodyModelRef.current.rotation.y += 0.005;
        }

        renderer.render(scene, camera);
      };

      animate();

      // Handle window resize
      const handleResize = () => {
        const newWidth = containerRef.current?.clientWidth || width;
        const newHeight = containerRef.current?.clientHeight || height;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      window.addEventListener('resize', handleResize);

      setLoading(false);

      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        containerRef.current?.removeChild(renderer.domElement);
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize 3D scene';
      setError(errorMessage);
      onError?.(errorMessage);
      setLoading(false);
    }
  }, []);

  // Update clothing opacity
  useEffect(() => {
    if (clothingModelRef.current) {
      setClothingOpacity(clothingModelRef.current, settings.clothingOpacity);
    }
  }, [settings.clothingOpacity]);

  // Update background color
  useEffect(() => {
    if (sceneRef.current) {
      setSceneBackground(sceneRef.current, settings.backgroundColor);
    }
  }, [settings.backgroundColor]);

  // Update body model scale
  useEffect(() => {
    if (bodyModelRef.current) {
      bodyModelRef.current.scale.set(
        settings.bodyModelScale,
        settings.bodyModelScale,
        settings.bodyModelScale
      );
    }
  }, [settings.bodyModelScale]);

  if (error) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">3D Scene Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
            <span className="text-sm text-white">Loading 3D scene...</span>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        style={{ aspectRatio: '16 / 9', minHeight: '400px' }}
      />
    </div>
  );
}
