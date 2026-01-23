# Fitroom API Error Reproduction Guide

**Issue:** StyleSwap virtual try-on feature failing due to Fitroom API integration issue  
**Status:** Awaiting SnapEdit/SilverAI support response  
**Date:** January 22, 2026

---

## 1. cURL Command for Try-On Upload

### Basic cURL Request (with authentication)

```bash
# Step 1: Get your session cookie by logging in first
# Then use it in the try-on request

curl -X POST "https://3000-ipeels473f1mvs316pezc-27f880b1.us1.manus.computer/api/tryon/upload" \
  -H "Content-Type: multipart/form-data" \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE" \
  -F "modelImage=@/path/to/model-image.jpg" \
  -F "clothImage=@/path/to/cloth-image.jpg" \
  -v
```

### cURL with Verbose Output (for debugging)

```bash
curl -X POST "https://3000-ipeels473f1mvs316pezc-27f880b1.us1.manus.computer/api/tryon/upload" \
  -H "Content-Type: multipart/form-data" \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE" \
  -F "modelImage=@/path/to/model-image.jpg" \
  -F "clothImage=@/path/to/cloth-image.jpg" \
  --verbose \
  --trace-ascii /tmp/curl-trace.txt
```

### Expected Success Response

```json
{
  "success": true,
  "taskId": "task_1234567890",
  "status": "CREATED",
  "estimatedTime": 15
}
```

### Typical Error Response

```json
{
  "success": false,
  "error": "Failed to create try-on task",
  "details": "Fitroom API error response"
}
```

---

## 2. Fitroom API Endpoint Details

### API Configuration

| Parameter | Value |
|-----------|-------|
| **Base URL** | https://platform.fitroom.app |
| **Endpoint** | POST /api/tryon/v2/tasks |
| **Authentication** | X-API-KEY header |
| **Content-Type** | application/json |
| **Timeout** | 30 seconds |

### Request Payload Structure

```json
{
  "model_image": "BASE64_ENCODED_IMAGE_STRING",
  "cloth_image": "BASE64_ENCODED_IMAGE_STRING",
  "cloth_type": "single|combo|upper|lower|dress",
  "hd_mode": true,
  "lower_cloth_image": "BASE64_ENCODED_IMAGE_STRING (optional for combo)"
}
```

### Image Requirements

| Requirement | Specification |
|-------------|----------------|
| **Format** | PNG, JPG, JPEG, GIF, WebP |
| **Max Size** | 50 MB per file |
| **Encoding** | Base64 (UTF-8) |
| **Model Image** | Full-body photo of person |
| **Cloth Image** | Clothing item to try on |
| **Cloth Types** | single, combo, upper, lower, dress |

---

## 3. Error Scenarios and Solutions

### Error 1: Authentication Failed (401)

**Symptom:** `[Fitroom] ERROR - Response status: 401`

**Cause:** Invalid or missing API key

**Solution:**
```bash
# Verify API key is set in environment
echo $FITROOM_API_KEY

# Check if API key is being passed correctly
curl -X POST "https://platform.fitroom.app/api/tryon/v2/tasks" \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model_image":"test","cloth_image":"test","cloth_type":"single"}' \
  -v
```

### Error 2: Invalid Image Format (400)

**Symptom:** `[Fitroom] ERROR - Response status: 400`

**Cause:** Image format not supported or base64 encoding issue

**Solution:**
```bash
# Test with a valid image file
# Ensure image is in supported format (PNG, JPG)
file /path/to/image.jpg

# Verify base64 encoding
base64 /path/to/image.jpg | head -c 100

# Check base64 string length (should be ~1.33x original size)
base64 /path/to/image.jpg | wc -c
```

### Error 3: Rate Limiting (429)

**Symptom:** `[Fitroom] ERROR - Response status: 429`

**Cause:** Too many requests to Fitroom API

**Solution:**
```bash
# Wait before retrying (Fitroom typically allows 10 requests per minute)
sleep 60

# Then retry the request
curl -X POST "https://platform.fitroom.app/api/tryon/v2/tasks" \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @payload.json
```

### Error 4: No Task ID in Response

**Symptom:** `[Fitroom] ERROR - No task ID in response`

**Cause:** Fitroom API response format changed or unexpected response structure

**Solution:**
```bash
# Log the full response to understand structure
curl -X POST "https://platform.fitroom.app/api/tryon/v2/tasks" \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @payload.json \
  | jq '.' > /tmp/fitroom-response.json

# Check response structure
cat /tmp/fitroom-response.json
```

---

## 4. Server-Side Implementation Details

### Try-On Upload Endpoint

**Location:** `server/_core/index.ts` (Line 84)

```typescript
app.post("/api/tryon/upload", createUploadRateLimiter(), upload.fields([
  { name: "modelImage", maxCount: 1 },
  { name: "clothImage", maxCount: 1 }
]), async (req, res) => {
  // 1. Authenticate user
  const user = await sdk.authenticateRequest(req);
  
  // 2. Check credits
  const credits = await getUserCredits(user.id);
  if (credits < 1) {
    return res.status(402).json({ error: "Insufficient credits" });
  }
  
  // 3. Convert images to base64
  const modelImageBase64 = file.toString('base64');
  const clothImageBase64 = file.toString('base64');
  
  // 4. Call Fitroom API
  const fitroomClient = getFitroomClient();
  const taskResult = await fitroomClient.createTryOnWithBase64({
    modelImageBase64,
    clothImageBase64,
    clothType: "single",
    hdMode: true
  });
  
  // 5. Handle response
  if (!taskResult.success) {
    return res.status(500).json({ error: taskResult.error });
  }
  
  // 6. Save task to database
  await db.insert(tryOnTasks).values({
    userId: user.id,
    taskId: taskResult.taskId,
    status: "PENDING",
    createdAt: new Date()
  });
  
  return res.json({ success: true, taskId: taskResult.taskId });
});
```

### Fitroom Client Implementation

**Location:** `server/_core/fitroom.ts` (Line 81)

```typescript
async createTryOnWithBase64(request: FitroomTryOnBase64Request): Promise<FitroomTryOnResponse> {
  try {
    // 1. Prepare payload
    const payload = {
      model_image: request.modelImageBase64,
      cloth_image: request.clothImageBase64,
      cloth_type: request.clothType,
    };
    
    // 2. Send to Fitroom API
    const response = await this.client.post("/api/tryon/v2/tasks", payload, {
      headers: { "Content-Type": "application/json" },
    });
    
    // 3. Extract task ID
    const taskId = response.data.task_id || response.data.taskId;
    
    // 4. Return success
    return {
      success: true,
      taskId,
      status: response.data.status || "CREATED"
    };
  } catch (error) {
    // Log detailed error information
    console.error("[Fitroom] ERROR:", error.response?.status, error.response?.data);
    
    return {
      success: false,
      error: extractErrorMessage(error)
    };
  }
}
```

---

## 5. Testing the Integration Locally

### Test Script (Node.js)

```javascript
// test-fitroom.js
const axios = require('axios');
const fs = require('fs');

const FITROOM_API_KEY = process.env.FITROOM_API_KEY;
const FITROOM_BASE_URL = 'https://platform.fitroom.app';

async function testFitroomAPI() {
  try {
    // 1. Read test images
    const modelImage = fs.readFileSync('/path/to/model.jpg');
    const clothImage = fs.readFileSync('/path/to/cloth.jpg');
    
    // 2. Convert to base64
    const modelBase64 = modelImage.toString('base64');
    const clothBase64 = clothImage.toString('base64');
    
    console.log('Model image base64 size:', modelBase64.length);
    console.log('Cloth image base64 size:', clothBase64.length);
    
    // 3. Create axios instance
    const client = axios.create({
      baseURL: FITROOM_BASE_URL,
      headers: {
        'X-API-KEY': FITROOM_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    // 4. Send request
    console.log('Sending request to Fitroom API...');
    const response = await client.post('/api/tryon/v2/tasks', {
      model_image: modelBase64,
      cloth_image: clothBase64,
      cloth_type: 'single',
      hd_mode: true
    });
    
    console.log('SUCCESS!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('Task ID:', response.data.task_id || response.data.taskId);
    
  } catch (error) {
    console.error('ERROR!');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testFitroomAPI();
```

**Run the test:**
```bash
node test-fitroom.js
```

---

## 6. Debugging Steps

### Step 1: Check Environment Variables

```bash
# Verify API key is set
echo "FITROOM_API_KEY: $FITROOM_API_KEY"
echo "FITROOM_API_KEY length: ${#FITROOM_API_KEY}"

# Verify base URL
echo "FITROOM_BASE_URL: $FITROOM_BASE_URL"
```

### Step 2: Test API Connectivity

```bash
# Test basic connectivity to Fitroom
curl -I https://platform.fitroom.app

# Test with API key
curl -X GET https://platform.fitroom.app/api/health \
  -H "X-API-KEY: YOUR_API_KEY"
```

### Step 3: Check Server Logs

```bash
# View recent server logs
cd /home/ubuntu/fitroom-ai-research
tail -100 server-logs.txt | grep -i "fitroom\|tryon\|error"

# Or check console output
npm run dev 2>&1 | grep -i "fitroom"
```

### Step 4: Enable Verbose Logging

```typescript
// In server/_core/fitroom.ts, enable detailed logging
console.log("[Fitroom] Request payload:", JSON.stringify(payload, null, 2));
console.log("[Fitroom] Request headers:", this.client.defaults.headers);
console.log("[Fitroom] Full error:", JSON.stringify(error, null, 2));
```

---

## 7. Support Ticket Information for SnapEdit

### Summary for SnapEdit Support

**Issue Title:** Fitroom API Integration Failing - Virtual Try-On Feature Broken

**Description:**
StyleSwap's virtual try-on feature is unable to create try-on tasks with the Fitroom API. The integration appears to be correctly configured, but requests to `POST /api/tryon/v2/tasks` are failing.

**Technical Details:**
- **API Endpoint:** https://platform.fitroom.app/api/tryon/v2/tasks
- **Request Method:** POST
- **Content-Type:** application/json
- **Authentication:** X-API-KEY header
- **Payload:** Base64-encoded images with cloth_type parameter

**Current Error:**
```
[Fitroom] ERROR - Failed to create try-on task
[Fitroom] ERROR - Response status: [STATUS_CODE]
[Fitroom] ERROR - Response data: [ERROR_DATA]
```

**Impact:**
- 100% of virtual try-on requests failing
- Users cannot upload images or generate try-ons
- Platform feature completely unavailable

**Requested Information from SnapEdit:**
1. Confirm API endpoint is correct and accessible
2. Verify API key is valid and has proper permissions
3. Check if there are any rate limiting or quota issues
4. Confirm expected request/response format
5. Provide any recent API changes or deprecations

---

## 8. Next Steps

1. **Send this document to SnapEdit support** with the cURL commands and error details
2. **Include the screenshot** of the try-on error from the browser
3. **Provide server logs** showing the Fitroom API error responses
4. **Wait for SnapEdit response** confirming API status and any required changes
5. **Once resolved**, update the Fitroom client with any API changes

---

**Document Version:** 1.0  
**Prepared By:** Manus AI  
**Last Updated:** January 22, 2026  
**Status:** Ready for SnapEdit Support Escalation
