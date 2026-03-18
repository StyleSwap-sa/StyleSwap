/**
 * AR Utilities for StyleSwap
 * Handles 3D body tracking, model rendering, and AR session management
 */

import * as THREE from 'three';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export interface BodyLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseData {
  landmarks: BodyLandmark[];
  worldLandmarks: BodyLandmark[];
  segmentationMask?: ImageData;
  timestamp: number;
}

export interface ARSettings {
  enableBodyTracking: boolean;
  enableClothingVisualization: boolean;
  clothingOpacity: number;
  bodyModelScale: number;
  lightingIntensity: number;
  backgroundColor: string;
}

export const DEFAULT_AR_SETTINGS: ARSettings = {
  enableBodyTracking: true,
  enableClothingVisualization: true,
  clothingOpacity: 0.9,
  bodyModelScale: 1.0,
  lightingIntensity: 1.0,
  backgroundColor: '#ffffff',
};

/**
 * Initialize MediaPipe Pose Landmarker for body tracking
 */
export async function initializePoseLandmarker(): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
  );

  return await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  });
}

/**
 * Detect body pose from video stream
 */
export function detectPose(
  poseLandmarker: PoseLandmarker,
  videoElement: HTMLVideoElement
): PoseData | null {
  try {
    const results = poseLandmarker.detectForVideo(videoElement, Date.now());

    if (!results.landmarks || results.landmarks.length === 0) {
      return null;
    }

    return {
      landmarks: results.landmarks[0].map((landmark) => ({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility,
      })),
      worldLandmarks: results.worldLandmarks?.[0]?.map((landmark) => ({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility,
      })) || [],
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error detecting pose:', error);
    return null;
  }
}

/**
 * Create a basic 3D body model using Three.js
 */
export function create3DBodyModel(scene: THREE.Scene, scale: number = 1): THREE.Group {
  const bodyGroup = new THREE.Group();
  bodyGroup.scale.set(scale, scale, scale);

  // Head
  const headGeometry = new THREE.SphereGeometry(0.15, 32, 32);
  const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.5;
  bodyGroup.add(head);

  // Torso
  const torsoGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.2);
  const torsoMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
  const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
  torso.position.y = 0.8;
  bodyGroup.add(torso);

  // Left arm
  const leftArmGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16);
  const armMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
  const leftArm = new THREE.Mesh(leftArmGeometry, armMaterial);
  leftArm.position.set(-0.25, 0.8, 0);
  bodyGroup.add(leftArm);

  // Right arm
  const rightArm = leftArm.clone();
  rightArm.position.set(0.25, 0.8, 0);
  bodyGroup.add(rightArm);

  // Left leg
  const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 16);
  const legMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.15, 0.2, 0);
  bodyGroup.add(leftLeg);

  // Right leg
  const rightLeg = leftLeg.clone();
  rightLeg.position.set(0.15, 0.2, 0);
  bodyGroup.add(rightLeg);

  scene.add(bodyGroup);
  return bodyGroup;
}

/**
 * Create a 3D clothing model from image
 */
export function create3DClothingModel(
  scene: THREE.Scene,
  imageUrl: string,
  clothingType: 'shirt' | 'pants' | 'dress' = 'shirt'
): Promise<THREE.Mesh> {
  return new Promise((resolve, reject) => {
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(
      imageUrl,
      (texture) => {
        let geometry: THREE.BufferGeometry;
        const material = new THREE.MeshPhongMaterial({ map: texture });

        switch (clothingType) {
          case 'shirt':
            geometry = new THREE.BoxGeometry(0.35, 0.65, 0.25);
            break;
          case 'pants':
            geometry = new THREE.BoxGeometry(0.25, 0.8, 0.2);
            break;
          case 'dress':
            geometry = new THREE.BoxGeometry(0.35, 1.2, 0.25);
            break;
        }

        const clothing = new THREE.Mesh(geometry, material);
        clothing.position.y = clothingType === 'pants' ? 0.4 : 0.8;
        scene.add(clothing);

        resolve(clothing);
      },
      undefined,
      (error) => {
        console.error('Error loading clothing texture:', error);
        reject(error);
      }
    );
  });
}

/**
 * Setup lighting for 3D scene
 */
export function setupSceneLighting(scene: THREE.Scene, intensity: number = 1): void {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6 * intensity);
  scene.add(ambientLight);

  // Directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8 * intensity);
  directionalLight.position.set(5, 10, 7);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Point light
  const pointLight = new THREE.PointLight(0xffffff, 0.5 * intensity);
  pointLight.position.set(-5, 5, 5);
  scene.add(pointLight);
}

/**
 * Update body model based on pose data
 */
export function updateBodyModelFromPose(
  bodyGroup: THREE.Group,
  poseData: PoseData,
  videoWidth: number,
  videoHeight: number
): void {
  if (!poseData.worldLandmarks || poseData.worldLandmarks.length === 0) {
    return;
  }

  const landmarks = poseData.worldLandmarks;

  // Update torso position (using shoulder and hip landmarks)
  if (landmarks[11] && landmarks[23]) {
    const shoulderPos = landmarks[11];
    const hipPos = landmarks[23];
    bodyGroup.position.set(
      (shoulderPos.x - 0.5) * 2,
      (1 - shoulderPos.y) * 2,
      shoulderPos.z
    );
  }

  // Update rotation based on pose
  if (landmarks[11] && landmarks[12]) {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    );
    bodyGroup.rotation.z = shoulderAngle;
  }
}

/**
 * Validate AR browser support
 */
export function checkARSupport(): {
  supported: boolean;
  camera: boolean;
  webgl: boolean;
  message: string;
} {
  const hasCamera =
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  const hasWebGL = !!document.createElement('canvas').getContext('webgl2');

  return {
    supported: hasCamera && hasWebGL,
    camera: !!hasCamera,
    webgl: hasWebGL,
    message: !hasCamera
      ? 'Camera access not available'
      : !hasWebGL
        ? 'WebGL 2.0 not supported'
        : 'AR is supported',
  };
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
}

/**
 * Convert canvas to image data for clothing visualization
 */
export function canvasToImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context from canvas');
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Apply clothing opacity
 */
export function setClothingOpacity(
  clothingMesh: THREE.Mesh,
  opacity: number
): void {
  if (clothingMesh.material instanceof THREE.MeshPhongMaterial) {
    clothingMesh.material.opacity = opacity;
    clothingMesh.material.transparent = opacity < 1;
  }
}

/**
 * Set background color
 */
export function setSceneBackground(scene: THREE.Scene, color: string): void {
  scene.background = new THREE.Color(color);
}
