# AR Integration Guide for StyleSwap

## Overview

This document provides a comprehensive guide to the AR (Augmented Reality) Integration feature added to StyleSwap. The AR system enables real-time body tracking and 3D clothing visualization for an immersive virtual try-on experience.

## Features

### 1. **Real-Time Body Tracking**
- Uses MediaPipe Pose Landmarker for accurate body pose detection
- Detects 33 body landmarks in real-time
- Supports video stream processing
- Automatic pose visualization with skeleton overlay

### 2. **3D Body Model**
- Three.js-based 3D body representation
- Realistic body proportions
- Customizable body scale
- Automatic rotation when no pose data available

### 3. **3D Clothing Visualization**
- Support for multiple clothing types (shirt, pants, dress)
- Texture mapping from uploaded images
- Adjustable clothing opacity
- Real-time clothing positioning based on body pose

### 4. **AR Settings Control**
- Body tracking toggle
- Clothing visualization toggle
- Clothing opacity adjustment (0-100%)
- Body model scale adjustment (50-200%)
- Lighting intensity control (50-200%)
- Background color customization

### 5. **User Actions**
- Screenshot capture of AR try-on results
- Share results on social media
- Reset to default settings
- Real-time camera feed display

## Technical Architecture

### Components

#### 1. **ARCamera.tsx**
- Handles video stream capture from user's camera
- Integrates MediaPipe Pose Landmarker
- Displays live pose visualization with skeleton overlay
- Manages camera permissions and error handling

**Props:**
```typescript
interface ARCameraProps {
  onPoseDetected?: (poseData: PoseData) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}
```

#### 2. **AR3DScene.tsx**
- Renders 3D scene using Three.js
- Creates and manages 3D body model
- Loads and displays clothing models
- Handles scene lighting and rendering

**Props:**
```typescript
interface AR3DSceneProps {
  poseData?: PoseData;
  clothingImageUrl?: string;
  clothingType?: 'shirt' | 'pants' | 'dress';
  arSettings?: Partial<ARSettings>;
  onError?: (error: string) => void;
}
```

#### 3. **ARSettings.tsx**
- Provides UI controls for AR parameters
- Real-time settings adjustment
- Visual feedback for current settings
- Reset to defaults functionality

**Props:**
```typescript
interface ARSettingsControlProps {
  settings: ARSettings;
  onSettingsChange: (settings: ARSettings) => void;
  onReset?: () => void;
}
```

#### 4. **ARTryOn.tsx (Page)**
- Main AR experience page
- Integrates all AR components
- Manages state and user interactions
- Handles clothing upload and file validation

### Utilities

#### **arUtils.ts**
Core utility functions for AR functionality:

```typescript
// Initialize MediaPipe Pose Landmarker
initializePoseLandmarker(): Promise<PoseLandmarker>

// Detect body pose from video
detectPose(poseLandmarker, videoElement): PoseData | null

// Create 3D body model
create3DBodyModel(scene, scale): THREE.Group

// Create 3D clothing model
create3DClothingModel(scene, imageUrl, clothingType): Promise<THREE.Mesh>

// Setup scene lighting
setupSceneLighting(scene, intensity): void

// Update body model from pose
updateBodyModelFromPose(bodyGroup, poseData, videoWidth, videoHeight): void

// Check AR browser support
checkARSupport(): { supported, camera, webgl, message }

// Request camera permission
requestCameraPermission(): Promise<boolean>

// Set clothing opacity
setClothingOpacity(clothingMesh, opacity): void

// Set scene background
setSceneBackground(scene, color): void
```

## Data Structures

### PoseData
```typescript
interface PoseData {
  landmarks: BodyLandmark[];        // 33 body landmarks
  worldLandmarks: BodyLandmark[];   // 3D world coordinates
  segmentationMask?: ImageData;     // Optional segmentation mask
  timestamp: number;                 // Detection timestamp
}
```

### BodyLandmark
```typescript
interface BodyLandmark {
  x: number;          // X coordinate (0-1)
  y: number;          // Y coordinate (0-1)
  z: number;          // Z coordinate (depth)
  visibility?: number; // Visibility score (0-1)
}
```

### ARSettings
```typescript
interface ARSettings {
  enableBodyTracking: boolean;           // Enable pose detection
  enableClothingVisualization: boolean;  // Show clothing
  clothingOpacity: number;               // 0-1 opacity value
  bodyModelScale: number;                // Scale multiplier
  lightingIntensity: number;             // Lighting brightness
  backgroundColor: string;               // Hex color code
}
```

## Browser Requirements

### Required Features
- **Camera Access**: `navigator.mediaDevices.getUserMedia()`
- **WebGL 2.0**: For 3D rendering with Three.js
- **Modern JavaScript**: ES2020+ support

### Supported Browsers
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14.1+
- Edge 90+

### System Requirements
- Minimum 4GB RAM
- Dual-core processor
- Good internet connection (for model downloads)
- Webcam or built-in camera

## Usage

### Basic Integration

```typescript
import { ARTryOn } from '@/pages/ARTryOn';

export default function App() {
  return <ARTryOn />;
}
```

### Adding to Navigation

1. Update `client/src/App.tsx`:
```typescript
import ARTryOn from '@/pages/ARTryOn';

// Add to router
<Route path="/ar-tryon" component={ARTryOn} />
```

2. Add navigation link:
```typescript
<Link href="/ar-tryon">
  <Button>Try AR</Button>
</Link>
```

## Performance Optimization

### 1. **Model Caching**
- MediaPipe models are cached by browser
- First load takes 2-3 seconds
- Subsequent loads are instant

### 2. **Frame Rate**
- Pose detection: 30 FPS (mobile-optimized)
- 3D rendering: 60 FPS (desktop)
- Adaptive frame rate based on device performance

### 3. **Memory Management**
- Automatic cleanup on component unmount
- Canvas disposal after use
- Stream track termination

### 4. **Network Optimization**
- CDN-hosted MediaPipe models
- Lazy loading of Three.js
- Minimal bundle size impact

## Error Handling

### Common Issues

#### 1. **Camera Permission Denied**
```
Error: Camera permission denied
Solution: User must grant camera permission in browser settings
```

#### 2. **WebGL Not Supported**
```
Error: WebGL 2.0 not supported
Solution: Use a modern browser or update GPU drivers
```

#### 3. **Poor Lighting**
```
Issue: Pose detection fails in low light
Solution: Improve lighting conditions or use external light source
```

#### 4. **Large Clothing Image**
```
Error: Image size must be less than 5MB
Solution: Compress or resize image before uploading
```

## Security Considerations

### 1. **Privacy**
- Camera stream stays local (no server upload)
- Pose data processed client-side
- No personal data stored

### 2. **Permissions**
- Explicit camera permission required
- HTTPS required for camera access
- User can revoke permission anytime

### 3. **Data Handling**
- No pose data sent to server
- Screenshots are user-controlled
- Sharing requires explicit user action

## Testing

### Unit Tests
```bash
# Run AR component tests
pnpm test -- ARCamera.tsx
pnpm test -- AR3DScene.tsx
pnpm test -- ARSettings.tsx
```

### Manual Testing Checklist
- [ ] Camera permission flow
- [ ] Pose detection accuracy
- [ ] 3D model rendering
- [ ] Clothing upload and display
- [ ] Settings adjustments
- [ ] Screenshot capture
- [ ] Share functionality
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Performance on low-end devices

## Deployment Considerations

### 1. **HTTPS Requirement**
- Camera access requires HTTPS
- Self-signed certificates won't work
- Use valid SSL certificate

### 2. **CDN Configuration**
- MediaPipe models hosted on CDN
- Ensure CDN is accessible in target regions
- Consider regional CDN mirrors

### 3. **Browser Compatibility**
- Test on target browsers
- Provide fallback UI for unsupported browsers
- Consider progressive enhancement

### 4. **Performance Monitoring**
- Monitor pose detection latency
- Track 3D rendering frame rate
- Alert on camera access failures

## Future Enhancements

### Phase 2 Features
1. **Multi-Person Tracking**: Support multiple people in frame
2. **Gesture Recognition**: Hand gestures for UI control
3. **Advanced Lighting**: Realistic lighting simulation
4. **Animation**: Clothing movement and physics
5. **AR Filters**: Beauty and style filters

### Phase 3 Features
1. **Mobile AR**: Native AR using ARKit/ARCore
2. **Social Integration**: Direct social media posting
3. **Size Recommendation**: AI-powered size suggestions
4. **Outfit Combinations**: Mix and match clothing
5. **Analytics**: Usage and conversion tracking

## Troubleshooting

### AR Not Initializing
1. Check browser console for errors
2. Verify camera is connected
3. Check browser permissions
4. Try different browser
5. Restart browser and try again

### Poor Pose Detection
1. Improve lighting conditions
2. Wear contrasting colors
3. Stand at proper distance (3-4 feet)
4. Ensure full body is visible
5. Reduce background clutter

### 3D Model Not Rendering
1. Check WebGL support
2. Update graphics drivers
3. Try different browser
4. Reduce scene complexity
5. Check browser console for errors

### Clothing Not Displaying
1. Verify image upload was successful
2. Check image format (PNG, JPG, WebP)
3. Verify image size is under 5MB
4. Try different clothing type
5. Check browser console for errors

## Support and Resources

### Documentation
- [MediaPipe Pose Documentation](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Specification](https://www.khronos.org/webgl/)

### Community
- GitHub Issues: Report bugs and feature requests
- Stack Overflow: Ask technical questions
- Discord: Community discussions

## License

AR Integration uses:
- MediaPipe (Apache 2.0)
- Three.js (MIT)
- React (MIT)

## Changelog

### Version 1.0.0 (Initial Release)
- Real-time body tracking with MediaPipe
- 3D body model with Three.js
- Clothing visualization
- AR settings control
- Screenshot and share functionality
- Comprehensive error handling
- Mobile-responsive design

---

**Last Updated**: February 6, 2026
**Maintained By**: StyleSwap Development Team
