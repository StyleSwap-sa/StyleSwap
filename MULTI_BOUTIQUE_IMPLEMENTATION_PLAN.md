# StyleSwap Multi-Boutique B2B Implementation Plan

**Status:** Planning Phase  
**Created:** January 20, 2026  
**Prepared for:** StyleSwap Business Requirements

---

## Executive Summary

StyleSwap currently operates as a **B2C platform** with single-user credit management. To support the multi-boutique B2B model, we need to implement:

1. **Merchant/Boutique Management** - Independent merchant accounts
2. **Product Catalogue System** - Per-boutique product management
3. **Product-Linked Try-On** - Automatic clothing image selection from catalogue
4. **Credit & Usage Tracking** - Per-boutique isolation
5. **Admin Dashboard** - Platform-wide controls
6. **B2C vs B2B Flow Separation** - Different UX for retail vs direct customers

---

## Current System Assessment

### ✅ What We Have

| Component | Status | Details |
|-----------|--------|---------|
| User Authentication | ✅ Complete | Manus OAuth integration working |
| Credit System | ✅ Partial | Per-user credits, but not per-boutique |
| Try-On Engine | ✅ Complete | Fitroom API integration (pending validation fix) |
| Product Catalogue | ✅ Partial | Basic garments table, but no boutique isolation |
| Payment Integration | ✅ Partial | Yoko payment gateway integrated |
| Usage Logging | ✅ Partial | Transactions table exists, but limited fields |

### ❌ What We Need to Build

| Component | Current | Required | Effort |
|-----------|---------|----------|--------|
| Boutique/Merchant Accounts | ❌ None | Complete system | **HIGH** |
| Boutique Isolation | ❌ None | Data segregation | **HIGH** |
| Product Ownership | ❌ None | Per-boutique products | **MEDIUM** |
| Product-Linked Try-On | ❌ None | Automatic clothing selection | **MEDIUM** |
| Boutique Admin Dashboard | ❌ None | Merchant controls | **MEDIUM** |
| Platform Admin Dashboard | ❌ None | Super-admin controls | **MEDIUM** |
| Usage Tracking Per Boutique | ❌ Partial | Enhanced logging | **LOW** |
| B2C vs B2B Routing | ❌ None | Conditional UI/API | **MEDIUM** |

---

## Detailed Gap Analysis

### 1. Multi-Boutique Support – REQUIRED ❌

**Current State:**
- Single user model (users table)
- No merchant/boutique concept
- All data tied to individual users

**Required Changes:**
```
Create new tables:
- boutiques (merchant accounts)
- boutique_users (staff/team members)
- boutique_settings (configuration per boutique)
```

**Impact:** 
- Database schema changes
- API endpoint restructuring
- Authentication flow changes

---

### 2. Product-Linked Try-On Flow – REQUIRED ❌

**Current State:**
- Customers upload both body photo AND clothing image
- Garments table exists but not linked to boutiques
- Try-on flow is manual image selection

**Required Changes:**
```
Modify garments table:
- Add boutique_id foreign key
- Add sku / product_id
- Add boutique_specific metadata

Create new flow:
- Customer selects product from boutique catalogue
- System automatically passes product image to Fitroom
- No manual clothing upload needed in B2B flow
```

**Impact:**
- Database schema changes
- New API endpoints for boutique products
- Frontend UI changes for B2B vs B2C

---

### 3. Usage & Credit Management Per Boutique – REQUIRED ❌

**Current State:**
- userCredits table tied to user ID
- transactions table tracks purchases but not boutique usage
- No boutique-level credit isolation

**Required Changes:**
```
Create new tables:
- boutique_credits (credits per boutique)
- boutique_transactions (usage tracking per boutique)

Enhanced fields needed:
- boutique_id (all transaction records)
- product_id (for product-specific tracking)
- fitroom_request_id (for API call tracing)
- boutique_user_id (who initiated the try-on)
```

**Impact:**
- Database schema changes
- Credit deduction logic changes
- Billing and reporting changes

---

### 4. Clear B2C vs B2B Flow Separation – REQUIRED ❌

**Current State:**
- Single flow for all users
- All users upload both images

**Required Changes:**
```
B2C Flow (Direct Customers):
- User uploads body photo
- User uploads clothing image (or selects from global catalogue)
- Try-on generated
- Results displayed

B2B Flow (Boutique Customers):
- User logs in via boutique link
- User uploads body photo only
- System shows boutique's product catalogue
- User selects product
- Try-on generated with product image
- Results displayed with boutique branding
```

**Impact:**
- Frontend routing changes
- API endpoint branching
- Authentication context changes

---

### 5. Backend & API Requirements – REQUIRED ❌

**Current State:**
- Fitroom API calls made from backend ✅
- Limited request tracking
- No boutique association in API calls

**Required Changes:**
```
Enhance Fitroom integration:
- Tag all API requests with boutique_id
- Track request_id from Fitroom response
- Log boutique-specific usage
- Implement boutique-level rate limiting

Create new endpoints:
- POST /api/trpc/boutique.createTryOn (B2B flow)
- GET /api/trpc/boutique.products (list boutique products)
- POST /api/trpc/boutique.uploadProduct (add products)
```

**Impact:**
- New tRPC procedures
- Enhanced logging
- Boutique context injection

---

### 6. Admin & Platform Control – REQUIRED ❌

**Current State:**
- No admin dashboard
- No boutique management interface
- No global usage visibility

**Required Changes:**
```
Create Admin Dashboard with:
- Boutique management (create, suspend, delete)
- Credit adjustment interface
- Global usage analytics
- Boutique performance metrics
- Payment reconciliation

Create Boutique Owner Dashboard with:
- Credit balance display
- Usage history
- Product management
- Customer activity
- Revenue tracking
```

**Impact:**
- New UI pages
- New API endpoints
- New database queries

---

## Proposed Database Schema

### New Tables Required

```sql
-- Boutiques/Merchants
CREATE TABLE boutiques (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  website_url VARCHAR(500),
  owner_id INT NOT NULL,
  status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Boutique Staff/Team
CREATE TABLE boutique_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  boutique_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'manager', 'staff') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (boutique_id) REFERENCES boutiques(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY (boutique_id, user_id)
);

-- Boutique Credits
CREATE TABLE boutique_credits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  boutique_id INT NOT NULL UNIQUE,
  total_credits INT DEFAULT 0,
  used_credits INT DEFAULT 0,
  remaining_credits INT DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
);

-- Boutique Transactions
CREATE TABLE boutique_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  boutique_id INT NOT NULL,
  type ENUM('purchase', 'usage', 'refund', 'adjustment') NOT NULL,
  amount INT NOT NULL,
  price VARCHAR(20),
  currency VARCHAR(3) DEFAULT 'ZAR',
  product_id INT,
  fitroom_request_id VARCHAR(255),
  initiated_by INT,
  description TEXT,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (boutique_id) REFERENCES boutiques(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (initiated_by) REFERENCES users(id)
);

-- Products (Modified from garments)
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  boutique_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  description TEXT,
  category VARCHAR(100),
  image_url VARCHAR(500) NOT NULL,
  price VARCHAR(20),
  currency VARCHAR(3) DEFAULT 'ZAR',
  is_active INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (boutique_id) REFERENCES boutiques(id),
  INDEX (boutique_id)
);

-- Try-On Results (Enhanced)
CREATE TABLE try_on_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  boutique_id INT,
  user_id INT NOT NULL,
  product_id INT,
  user_photo_url VARCHAR(500) NOT NULL,
  result_image_url VARCHAR(500),
  fitroom_task_id VARCHAR(255),
  fitroom_request_id VARCHAR(255),
  share_token VARCHAR(255) UNIQUE,
  share_count INT DEFAULT 0,
  is_public INT DEFAULT 0,
  flow_type ENUM('b2c', 'b2b') DEFAULT 'b2c',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (boutique_id) REFERENCES boutiques(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX (boutique_id),
  INDEX (user_id)
);

-- Boutique Settings
CREATE TABLE boutique_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  boutique_id INT NOT NULL UNIQUE,
  branding_color VARCHAR(7),
  custom_domain VARCHAR(255),
  enable_sharing INT DEFAULT 1,
  enable_analytics INT DEFAULT 1,
  webhook_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
);
```

### Modified Tables

```sql
-- Garments table becomes Products (see above)
-- Keep garments for backwards compatibility or migrate fully

-- Users table - Add boutique context
ALTER TABLE users ADD COLUMN current_boutique_id INT;
ALTER TABLE users ADD COLUMN user_type ENUM('customer', 'merchant', 'admin') DEFAULT 'customer';

-- Try-On Results - Add boutique_id and flow_type (see above)
```

---

## Implementation Roadmap

### Phase 1: Database & Core Infrastructure (Week 1)
- [ ] Create new database tables
- [ ] Add migrations
- [ ] Create Drizzle ORM types
- [ ] Add foreign key relationships
- [ ] Write database tests

**Deliverable:** Updated schema with all tables and relationships

---

### Phase 2: Boutique Management (Week 2)
- [ ] Create boutique CRUD endpoints
- [ ] Implement boutique ownership validation
- [ ] Create boutique user management
- [ ] Add boutique settings management
- [ ] Write integration tests

**Deliverable:** Full boutique management API

---

### Phase 3: Product Catalogue System (Week 2-3)
- [ ] Migrate garments to products with boutique_id
- [ ] Create product CRUD endpoints
- [ ] Implement boutique product filtering
- [ ] Add product image upload
- [ ] Write product management tests

**Deliverable:** Per-boutique product management

---

### Phase 4: Product-Linked Try-On (Week 3)
- [ ] Create new B2B try-on endpoint
- [ ] Implement automatic clothing image selection
- [ ] Add boutique context to Fitroom API calls
- [ ] Implement usage logging per boutique
- [ ] Write try-on flow tests

**Deliverable:** Working B2B try-on flow

---

### Phase 5: Credit & Usage Tracking (Week 3-4)
- [ ] Implement boutique credit system
- [ ] Create boutique transaction logging
- [ ] Add credit deduction per boutique
- [ ] Implement credit expiration
- [ ] Write credit system tests

**Deliverable:** Complete credit management per boutique

---

### Phase 6: Admin Dashboard (Week 4-5)
- [ ] Create admin boutique management UI
- [ ] Implement credit adjustment interface
- [ ] Create global usage analytics
- [ ] Add boutique performance metrics
- [ ] Implement boutique suspension/deletion

**Deliverable:** Full admin dashboard

---

### Phase 7: Boutique Owner Dashboard (Week 5)
- [ ] Create boutique owner dashboard
- [ ] Implement credit balance display
- [ ] Create usage history view
- [ ] Add product management UI
- [ ] Implement revenue tracking

**Deliverable:** Complete boutique owner dashboard

---

### Phase 8: B2C vs B2B Flow Separation (Week 5-6)
- [ ] Implement routing logic
- [ ] Create B2C landing page
- [ ] Create B2B boutique portal
- [ ] Add boutique branding
- [ ] Implement boutique-specific URLs

**Deliverable:** Separate B2C and B2B user flows

---

### Phase 9: Testing & QA (Week 6-7)
- [ ] Write comprehensive unit tests
- [ ] Write integration tests
- [ ] Perform security audit
- [ ] Load testing
- [ ] User acceptance testing

**Deliverable:** Full test coverage and security validation

---

### Phase 10: Documentation & Deployment (Week 7)
- [ ] Create API documentation
- [ ] Write merchant onboarding guide
- [ ] Create admin user guide
- [ ] Prepare deployment checklist
- [ ] Deploy to production

**Deliverable:** Complete documentation and production deployment

---

## Timeline Summary

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Database | 3-4 days | Week 1 | Week 1 |
| Phase 2: Boutique Mgmt | 4-5 days | Week 1-2 | Week 2 |
| Phase 3: Products | 5-6 days | Week 2-3 | Week 3 |
| Phase 4: Try-On Flow | 4-5 days | Week 3 | Week 3-4 |
| Phase 5: Credits | 4-5 days | Week 3-4 | Week 4 |
| Phase 6: Admin Dashboard | 5-6 days | Week 4-5 | Week 5 |
| Phase 7: Owner Dashboard | 4-5 days | Week 5 | Week 5-6 |
| Phase 8: Flow Separation | 4-5 days | Week 5-6 | Week 6 |
| Phase 9: Testing | 5-7 days | Week 6-7 | Week 7 |
| Phase 10: Documentation | 3-4 days | Week 7 | Week 7 |

**Total Estimated Timeline: 6-7 weeks**

---

## Risk Assessment

### High Risk ⚠️

1. **Fitroom API Integration with Boutique Context**
   - Risk: Fitroom API may not support boutique-level tracking
   - Mitigation: Implement local tracking layer independent of Fitroom
   - Impact: Medium - workaround available

2. **Data Migration from Single-User to Multi-Boutique**
   - Risk: Existing user data needs to be migrated
   - Mitigation: Create migration scripts, test thoroughly
   - Impact: High - affects existing users

3. **Authentication Context Switching**
   - Risk: Complex to manage user context across B2C and B2B
   - Mitigation: Implement context middleware, thorough testing
   - Impact: Medium - critical for security

### Medium Risk ⚠️

4. **Database Performance at Scale**
   - Risk: Multi-boutique queries may be slow with large datasets
   - Mitigation: Add proper indexing, implement caching
   - Impact: Low - optimization can be done post-launch

5. **Payment Reconciliation**
   - Risk: Tracking payments per boutique is complex
   - Mitigation: Implement audit trails, reconciliation reports
   - Impact: Medium - affects billing accuracy

### Low Risk ✅

6. **UI/UX Complexity**
   - Risk: Multiple dashboards and flows to manage
   - Mitigation: Clear design documentation, user testing
   - Impact: Low - can be refined post-launch

---

## Cost & Resource Requirements

### Development Resources
- **Backend Developer:** 1 FTE (6-7 weeks)
- **Frontend Developer:** 1 FTE (5-6 weeks)
- **QA Engineer:** 1 FTE (2-3 weeks)
- **DevOps/Database Admin:** 0.5 FTE (ongoing)

### Infrastructure
- **Database:** Increased storage for multi-tenant data
- **API Rate Limiting:** Per-boutique quotas
- **Monitoring:** Enhanced logging for audit trails

### External Dependencies
- **Fitroom API:** Ensure compatibility with boutique tracking
- **Payment Gateway:** Verify multi-merchant support

---

## Success Criteria

### Functional Requirements ✅
- [ ] Multiple boutiques can operate independently
- [ ] Each boutique has isolated credits and usage data
- [ ] Product-linked try-on works without manual clothing upload
- [ ] Admin can manage all boutiques
- [ ] Boutique owners can manage their own products and credits
- [ ] B2C and B2B flows are clearly separated
- [ ] All usage is tracked and billable

### Non-Functional Requirements ✅
- [ ] API response time < 500ms for all endpoints
- [ ] Database queries optimized with proper indexing
- [ ] 99.9% uptime for boutique operations
- [ ] Audit trail for all credit transactions
- [ ] Secure data isolation between boutiques
- [ ] GDPR compliant data handling

### Business Requirements ✅
- [ ] Support 100+ boutiques in first year
- [ ] Enable boutique onboarding in < 1 hour
- [ ] Provide clear billing and usage reports
- [ ] Support multiple payment methods per boutique
- [ ] Enable boutique branding and customization

---

## Next Steps

### Immediate Actions (This Week)
1. ✅ Confirm requirements with stakeholders (YOU - DONE)
2. ⏳ Review and approve database schema
3. ⏳ Create detailed API specification
4. ⏳ Set up development environment
5. ⏳ Begin Phase 1 implementation

### Approval Needed
- [ ] Database schema design
- [ ] API endpoint specifications
- [ ] UI/UX mockups for dashboards
- [ ] Timeline and resource allocation
- [ ] Budget approval

---

## Questions & Clarifications

Before starting implementation, please clarify:

1. **Boutique Onboarding**
   - Who creates boutique accounts? (Self-service or admin-only?)
   - What information is required?
   - Any KYC/verification process?

2. **Pricing Model**
   - How are credits priced per boutique?
   - Volume discounts?
   - Subscription vs. pay-as-you-go?

3. **Branding**
   - Can boutiques use custom domains?
   - Logo and color customization?
   - White-label option?

4. **Integration**
   - Will boutiques have API access?
   - Webhook support for events?
   - Third-party integrations (Shopify, WooCommerce)?

5. **Compliance**
   - Data residency requirements?
   - Specific security certifications needed?
   - Audit requirements?

---

## Conclusion

The multi-boutique B2B implementation is a **significant but achievable undertaking**. With proper planning and execution, StyleSwap can transition from a B2C platform to a comprehensive B2B solution supporting multiple independent merchants.

**Estimated Timeline:** 6-7 weeks  
**Estimated Effort:** 1 backend dev + 1 frontend dev + 1 QA  
**Risk Level:** Medium (manageable with proper planning)

Ready to proceed with Phase 1 implementation?

---

*Document prepared for: StyleSwap Business Requirements*  
*Status: Ready for Review & Approval*
