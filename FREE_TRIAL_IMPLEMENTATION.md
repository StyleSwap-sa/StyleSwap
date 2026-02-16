# StyleSwap Free Trial Feature - Implementation Guide

## Overview

The one-time free try-on feature for new users has been successfully implemented. This feature allows new users to claim one free try-on when they first sign up, with a 7-day expiration window.

## Architecture

### Database Schema

Three new fields were added to the `users` table:

```sql
- freeTrialUsed: int (default: 0) - Flag indicating if free trial has been used (0 = not used, 1 = used)
- freeTrialUsedAt: timestamp - When the free trial was claimed
- freeTrialExpiresAt: timestamp - When the free trial expires (7 days after claiming)
```

### Backend Implementation

**File:** `server/routers/freetrial.ts`

Three main endpoints:

1. **`freeTrial.checkFreeTrial`** (Query)
   - Checks if current user has a free trial available
   - Returns: `{ hasFreeTrial: boolean, freeTrialUsedAt: Date | null, freeTrialExpiresAt: Date | null }`
   - Protected procedure (requires authentication)

2. **`freeTrial.claimFreeTrial`** (Mutation)
   - Claims the one-time free try-on for a new user
   - Sets `freeTrialUsed = 1` and `freeTrialExpiresAt` to 7 days from now
   - Returns: `{ success: boolean, message: string, expiresAt: Date }`
   - Protected procedure (requires authentication)
   - Throws error if free trial already used

3. **`freeTrial.getStatus`** (Query)
   - Gets detailed free trial status for UI display
   - Returns: `{ hasFreeTrial, isUsed, isExpired, usedAt, expiresAt, daysRemaining }`
   - Protected procedure (requires authentication)

### Frontend Components

#### 1. FreeTrialWelcomeModal (`client/src/components/FreeTrialWelcomeModal.tsx`)

- Appears on home page after user login
- Shows only if user has free trial available
- Features:
  - Welcome message with free trial benefits
  - 7-day expiration notice
  - "Try Free Now" button to claim and redirect to try-on page
  - "Maybe Later" button to dismiss

**Usage:**
```tsx
import { FreeTrialWelcomeModal } from "@/components/FreeTrialWelcomeModal";

export default function Home() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div>
      {isAuthenticated && <FreeTrialWelcomeModal />}
      {/* Rest of page */}
    </div>
  );
}
```

#### 2. UpgradePrompt (`client/src/components/UpgradePrompt.tsx`)

- Appears on results page after free try-on is used
- Shows pricing tiers for upgrade
- Features:
  - "Most Popular" badge on Pro tier
  - Feature comparison
  - "Get [Tier]" buttons linking to pricing page
  - Days remaining countdown

**Usage:**
```tsx
import { UpgradePrompt } from "@/components/UpgradePrompt";

export default function ResultsPage() {
  return (
    <div>
      {/* Try-on results */}
      <UpgradePrompt showAfterFreeTrial={true} />
    </div>
  );
}
```

## Integration Steps

### 1. Database Migration

The database schema has already been updated with the free trial fields. No additional migration needed.

### 2. Backend Integration

The free trial router is already registered in `server/routers.ts`:

```ts
import { freeTrialRouter } from "./routers/freetrial";

export const appRouter = router({
  // ... other routers
  freeTrial: freeTrialRouter,
  // ...
});
```

### 3. Frontend Integration

**Add to Home Page (`client/src/pages/Home.tsx`):**

```tsx
import { FreeTrialWelcomeModal } from "@/components/FreeTrialWelcomeModal";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div>
      {isAuthenticated && <FreeTrialWelcomeModal />}
      {/* Rest of home page */}
    </div>
  );
}
```

**Add to Try-On Results Page:**

```tsx
import { UpgradePrompt } from "@/components/UpgradePrompt";

export default function TryOnResults() {
  return (
    <div>
      {/* Try-on results display */}
      <UpgradePrompt showAfterFreeTrial={true} />
    </div>
  );
}
```

## User Flow

### New User Journey

1. User signs up and logs in
2. Redirected to home page
3. **FreeTrialWelcomeModal** appears with welcome message
4. User clicks "Try Free Now"
5. Free trial is claimed and user redirected to try-on page
6. User uploads photo and selects clothing
7. Try-on is processed (marked as "free" in system)
8. Results page shows with **UpgradePrompt**
9. User sees pricing tiers and can upgrade

### Returning User (After Free Trial Used)

1. User logs in
2. No welcome modal appears (free trial already used)
3. User can still access try-on page
4. Must purchase credits to use try-on feature
5. Can see upgrade prompt on results page

## Key Features

✅ **One-Time Only:** Each user can only claim free trial once
✅ **7-Day Expiration:** Free trial expires 7 days after claiming
✅ **Seamless Integration:** Works exactly like regular try-on
✅ **Conversion Funnel:** Upgrade prompt shows after free try-on
✅ **User-Friendly:** Clear messaging and easy-to-use UI
✅ **Protected:** Requires authentication

## Testing

**Test File:** `server/routers/freetrial.test.ts`

Tests cover:
- Checking free trial availability
- Claiming free trial
- Getting free trial status
- Expiration date calculations
- Error handling

**Run tests:**
```bash
pnpm test -- server/routers/freetrial.test.ts
```

## API Usage Examples

### Check if user has free trial

```ts
const { data: status } = trpc.freeTrial.getStatus.useQuery();

if (status?.hasFreeTrial) {
  // Show welcome modal
}
```

### Claim free trial

```ts
const claimFreeTrial = trpc.freeTrial.claimFreeTrial.useMutation();

const handleClaim = async () => {
  try {
    const result = await claimFreeTrial.mutateAsync();
    console.log("Free trial claimed until:", result.expiresAt);
  } catch (error) {
    console.error("Failed to claim:", error);
  }
};
```

### Get detailed status

```ts
const { data: status } = trpc.freeTrial.getStatus.useQuery();

console.log({
  hasFreeTrial: status?.hasFreeTrial,
  daysRemaining: status?.daysRemaining,
  isExpired: status?.isExpired,
});
```

## Analytics Tracking

To track free trial conversion, add these events:

1. **Free Trial Claimed** - When user clicks "Try Free Now"
2. **Free Trial Used** - When user completes first try-on
3. **Free Trial Converted** - When user purchases after free trial
4. **Free Trial Expired** - When 7 days pass without purchase

## Future Enhancements

- [ ] Email reminder before expiration (3 days, 1 day)
- [ ] Extend free trial for referrals
- [ ] A/B test different free trial lengths (5, 7, 10 days)
- [ ] Track free trial to paid conversion metrics
- [ ] Offer limited discount after free trial expires
- [ ] Social sharing incentive (extra try-ons for sharing)

## Troubleshooting

### Free trial modal not appearing

1. Check user is authenticated: `isAuthenticated === true`
2. Verify `freeTrial.getStatus` query is working
3. Check browser console for errors
4. Ensure `FreeTrialWelcomeModal` is imported and rendered

### Free trial not being claimed

1. Check network request to `freeTrial.claimFreeTrial`
2. Verify database connection
3. Check for error messages in browser console
4. Ensure user hasn't already claimed free trial

### Upgrade prompt not showing

1. Verify free trial was actually used (`freeTrialUsed = 1`)
2. Check `UpgradePrompt` component is rendered on results page
3. Verify `showAfterFreeTrial` prop is `true`
4. Check `freeTrial.getStatus` is returning correct status

## Support

For questions or issues with the free trial feature, check:
- Backend logs: `server/routers/freetrial.ts`
- Frontend components: `client/src/components/FreeTrialWelcomeModal.tsx`, `UpgradePrompt.tsx`
- Tests: `server/routers/freetrial.test.ts`
