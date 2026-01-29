# Virtual Try-On Upload Settings Report

## Body Photo Upload Settings

### Recommended Dimensions
- **Height**: 2048px (recommended)
- **Width**: Full-body width (maintains aspect ratio)
- **Aspect Ratio**: Portrait orientation preferred

### Validation Rules
- **Max File Size**: 50MB hard limit
- **Warning Threshold**: 10MB (will show warning to user)
- **Supported Formats**: PNG, JPG, WebP (backend validates)
- **Auto-Resize**: Images larger than 1024px auto-resized to 1024px max dimension

### Processing
- Browser-side: Dimension check only (5 second timeout for WebP compatibility)
- Backend: Full format validation and conversion to JPEG
- Quality: 95% JPEG quality maintained

### User Guidelines
- Full-body shot, standing straight, facing forward
- Simple background recommended
- Clear lighting for best results

---

## Clothing Image Upload Settings

### Recommended Dimensions
- **Width/Height**: 1024px (recommended)
- **Aspect Ratio**: Square or portrait preferred
- **Visibility**: Entire item must be visible

### Validation Rules
- **Max File Size**: 50MB hard limit
- **Warning Threshold**: 10MB (will show warning to user)
- **Supported Formats**: PNG, JPG, WebP (backend validates)
- **Auto-Resize**: Handled by backend if needed

### Processing
- Browser-side: File size check only (no dimension validation to avoid WebP issues)
- Backend: Full format validation, conversion to JPEG, cropping for single garments
- Quality: 95% JPEG quality maintained

### User Guidelines
- Clear front view on white/solid background
- Well-lit, entire item visible
- Dress, top, or bottom - clear front view on solid background

---

## Try-On Settings

### Clothing Type Options
1. **Top** (upper): Shirt, jacket, etc.
2. **Bottom** (lower): Pants, skirt, etc.
3. **Full Dress** (full): One piece dresses
4. **Top & Bottom** (combo): Two piece combinations

### Processing Parameters
- **HD Mode**: Enabled by default for better quality
- **Polling Timeout**: 150 seconds (2.5 minutes max)
- **Polling Interval**: 2 seconds between status checks
- **Progress Tracking**: Real-time progress from 0-100%

### Test Mode
- **Enabled**: Toggle button visible to all authenticated users
- **Credit Deduction**: Skipped when Test Mode is active
- **Confirmation**: Green banner shows "✓ Test Mode Active - Credits will not be deducted"

### Image Processing Pipeline
1. **Frontend Validation**
   - File size check (50MB limit)
   - Dimension check for model photo (auto-resize if > 1024px)
   - Preview generation

2. **Backend Processing**
   - Image format validation (JPEG, PNG, WebP)
   - Conversion to JPEG if needed
   - For single garments (top/lower): Automatic cropping
   - For combo mode: Sends both upper and lower images
   - For full dress: Sends as single image with cloth_type: "full"

3. **Fitroom API Integration**
   - Multipart form-data upload
   - Automatic image optimization
   - Task creation with HD mode enabled

### Error Handling
- Model image required validation
- Clothing image required validation
- Credit check (skipped in test mode)
- HTTP error responses with descriptive messages
- Automatic retry logic for failed uploads

### Success Response
```json
{
  "success": true,
  "taskId": "task_id_string",
  "status": "CREATED"
}
```

### Polling Response
- **Status**: CREATED, PROCESSING, COMPLETED, FAILED
- **Result**: Image URL when completed
- **Error**: Error message if failed

---

## Boutique Dashboard Try-On Settings

### Identical Configuration
- Uses same VirtualTryOnUpload component as Customer Dashboard
- All settings and validation rules are identical
- Test Mode available with same functionality
- All 4 clothing types supported

### Access
- Route: `/boutique-dashboard`
- Authentication: Required (boutique owner login)
- Feature Parity: 100% with Customer Dashboard

---

## Performance Optimization

### Image Compression
- Model photos: Auto-resized to 1024px if larger
- Clothing images: Backend handles resizing
- JPEG quality: 95% (balances quality and file size)

### Polling Strategy
- Interval: 2 seconds (responsive without excessive API calls)
- Timeout: 150 seconds (handles HD mode processing time)
- Graceful degradation: Shows progress even if exact status unavailable

### Rate Limiting
- Upload endpoint: Rate limited to prevent abuse
- Polling endpoint: Standard rate limiting applied
- Test mode: Same rate limits apply

---

## Troubleshooting

### "Model image is required"
- Check that body photo was uploaded
- Verify file is not corrupted
- Try a different image format

### "Clothing image is required"
- Check that clothing image was uploaded
- Verify file is not corrupted
- Ensure correct clothing type is selected

### "Insufficient credits"
- Purchase more credits via "Buy More Credits" button
- Or enable Test Mode to generate try-ons without credits

### Image not loading
- Check file size (max 50MB)
- Verify image format (PNG, JPG, WebP)
- Try uploading a different image

### Try-on takes too long
- Normal processing time: 5-30 seconds
- Max wait time: 2.5 minutes (150 seconds)
- If timeout occurs, try again with smaller images

---

## Summary

✅ **Body Photo**: 2048px recommended, auto-resized to 1024px max
✅ **Clothing Image**: 1024px recommended, backend handles resizing
✅ **4 Clothing Types**: Top, Bottom, Full Dress, Top & Bottom
✅ **Test Mode**: Available, skips credit deduction
✅ **HD Mode**: Enabled by default
✅ **Boutique Dashboard**: Identical settings and functionality
