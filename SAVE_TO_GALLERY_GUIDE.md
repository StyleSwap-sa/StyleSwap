# Save Try-On Results to Gallery - Feature Guide

## Overview

The **Save to Gallery** feature allows users to download and save their virtual try-on results directly to their device's photo gallery. This feature works seamlessly on both mobile and desktop devices, supporting multiple image formats and providing a smooth user experience with loading states and error handling.

## Features

✅ **Multi-Platform Support** - Works on iOS, Android, Windows, Mac, and Linux
✅ **Multiple Image Formats** - PNG (lossless) and JPEG (compressed)
✅ **Custom Filenames** - Users can customize the filename for saved images
✅ **Loading States** - Visual feedback during save operation
✅ **Error Handling** - Comprehensive error messages and retry functionality
✅ **Success Feedback** - Confirmation message when image is saved
✅ **Responsive Design** - Works on all screen sizes
✅ **Accessibility** - Keyboard navigable and screen reader friendly

## How It Works

### For Users

1. **Complete a Virtual Try-On** - Generate a try-on result using the StyleSwap platform
2. **Click "Save to Gallery"** - Button appears below the try-on result image
3. **Customize Settings** (Optional)
   - Enter custom filename (default: `StyleSwap-TryOn-[timestamp]`)
   - Choose format: PNG (high quality) or JPEG (smaller file size)
4. **Click Save** - Image downloads to device gallery
5. **Confirmation** - "Saved to Gallery!" message appears

### For Developers

#### Using the SaveToGalleryButton Component

```tsx
import { SaveToGalleryButton } from '@/components/SaveToGalleryButton';

export function MyComponent() {
  return (
    <SaveToGalleryButton
      imageUrl="https://example.com/tryon-result.jpg"
      variant="default"
      size="default"
      onSuccess={() => console.log('Image saved!')}
      onError={(error) => console.error('Save failed:', error)}
    />
  );
}
```

#### Using the Custom Hook

```tsx
import { useSaveToGallery } from '@/hooks/useSaveToGallery';

export function MyComponent() {
  const { isSaving, isSuccess, error, saveImage, reset } = useSaveToGallery();

  const handleSave = async () => {
    await saveImage('https://example.com/image.jpg', {
      filename: 'my-tryon.png',
      format: 'png',
    });
  };

  return (
    <div>
      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </button>
      {isSuccess && <p>Saved successfully!</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

#### Using Utility Functions Directly

```tsx
import {
  saveCanvasToGallery,
  saveImageToGallery,
  generateFilename,
} from '@/lib/saveToGallery';

// Save from canvas
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
await saveCanvasToGallery(canvas, {
  filename: generateFilename('MyImage', 'png'),
  format: 'png',
  quality: 0.95,
});

// Save from image URL
await saveImageToGallery('https://example.com/image.jpg', {
  filename: 'my-image.jpg',
});
```

## API Reference

### SaveToGalleryButton Component

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageUrl` | `string` | - | URL of the image to save |
| `canvas` | `HTMLCanvasElement` | - | Canvas element to save |
| `element` | `HTMLElement` | - | HTML element containing image/canvas |
| `onSuccess` | `() => void` | - | Callback when save succeeds |
| `onError` | `(error: string) => void` | - | Callback when save fails |
| `variant` | `'default' \| 'outline' \| 'ghost'` | `'default'` | Button style variant |
| `size` | `'default' \| 'sm' \| 'lg'` | `'default'` | Button size |
| `className` | `string` | `''` | Additional CSS classes |

### useSaveToGallery Hook

**Returns:**

```typescript
{
  isSaving: boolean;           // True while saving
  isSuccess: boolean;          // True after successful save
  error: string | null;        // Error message if save failed
  saveCanvas: (canvas, options?) => Promise<void>;
  saveImage: (url, options?) => Promise<void>;
  saveElement: (element, options?) => Promise<void>;
  reset: () => void;           // Reset state
}
```

### Utility Functions

#### `saveCanvasToGallery(canvas, options)`

Saves a canvas element to gallery.

**Parameters:**
- `canvas` (HTMLCanvasElement): The canvas to save
- `options` (SaveOptions, optional):
  - `filename`: Custom filename (default: auto-generated)
  - `format`: 'png' or 'jpeg' (default: 'png')
  - `quality`: 0-1, only for JPEG (default: 0.95)

#### `saveImageToGallery(imageUrl, options)`

Saves an image from URL to gallery.

**Parameters:**
- `imageUrl` (string): URL of the image
- `options` (SaveOptions, optional): Same as above

#### `saveElementToGallery(element, options)`

Saves image/canvas from HTML element to gallery.

**Parameters:**
- `element` (HTMLElement): Element containing image or canvas
- `options` (SaveOptions, optional): Same as above

#### `generateFilename(prefix, format)`

Generates a filename with timestamp.

**Parameters:**
- `prefix` (string, optional): Filename prefix (default: 'StyleSwap')
- `format` ('png' | 'jpeg', optional): File format (default: 'png')

**Returns:** String like `StyleSwap-2024-01-15T10-30-45.png`

#### `copyImageToClipboard(blob)`

Copies image to clipboard (for sharing).

**Parameters:**
- `blob` (Blob): Image blob to copy

#### `shareImage(blob, filename, title)`

Shares image using Web Share API (mobile).

**Parameters:**
- `blob` (Blob): Image blob
- `filename` (string): Filename for sharing
- `title` (string, optional): Share title

## Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Edge | ✅ | ✅ |
| Opera | ✅ | ✅ |
| IE 11 | ❌ | - |

## File Size Limits

- **Maximum file size**: 10 MB
- **Recommended size**: 2-5 MB
- **PNG**: Typically 3-8 MB (lossless)
- **JPEG**: Typically 1-3 MB (compressed)

## Troubleshooting

### Image Won't Save

**Problem**: "Failed to save image" error

**Solutions**:
1. Check internet connection
2. Verify image URL is accessible
3. Try a different format (PNG vs JPEG)
4. Check browser console for detailed errors
5. Try a different browser

### File Size Too Large

**Problem**: "Image size exceeds maximum" error

**Solutions**:
1. Use JPEG format instead of PNG
2. Reduce image dimensions before saving
3. Compress image using external tool first

### Browser Not Supported

**Problem**: Save button doesn't work

**Solutions**:
1. Update to latest browser version
2. Use a different browser (Chrome, Firefox, Safari)
3. Check if browser has download permissions enabled

## Performance Considerations

- **Canvas to Blob**: ~50-200ms depending on size
- **Image Download**: Depends on file size and connection
- **Total Operation**: Usually completes within 1-2 seconds

## Security & Privacy

✅ **No Server Upload**: Images saved locally only
✅ **No Tracking**: No analytics on saved images
✅ **User Control**: Users choose what to save
✅ **HTTPS Only**: Secure image transmission
✅ **No Caching**: Images not stored on server

## Integration Examples

### Example 1: Virtual Try-On Page

```tsx
import { SaveToGalleryButton } from '@/components/SaveToGalleryButton';

export function VirtualTryOnResult({ resultImage }) {
  return (
    <div className="result-container">
      <img src={resultImage} alt="Try-on result" />
      <SaveToGalleryButton
        imageUrl={resultImage}
        onSuccess={() => showToast('Image saved!')}
        onError={(error) => showToast(`Error: ${error}`)}
      />
    </div>
  );
}
```

### Example 2: Gallery with Multiple Save Options

```tsx
import { SaveToGalleryButton } from '@/components/SaveToGalleryButton';

export function TryOnGallery({ images }) {
  return (
    <div className="gallery">
      {images.map((image) => (
        <div key={image.id} className="gallery-item">
          <img src={image.url} alt={image.name} />
          <SaveToGalleryButton
            imageUrl={image.url}
            variant="outline"
            size="sm"
          />
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Canvas-Based Saving

```tsx
import { useSaveToGallery } from '@/hooks/useSaveToGallery';

export function CanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { saveCanvas, isSaving } = useSaveToGallery();

  const handleSave = async () => {
    if (canvasRef.current) {
      await saveCanvas(canvasRef.current, {
        filename: 'my-design.png',
        format: 'png',
      });
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} />
      <button onClick={handleSave} disabled={isSaving}>
        Save Design
      </button>
    </div>
  );
}
```

## Future Enhancements

- [ ] Batch save multiple images
- [ ] Cloud storage integration (Google Drive, OneDrive)
- [ ] Social media direct sharing
- [ ] Image editing before saving
- [ ] Watermark options
- [ ] Metadata embedding (EXIF data)
- [ ] Scheduled automatic saves
- [ ] Save history/management

## Support

For issues or feature requests, please contact support or create an issue in the project repository.

---

**Last Updated**: 2024
**Version**: 1.0.0
