# StyleSwap Platform - Project TODO

## Phase 4: Boutique Directory/Marketplace Feature

### Boutique Discovery Backend
- [x] Create boutique-discovery.ts router with tRPC procedures
- [x] Implement getBoutiquesList with search, filtering, sorting, and pagination
- [x] Implement getFeaturedBoutiques for homepage showcase
- [x] Implement getTrendingBoutiques based on recent order volume
- [x] Implement getNewBoutiques for recently registered boutiques
- [x] Implement getBoutiqueDetails with statistics
- [x] Implement searchBoutiques for quick search functionality
- [x] Integrate boutique-discovery router into main routers file

### Boutique Discovery Frontend
- [x] Create BoutiqueDirectory.tsx component with search and filtering UI
- [x] Implement featured boutiques section
- [x] Implement trending boutiques section
- [x] Implement all boutiques list with pagination
- [x] Add sorting options (newest, rating, products, name)
- [x] Add /boutiques route to App.tsx
- [ ] Write unit tests for boutique discovery procedures
- [ ] Test boutique discovery on dev server
- [ ] Test search, filtering, and sorting functionality

### Boutique Profile Enhancement
- [ ] Display boutique ratings and reviews
- [ ] Show featured products on boutique profile
- [ ] Add boutique social media links display
- [ ] Implement customer reviews system for boutiques

### Pricing Integration
- [x] Add "Buy Now" button to pricing cards
- [x] Integrate payment checkout flow for credit purchases
- [x] Connect pricing cards to Yoco payment system (using existing checkout)
- [ ] Test pricing purchase flow end-to-end

### Testing & Validation
- [ ] Test all boutique discovery APIs
- [ ] Test search functionality with various queries
- [ ] Test filtering by category, location, rating
- [ ] Test sorting options
- [ ] Test pagination
- [ ] Test featured and trending boutiques display
- [ ] Test pricing card "Buy Now" button
- [ ] Test payment checkout from pricing page

## Previous Phases (Completed)

### Phase 1 & 2: Core Platform
- [x] Boutique registration and onboarding
- [x] Product management system
- [x] Virtual try-on AI integration
- [x] Picture upload workflow
- [x] Customer try-on generation

### Phase 3: Automated Payout System
- [x] Payout calculation (92.5% to boutiques, 2.5% Yoco fees, 5% StyleSwap commission)
- [x] Yoco Payouts API integration
- [x] Boutique payout dashboard
- [x] Yoco webhook for real-time payout status
- [x] Payout notifications (email/SMS)
- [x] Instant payout feature (up to R10,000 with 1% fee)
- [x] Payout analytics
- [x] Bulk payout management admin dashboard
- [x] Referral system (10 credits per referral)
- [x] Order management system with Yoco payment integration
