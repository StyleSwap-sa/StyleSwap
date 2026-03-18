# StyleSwap - Architecture Migration Plan

## Current Status: Manus → Independent Infrastructure

You're transitioning StyleSwap from Manus-managed infrastructure to a fully independent, self-hosted architecture.

---

## Architecture Overview

### Before (Manus)
```
Frontend (React) → Manus Vite Server
Backend (Express) → Manus Node Runtime
Database → MySQL (Manus-managed)
Storage → Manus S3 Proxy
Auth → Manus OAuth
Payments → Yoco (via Manus)
AI → Manus LLM/Image Gen APIs
```

### After (Independent)
```
Frontend (Next.js) → Vercel
Backend (Express) → Render
Database → PostgreSQL (Render)
Storage → AWS S3 (direct)
Auth → Custom JWT + Yoco
Payments → Yoco (direct)
AI → Fitroom API (direct)
```

---

## Migration Checklist

### Phase 1: Infrastructure Setup ✅
- [x] Create Render account & PostgreSQL database
- [x] Create Vercel account
- [x] Set up GitHub repository
- [x] Create `render.yaml` deployment config
- [x] Create deployment guide

### Phase 2: Code Adaptation (In Progress)
- [ ] Update database schema (MySQL → PostgreSQL)
- [ ] Update environment variables
- [ ] Remove Manus-specific code
- [ ] Update API endpoints
- [ ] Configure Yoco integration
- [ ] Configure Fitroom API integration

### Phase 3: Testing
- [ ] Test backend on Render
- [ ] Test frontend on Vercel
- [ ] Test database connection
- [ ] Test Yoco payments
- [ ] Test Fitroom try-ons
- [ ] Test file uploads to S3

### Phase 4: Data Migration
- [ ] Export user data from Manus
- [ ] Migrate to PostgreSQL
- [ ] Verify data integrity
- [ ] Test user authentication

### Phase 5: Deployment
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel
- [ ] Configure custom domain
- [ ] Set up monitoring
- [ ] Go live

---

## Key Changes Required

### 1. Database Migration (MySQL → PostgreSQL)

**Schema Changes:**
```sql
-- PostgreSQL uses SERIAL for auto-increment (not AUTO_INCREMENT)
-- Timestamps use TIMESTAMP instead of DATETIME
-- ENUM types are different
-- JSON support is better in PostgreSQL (JSONB)
```

**Files to Update:**
- `drizzle/schema.ts` - Update to PostgreSQL syntax
- `server/db.ts` - Update connection logic
- Migrations - Regenerate for PostgreSQL

### 2. Environment Variables

**Remove (Manus-specific):**
- `BUILT_IN_FORGE_API_KEY`
- `BUILT_IN_FORGE_API_URL`
- `VITE_FRONTEND_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_URL`
- `OAUTH_SERVER_URL` (Manus OAuth)
- `VITE_OAUTH_PORTAL_URL`

**Add (Independent):**
- `YOCO_API_KEY`
- `YOCO_SECRET_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `JWT_SECRET` (for custom auth)

### 3. Authentication

**Before:** Manus OAuth → JWT session cookie
**After:** Custom JWT-based auth with Yoco user data

**Implementation:**
```typescript
// Create JWT from Yoco user
const token = await createJWT({
  userId: user.id,
  email: user.email,
  role: user.role
});

// Verify JWT on each request
const user = await verifyJWT(token);
```

### 4. File Storage

**Before:** `storagePut()` → Manus S3 proxy
**After:** Direct AWS S3 integration

**Implementation:**
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });
await s3.send(new PutObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET,
  Key: `uploads/${userId}/${filename}`,
  Body: fileBuffer,
  ContentType: mimeType
}));
```

### 5. Payments (Yoco)

**Already integrated in current codebase:**
- Yoco webhook handlers exist
- Payment processing logic exists
- Just need to add API credentials

### 6. AI/Try-ons (Fitroom API)

**Already integrated in current codebase:**
- Fitroom client exists
- Try-on logic exists
- Just need to ensure API key is set

---

## Implementation Order

### Week 1: Infrastructure & Setup
1. ✅ Create Render PostgreSQL database
2. ✅ Create Vercel project
3. ✅ Push code to GitHub
4. Create PostgreSQL schema
5. Update `render.yaml` with all env vars

### Week 2: Code Updates
6. Update Drizzle schema for PostgreSQL
7. Update database connection logic
8. Remove Manus API calls
9. Update authentication flow
10. Update file storage to use AWS S3 directly

### Week 3: Testing & Deployment
11. Test all integrations locally
12. Deploy backend to Render
13. Deploy frontend to Vercel
14. Test end-to-end flows
15. Migrate user data

### Week 4: Go Live
16. Configure custom domain
17. Set up monitoring
18. Monitor for issues
19. Announce launch

---

## Files Modified

### Core Changes
- `render.yaml` - ✅ Updated
- `RENDER_DEPLOYMENT_GUIDE.md` - ✅ Created
- `drizzle/schema.ts` - ⏳ Pending (PostgreSQL syntax)
- `server/db.ts` - ⏳ Pending (PostgreSQL connection)
- `server/_core/index.ts` - ⏳ Pending (remove Manus code)
- `server/_core/auth-clerk.ts` - ⏳ Pending (custom JWT)
- `server/storage.ts` - ⏳ Pending (AWS S3 direct)

### Configuration
- `.env.example` - ⏳ Pending (new env vars)
- `package.json` - ✅ Already has required deps

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Data loss during migration | Critical | Test migration in staging first |
| Authentication breaks | Critical | Implement JWT fallback |
| Payment processing fails | High | Test Yoco integration thoroughly |
| Downtime during migration | Medium | Use blue-green deployment |
| Performance issues | Medium | Monitor Render metrics |

---

## Success Criteria

- ✅ Backend deploys successfully to Render
- ✅ Frontend deploys successfully to Vercel
- ✅ Users can log in with JWT auth
- ✅ File uploads work to S3
- ✅ Yoco payments process correctly
- ✅ Fitroom try-ons work
- ✅ All user data migrated
- ✅ Zero downtime during migration

---

## Support & Resources

- **Render Docs:** https://render.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Drizzle ORM:** https://orm.drizzle.team/docs/postgresql
- **AWS S3:** https://docs.aws.amazon.com/s3/
- **Yoco API:** https://yoco.com/docs
- **Fitroom API:** Contact Fitroom support

---

## Next Steps

1. **Immediate:** Review this document and confirm architecture
2. **This week:** Set up PostgreSQL schema and test locally
3. **Next week:** Update code for PostgreSQL and AWS S3
4. **Week 3:** Deploy to staging and test
5. **Week 4:** Deploy to production

Ready to proceed? Let me know which phase you'd like to tackle first!
