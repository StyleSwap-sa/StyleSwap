/**
 * AR Camera Component
 * Handles video stream capture and pose detection for AR try-on
 */

import React, { useEffect, useRef, useState } from 'react';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import {
  initializePoseLandmarker,
  detectPose,
  checkARSupport,
  requestCameraPermission,
  PoseData,
} from '@/lib/arUtils';
import { AlertCircle, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ARCameraProps {
  onPoseDetected?: (poseData: PoseData) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}

export function ARCamera({ onPoseDetected, onError, isActive }: ARCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [arSupported, setArSupported] = useState(true);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check AR support and initialize
  useEffect(() => {
    const support = checkARSupport();
    setArSupported(support.supported);

    if (!support.supported) {
      setError(support.message);
      onError?.(support.message);
      setLoading(false);
      return;
    }

    initializeAR();
  }, []);

  // Initialize AR components
  const initializeAR = async () => {
    try {
      setLoading(true);

      // Request camera permission
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      // Initialize pose landmarker
      const landmarker = await initializePoseLandmarker();
      poseLandmarkerRef.current = landmarker;

      // Start video stream
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setLoading(false);
          startPoseDetection();
        };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize AR';
      setError(errorMessage);
      onError?.(errorMessage);
      setLoading(false);
    }
  };

  // Start continuous pose detection
  const startPoseDetection = () => {
    const detectFrame = () => {
      if (!videoRef.current || !poseLandmarkerRef.current) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      if (!isActive) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      try {
        const poseData = detectPose(
          poseLandmarkerRef.current,
          videoRef.current
        );

        if (poseData) {
          onPoseDetected?.(poseData);
          drawPoseOnCanvas(poseData);
        } else {
          // No pose detected, show video feed
          if (canvasRef.current && videoRef.current && videoRef.current.videoWidth > 0) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              ctx.drawImage(videoRef.current, 0, 0);
            }
          }
        }
      } catch (err) {
        console.error('Pose detection error:', err);
        if (canvasRef.current && videoRef.current && videoRef.current.videoWidth > 0) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    animationFrameRef.current = requestAnimationFrame(detectFrame);
  };

  // Draw pose landmarks on canvas
  const drawPoseOnCanvas = (poseData: PoseData) => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw landmarks
    const landmarks = poseData.landmarks;
    const connections = [
      [11, 12], // shoulders
      [11, 13], // left shoulder to elbow
      [13, 15], // left elbow to wrist
      [12, 14], // right shoulder to elbow
      [14, 16], // right elbow to wrist
      [11, 23], // left shoulder to hip
      [12, 24], // right shoulder to hip
      [23, 24], // hips
      [23, 25], // left hip to knee
      [25, 27], // left knee to ankle
      [24, 26], // right hip to knee
      [26, 28], // right knee to ankle
    ];

    // Draw connections
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
    ctx.lineWidth = 2;
    connections.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end]) {
        const startLandmark = landmarks[start];
        const endLandmark = landmarks[end];
        ctx.beginPath();
        ctx.moveTo(
          startLandmark.x * canvasRef.current!.width,
          startLandmark.y * canvasRef.current!.height
        );
        ctx.lineTo(
          endLandmark.x * canvasRef.current!.width,
          endLandmark.y * canvasRef.current!.height
        );
        ctx.stroke();
      }
    });

    // Draw landmarks
    ctx.fillStyle = 'rgba(100, 255, 100, 0.8)';
    landmarks.forEach((landmark) => {
      if (landmark.visibility && landmark.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(
          landmark.x * canvasRef.current!.width,
          landmark.y * canvasRef.current!.height,
          4,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  if (!arSupported) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">AR Not Supported</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Camera Error</h3>
            <p className="text-sm text-red-700">{error}</p>
            <Button
              onClick={initializeAR}
              className="mt-2 bg-red-600 hover:bg-red-700"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {loading && (
        <div className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-xs sm:text-sm text-blue-700">Initializing AR camera...</span>
        </div>
      )}

      <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
        {/* Video element (hidden) */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
          muted
        />

        {/* Canvas for pose visualization */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
        />

        {/* Camera indicator */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex items-center gap-1 sm:gap-2 bg-black/50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
          <Camera className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
          <span className="text-xs text-white font-medium">Live</span>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Position your body in the frame for accurate virtual try-on. Make sure
        your full body is visible from head to feet.
      </p>
    </div>
  );
}
