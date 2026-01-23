# SnapEdit Support Ticket

**To:** SnapEdit Support Team  
**From:** Renelle Itumeleng Mofokeng (StyleSwap)  
**Subject:** Urgent: Fitroom API Integration Failing - Virtual Try-On Feature Broken  
**Priority:** Critical  
**Date:** January 22, 2026

---

## Issue Summary

StyleSwap's virtual try-on feature is completely non-functional due to failures in the Fitroom API integration. The platform cannot create try-on tasks, preventing users from uploading images and generating virtual try-ons.

**Impact:** 100% of virtual try-on functionality is unavailable  
**Affected Users:** All StyleSwap customers  
**Time to Resolution Needed:** ASAP (blocking launch)

---

## Technical Details

### API Endpoint Configuration

```
Base URL: https://platform.fitroom.app
Endpoint: POST /api/tryon/v2/tasks
Authentication: X-API-KEY header
Content-Type: application/json
Timeout: 30 seconds
```

### Request Format

```json
{
  "model_image": "BASE64_ENCODED_STRING",
  "cloth_image": "BASE64_ENCODED_STRING",
  "cloth_type": "single|combo|upper|lower|dress",
  "hd_mode": true,
  "lower_cloth_image": "BASE64_ENCODED_STRING (optional)"
}
```

### Expected Response Format

```json
{
  "task_id": "task_1234567890",
  "status": "CREATED",
  "progress": 0
}
```

---

## Error Information

### Error Logs

The server logs show the following error pattern:

```
[Fitroom] ERROR - Base64 try-on failed: [ERROR_MESSAGE]
[Fitroom] ERROR - Response status: [HTTP_STATUS]
[Fitroom] ERROR - Response data: [RESPONSE_BODY]
```

### Common Error Scenarios

1. **Authentication Failure (401)**
   - Indicates invalid or missing API key
   - Error: "Authentication failed. Please check API key."

2. **Invalid Request Format (400)**
   - Indicates image format or payload structure issue
   - Error: "Invalid image format or size"

3. **Rate Limiting (429)**
   - Indicates too many requests
   - Error: "Too many requests. Please wait and try again."

4. **No Task ID in Response**
   - Indicates unexpected response format
   - Error: "No task ID returned from Fitroom API"

---

## cURL Command for Testing

### Basic Test Command

```bash
curl -X POST "https://platform.fitroom.app/api/tryon/v2/tasks" \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model_image": "BASE64_ENCODED_IMAGE",
    "cloth_image": "BASE64_ENCODED_IMAGE",
    "cloth_type": "single",
    "hd_mode": true
  }' \
  -v
```

### Verbose Test Command (with full debugging)

```bash
curl -X POST "https://platform.fitroom.app/api/tryon/v2/tasks" \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @payload.json \
  --verbose \
  --trace-ascii /tmp/curl-trace.txt \
  --connect-timeout 10 \
  --max-time 30
```

---

## Questions for SnapEdit Support

1. **API Status:** Is the Fitroom API `/api/tryon/v2/tasks` endpoint currently operational and accepting requests?

2. **API Key:** Can you verify that our API key has the correct permissions for creating try-on tasks?

3. **Rate Limits:** What are the current rate limiting rules? (requests per minute/hour)

4. **API Changes:** Have there been any recent changes to:
   - Request payload format
   - Response format
   - Authentication method
   - Endpoint URL

5. **Image Requirements:** Can you confirm the image requirements:
   - Supported formats: PNG, JPG, JPEG, GIF, WebP
   - Max file size: 50 MB
   - Encoding: Base64 (UTF-8)

6. **Quota:** Are there any quota limits on the number of try-on tasks that can be created?

7. **Troubleshooting:** What debugging information would be most helpful?
   - Full request/response logs
   - Timing information
   - Server-side logs from Fitroom

---

## Screenshots and Logs

### User-Facing Error

[Screenshot showing the error message users see when attempting a try-on]

### Server Console Error

```
[2026-01-22T09:48:00.000Z] [Try-On Upload] Received request
[2026-01-22T09:48:00.100Z] [Try-On Upload] Authentication successful for user: user_123
[2026-01-22T09:48:01.000Z] [Fitroom] Creating try-on with base64 encoded images
[2026-01-22T09:48:01.100Z] [Fitroom] Model image base64 size: 1234567 bytes
[2026-01-22T09:48:01.200Z] [Fitroom] Cloth image base64 size: 987654 bytes
[2026-01-22T09:48:01.300Z] [Fitroom] Sending POST to /api/tryon/v2/tasks with base64 JSON payload
[2026-01-22T09:48:02.500Z] [Fitroom] ERROR - Base64 try-on failed: [ERROR_MESSAGE]
[2026-01-22T09:48:02.600Z] [Fitroom] ERROR - Response status: [HTTP_STATUS]
[2026-01-22T09:48:02.700Z] [Fitroom] ERROR - Response data: [RESPONSE_BODY]
```

---

## Implementation Details

### Server Implementation

**File:** `server/_core/index.ts` (Line 84)

The try-on upload endpoint receives multipart form data, converts images to base64, and forwards to Fitroom API:

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
  const modelImageBase64 = modelImageFile.toString('base64');
  const clothImageBase64 = clothImageFile.toString('base64');
  
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

**File:** `server/_core/fitroom.ts` (Line 81)

The Fitroom client handles API communication with detailed error logging:

```typescript
async createTryOnWithBase64(request: FitroomTryOnBase64Request): Promise<FitroomTryOnResponse> {
  try {
    const payload = {
      model_image: request.modelImageBase64,
      cloth_image: request.clothImageBase64,
      cloth_type: request.clothType,
    };
    
    if (request.hdMode) {
      (payload as any).hd_mode = true;
    }
    
    console.log("[Fitroom] Sending POST to /api/tryon/v2/tasks");
    
    const response = await this.client.post("/api/tryon/v2/tasks", payload, {
      headers: { "Content-Type": "application/json" },
    });
    
    const taskId = response.data.task_id || response.data.taskId;
    
    if (!taskId) {
      return { success: false, error: "No task ID returned" };
    }
    
    return {
      success: true,
      taskId,
      status: response.data.status || "CREATED"
    };
  } catch (error: any) {
    console.error("[Fitroom] ERROR - Response status:", error.response?.status);
    console.error("[Fitroom] ERROR - Response data:", error.response?.data);
    
    // Extract meaningful error message
    const errorMessage = extractErrorMessage(error);
    
    return { success: false, error: errorMessage };
  }
}
```

---

## Environment Configuration

### Required Environment Variables

```bash
FITROOM_API_KEY=your_api_key_here
FITROOM_BASE_URL=https://platform.fitroom.app
```

### Current Configuration Status

- ✅ Environment variables configured
- ✅ API key set and non-empty
- ✅ Base URL configured correctly
- ✅ HTTPS agent configured for SSL/TLS
- ✅ Timeout set to 30 seconds

---

## Reproduction Steps

1. **Log in** to StyleSwap as a customer
2. **Navigate** to the virtual try-on page
3. **Upload** a model image (full-body photo)
4. **Upload** a clothing image
5. **Click** "Generate Try-On"
6. **Observe** error message and server logs

---

## Expected vs. Actual Behavior

### Expected Behavior

1. User uploads images
2. Server converts to base64
3. Server sends to Fitroom API
4. Fitroom API returns task_id
5. Server saves task to database
6. User sees "Processing..." message
7. Try-on result appears when ready

### Actual Behavior

1. User uploads images ✅
2. Server converts to base64 ✅
3. Server sends to Fitroom API ✅
4. **Fitroom API returns error** ❌
5. Server returns error to user ❌
6. User sees error message ❌
7. No try-on generated ❌

---

## Business Impact

**Feature Status:** Non-functional (0% success rate)  
**Customer Impact:** Complete loss of core feature  
**Revenue Impact:** Cannot generate revenue from try-on credits  
**Launch Status:** Blocked until resolved  

---

## Requested Actions from SnapEdit

1. **Verify API Status** - Confirm endpoint is operational
2. **Check API Key** - Validate permissions and quota
3. **Review Logs** - Check Fitroom server logs for errors
4. **Confirm Format** - Verify request/response format is correct
5. **Provide Guidance** - Advise on any required changes
6. **Set Timeline** - Provide ETA for resolution

---

## Contact Information

**Primary Contact:** Renelle Itumeleng Mofokeng  
**Email:** renelle@styleswap.com  
**Phone:** [Your phone number]  
**Timezone:** GMT+2  
**Availability:** Available for urgent calls/messages

---

## Additional Resources

- **Full Documentation:** See `FITROOM_API_ERROR_REPRODUCTION.md`
- **Server Code:** `server/_core/fitroom.ts` and `server/_core/index.ts`
- **Test Script:** Available upon request
- **Error Logs:** Available upon request

---

## Escalation Path

If this issue is not resolved within 24 hours:

1. Escalate to SnapEdit/SilverAI CEO
2. Request emergency support from Fitroom team
3. Consider alternative virtual try-on providers
4. Delay platform launch until resolved

---

**Ticket Status:** OPEN - AWAITING RESPONSE  
**Priority:** CRITICAL  
**SLA:** 24-hour response time required

