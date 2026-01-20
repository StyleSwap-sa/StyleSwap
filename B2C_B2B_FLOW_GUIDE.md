# StyleSwap: B2C vs B2B Flow Separation Guide

## Overview

StyleSwap supports two distinct business models:
- **B2C (Business-to-Consumer):** Individual customers use StyleSwap directly
- **B2B (Business-to-Business):** Boutiques integrate StyleSwap into their websites

This document outlines the technical and UX separation between these flows.

---

## 1. B2C Flow (Individual Customers)

### User Journey
1. Customer visits StyleSwap.com
2. Uploads their own body photo
3. Uploads their own clothing image
4. Selects try-on preferences
5. Receives virtual try-on result
6. Can share or download result

### API Endpoints
```
POST /api/trpc/tryon.createTryOn
  - Input: bodyPhotoBase64, clothingImageBase64, clothType
  - Output: taskId, status, resultImageUrl
```

### Database Context
- User credits tracked in `userCredits` table
- Try-on results stored in `tryOnResults` with `flowType: "b2c"`
- No `boutiqueId` required
- Individual user owns the result

### Credit System
- Individual users purchase credits for themselves
- Pricing: R3.85 per try-on (or bulk discounts)
- Credits valid for 30 days
- Tracked per user, not per boutique

### UI Characteristics
- Personal dashboard showing user's try-ons
- Individual credit balance
- Personal sharing and download options
- No boutique branding

---

## 2. B2B Flow (Boutique Integration)

### User Journey
1. Boutique owner registers on StyleSwap
2. Creates boutique account with custom domain
3. Uploads product catalogue (clothing images)
4. Embeds StyleSwap widget on their website
5. Customers visit boutique website
6. Upload their body photo only
7. Select product from boutique's catalogue
8. Receive virtual try-on result
9. Result shows customer in boutique's clothing

### API Endpoints
```
POST /api/trpc/b2bTryon.createB2BTryOn
  - Input: boutiqueId, productId, bodyPhotoBase64
  - Output: taskId, status, resultImageUrl

GET /api/trpc/products.getByBoutique
  - Input: boutiqueId
  - Output: [{ id, name, sku, imageUrl, category }]

GET /api/trpc/billing.getCreditBalance
  - Input: boutiqueId
  - Output: { remaining, total, used, expirationDate }
```

### Database Context
- Boutique credits tracked in `boutiqueCredits` table
- Try-on results stored in `tryOnResults` with `flowType: "b2b"` and `boutiqueId`
- Product images linked via `products` table
- Boutique owns the result and customer data

### Credit System
- Boutiques purchase credits in bulk
- Tiered pricing (volume discounts):
  - 100 credits: R385 (R3.85/credit)
  - 200 credits: R750 (R3.75/credit)
  - 500 credits: R1,350 (R2.70/credit)
  - 1,000 credits: R2,200 (R2.20/credit)
  - 5,000 credits: R6,250 (R1.25/credit)
  - 20,000 credits: R18,600 (R0.93/credit)
- Credits valid for 30 days from purchase
- Tracked per boutique
- Admin can refund or adjust credits

### UI Characteristics
- Boutique branding (logo, colors, domain)
- Boutique product catalogue displayed
- Boutique dashboard for analytics
- Boutique billing and credit management
- No individual user credit system
- Customers don't create accounts

---

## 3. Key Differences

| Aspect | B2C | B2B |
|--------|-----|-----|
| **User Type** | Individual | Boutique Owner |
| **Photo Upload** | Body + Clothing | Body only |
| **Clothing Source** | User uploads | Boutique catalogue |
| **Credits** | Personal account | Boutique account |
| **Pricing** | Per try-on | Bulk purchase |
| **Domain** | styleswap.com | custom.domain or boutique.styleswap.space |
| **Branding** | StyleSwap | Boutique's branding |
| **Data Ownership** | User | Boutique |
| **Dashboard** | Personal | Boutique analytics |
| **Billing** | Per-use | Bulk credits |

---

## 4. Implementation Details

### B2C Try-On Flow
```typescript
// Frontend: User uploads both images
const { data } = trpc.tryon.createTryOn.useMutation({
  bodyPhotoBase64: userBodyPhoto,
  clothingImageBase64: userClothingPhoto,
  clothType: "single"
});

// Backend: Creates try-on with user context
- Validates user has sufficient credits
- Calls Fitroom API with both images
- Deducts 1 credit from user account
- Stores result with userId, flowType: "b2c"
```

### B2B Try-On Flow
```typescript
// Frontend: User uploads body photo only, selects product
const { data } = trpc.b2bTryon.createB2BTryOn.useMutation({
  boutiqueId: selectedBoutique.id,
  productId: selectedProduct.id,
  bodyPhotoBase64: userBodyPhoto
});

// Backend: Creates try-on with boutique context
- Validates boutique exists and is active
- Retrieves product image from database
- Validates boutique has sufficient credits
- Calls Fitroom API with body + product image
- Deducts 1 credit from boutique account
- Stores result with boutiqueId, productId, flowType: "b2b"
- Logs transaction for billing
```

---

## 5. Authorization & Access Control

### B2C Authorization
```
- User can only view their own try-ons
- User can only spend their own credits
- No boutique context required
```

### B2B Authorization
```
- Boutique owner/manager can view all try-ons for their boutique
- Boutique owner/manager can manage products
- Boutique owner/manager can view billing
- Admin can manage all boutiques
- Customers don't need accounts (anonymous)
```

---

## 6. Data Retention & Privacy

### B2C
- Customer photos stored for 7 days (auto-delete)
- Results available for 30 days
- User can manually delete anytime
- POPIA compliance: User consent required

### B2B
- Customer photos stored for 7 days (auto-delete)
- Results available for 30 days
- Boutique can access results
- POPIA compliance: Boutique responsible for customer consent

---

## 7. Frontend Implementation

### B2C Component
```typescript
// Location: client/src/pages/VirtualTryOn.tsx
<VirtualTryOnUpload
  mode="b2c"
  onSuccess={(result) => showResult(result)}
/>
```

### B2B Widget
```typescript
// Location: client/src/components/B2BTryOnWidget.tsx
<B2BTryOnWidget
  boutiqueId={boutiqueId}
  products={boutiqueProducts}
  onSuccess={(result) => showResult(result)}
/>
```

---

## 8. Webhook & Notifications

### B2C
- Notify user when try-on is ready
- Email with result link
- No boutique notification

### B2B
- Notify boutique owner of usage
- Daily/weekly usage reports
- Credit balance alerts
- Low credit warnings

---

## 9. Testing Checklist

### B2C Flow
- [ ] User can upload body + clothing photos
- [ ] Credits deducted correctly
- [ ] Results stored with userId
- [ ] Photos auto-delete after 7 days
- [ ] User can share result
- [ ] User can download result

### B2B Flow
- [ ] Boutique can create account
- [ ] Boutique can upload products
- [ ] Boutique can purchase credits
- [ ] Customer can upload body photo only
- [ ] Product image auto-selected
- [ ] Credits deducted from boutique
- [ ] Results stored with boutiqueId
- [ ] Boutique can view analytics
- [ ] Boutique can export data

---

## 10. Migration Path (Future)

If a B2C user wants to become a boutique owner:
1. Create new boutique account
2. Migrate existing try-on results (optional)
3. Upload product catalogue
4. Purchase boutique credits
5. Embed widget on their website

---

## 11. API Reference Summary

### B2C Endpoints
- `trpc.tryon.createTryOn` - Create try-on
- `trpc.tryon.getTryOn` - Get result
- `trpc.userCredits.getBalance` - Check credits
- `trpc.userCredits.purchase` - Buy credits

### B2B Endpoints
- `trpc.b2bTryon.createB2BTryOn` - Create try-on
- `trpc.products.getByBoutique` - Get products
- `trpc.billing.getCreditBalance` - Check credits
- `trpc.billing.initiatePurchase` - Buy credits
- `trpc.boutiqueDashboard.getOverview` - Dashboard
- `trpc.boutiqueDashboard.getProductPerformance` - Analytics

### Admin Endpoints
- `trpc.admin.getAllBoutiques` - View all boutiques
- `trpc.admin.getPlatformStats` - Platform analytics
- `trpc.admin.suspendBoutique` - Suspend boutique
- `trpc.billing.completePurchase` - Approve credit purchase

---

## 12. Security Considerations

### B2C
- User photos encrypted at rest
- User data isolated by userId
- No cross-user data leakage
- HTTPS for all uploads

### B2B
- Boutique data isolated by boutiqueId
- Product images protected
- Customer photos isolated per boutique
- Admin can access all data for compliance

---

## 13. Monitoring & Analytics

### B2C Metrics
- Total users
- Try-ons per user
- Credit purchases
- Revenue per user
- Churn rate

### B2B Metrics
- Total boutiques
- Active boutiques
- Try-ons per boutique
- Revenue per boutique
- Credit usage rate
- Top performing products

---

## 14. Future Enhancements

- [ ] B2C subscription plans
- [ ] B2B white-label options
- [ ] API for third-party integrations
- [ ] Mobile app for B2C
- [ ] Advanced analytics for B2B
- [ ] Multi-language support
- [ ] Regional pricing
- [ ] Payment plan options

---

## Questions?

For implementation questions, refer to:
- Backend: `/server/routers/tryon.ts` (B2C)
- Backend: `/server/routers/b2b-tryon.ts` (B2B)
- Frontend: `/client/src/pages/VirtualTryOn.tsx` (B2C)
- Frontend: `/client/src/components/B2BTryOnWidget.tsx` (B2B)
