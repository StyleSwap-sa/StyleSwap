# Boutique Shop Payment Integration - Detailed Flow

## Overview
This document explains how payment integration will work when customers purchase products from a boutique's shop on the StyleSwap platform.

---

## Current State vs. After Integration

### BEFORE Integration
```
Customer visits Boutique Shop
    ↓
Browses products
    ↓
Clicks "Try On" button
    ↓
Tries on clothing virtually
    ↓
❌ NO WAY TO PURCHASE
    ↓
Customer leaves without buying
```

### AFTER Integration
```
Customer visits Boutique Shop
    ↓
Browses products
    ↓
Clicks "Buy Now" button
    ↓
Product Details Modal Opens
    ↓
Customer reviews price & details
    ↓
Clicks "Proceed to Checkout"
    ↓
Checkout Page (Phone number + Delivery info)
    ↓
Yoko Payment Gateway (Card payment)
    ↓
✅ Payment Successful
    ↓
Order Confirmation
    ↓
Boutique receives order notification
```

---

## Detailed Step-by-Step Flow

### **STEP 1: Customer Browses Boutique Shop**
**Location:** `/boutique/{slug}/shop`

**What Happens:**
- Customer sees boutique's product catalog
- Each product displays:
  - Product image
  - Product name
  - Price (in ZAR - South African Rand)
  - Category
  - Description
  - "Try On" button (existing)
  - **"Buy Now" button (NEW)**

**Example Product Card:**
```
┌─────────────────────────────────┐
│  [Product Image]                │
│                                 │
│  Elegant Black Dress            │
│  Category: Dresses              │
│  Price: R 599.99                │
│                                 │
│  Beautiful evening dress with   │
│  elegant design...              │
│                                 │
│  [Try On]  [❤ Favorite]         │
│  [🛒 Buy Now] ← NEW BUTTON      │
└─────────────────────────────────┘
```

---

### **STEP 2: Customer Clicks "Buy Now"**
**Location:** Still on `/boutique/{slug}/shop`

**What Happens:**
1. A modal/dialog opens showing:
   - Product details (image, name, price)
   - Size selector (if applicable)
   - Color selector (if applicable)
   - Quantity selector
   - Total price calculation
   - "Proceed to Checkout" button

**Example Checkout Modal:**
```
┌──────────────────────────────────────┐
│  Add to Cart                         │
├──────────────────────────────────────┤
│  [Product Image]  Elegant Black Dress│
│                   Price: R 599.99    │
│                                      │
│  Size: [Small ▼]                     │
│  Color: [Black ▼]                    │
│  Quantity: [1] [+] [-]               │
│                                      │
│  Subtotal: R 599.99                  │
│  Delivery: R 50.00                   │
│  ─────────────────────────           │
│  Total: R 649.99                     │
│                                      │
│  [Cancel]  [Proceed to Checkout]     │
└──────────────────────────────────────┘
```

---

### **STEP 3: Customer Proceeds to Checkout**
**Location:** `/checkout?boutique={boutiqueId}&product={productId}`

**What Happens:**
1. Customer is redirected to checkout page
2. If NOT logged in → Redirect to login page first
3. If logged in → Show checkout form with:
   - **Customer Information** (pre-filled from account)
     - Name
     - Email
     - Phone number
   - **Delivery Address**
     - Street address
     - City
     - Province
     - Postal code
   - **Order Summary**
     - Product details
     - Price breakdown
     - Total amount

**Example Checkout Page:**
```
┌────────────────────────────────────────┐
│  Checkout - Boutique Shop              │
├────────────────────────────────────────┤
│                                        │
│  CUSTOMER INFORMATION                  │
│  ────────────────────────────          │
│  Name: John Doe                        │
│  Email: john@example.com               │
│  Phone: +27 82 123 4567                │
│                                        │
│  DELIVERY ADDRESS                      │
│  ────────────────────────────          │
│  Street: 123 Main Street               │
│  City: Cape Town                       │
│  Province: Western Cape                │
│  Postal Code: 8000                     │
│                                        │
│  ORDER SUMMARY                         │
│  ────────────────────────────          │
│  Elegant Black Dress (Size S)          │
│  Quantity: 1                           │
│  Price: R 599.99                       │
│  Delivery: R 50.00                     │
│  ─────────────────────────             │
│  Total: R 649.99                       │
│                                        │
│  [Continue to Payment]                 │
└────────────────────────────────────────┘
```

---

### **STEP 4: Payment Processing with Yoko**
**Location:** Redirected to Yoko payment gateway

**What Happens:**
1. Customer clicks "Continue to Payment"
2. Backend creates a Yoko checkout session with:
   - Amount: R 649.99
   - Customer email
   - Customer phone
   - Product details
   - Boutique ID (for tracking)
   - Success URL: `/order-confirmation?orderId={orderId}`
   - Cancel URL: `/checkout?boutique={boutiqueId}&cancelled=true`

3. Customer is redirected to **Yoko Payment Gateway**
4. Customer enters card details:
   - Card number
   - Expiry date
   - CVV
   - Cardholder name

**Example Yoko Payment Page:**
```
┌──────────────────────────────────────┐
│  Yoko Payment Gateway                │
├──────────────────────────────────────┤
│                                      │
│  Order Total: R 649.99               │
│                                      │
│  Card Number: [____ ____ ____ ____] │
│  Expiry: [__/__]  CVV: [___]        │
│  Cardholder: [________________]      │
│                                      │
│  [Cancel]  [Pay R 649.99]            │
│                                      │
│  Powered by Yoko                     │
└──────────────────────────────────────┘
```

---

### **STEP 5: Payment Confirmation**
**Two Possible Outcomes:**

#### **5A: Payment Successful ✅**

**What Happens:**
1. Yoko processes the payment
2. Yoko sends webhook to your backend: `POST /api/webhooks/yoko`
3. Backend receives payment confirmation
4. Backend creates order record in database:
   ```
   Order {
     id: "ORD-12345",
     customerId: 123,
     boutiqueId: 456,
     productId: 789,
     amount: 649.99,
     status: "paid",
     deliveryAddress: {...},
     createdAt: 2026-02-08,
     paymentId: "yoko_payment_12345"
   }
   ```
5. Customer is redirected to: `/order-confirmation?orderId=ORD-12345`
6. Order confirmation page shows:
   - Order number
   - Order details
   - Delivery tracking info
   - Estimated delivery date
   - Boutique contact info

**Example Order Confirmation Page:**
```
┌──────────────────────────────────────┐
│  ✅ Order Confirmed!                 │
├──────────────────────────────────────┤
│                                      │
│  Order #: ORD-12345                  │
│  Date: 8 Feb 2026                    │
│  Status: Payment Received             │
│                                      │
│  PRODUCT                             │
│  ─────────────────────────           │
│  Elegant Black Dress (Size S)        │
│  Quantity: 1                         │
│  Price: R 599.99                     │
│                                      │
│  DELIVERY                            │
│  ─────────────────────────           │
│  Address: 123 Main Street            │
│  City: Cape Town                     │
│  Estimated: 10-15 business days      │
│                                      │
│  TOTAL PAID: R 649.99                │
│                                      │
│  Boutique: [Boutique Name]           │
│  Contact: +27 82 123 4567            │
│  Email: contact@boutique.co.za       │
│                                      │
│  [Download Invoice]  [Track Order]   │
└──────────────────────────────────────┘
```

#### **5B: Payment Failed ❌**

**What Happens:**
1. Yoko payment fails (declined card, expired card, etc.)
2. Customer is redirected to: `/checkout?boutique={boutiqueId}&payment=failed`
3. Checkout page shows error message:
   - "Payment declined. Please try again."
   - "Your card has expired."
   - "Insufficient funds."
4. Customer can:
   - Try again with same card
   - Use different payment method
   - Cancel and return to shop

---

## Database Schema Changes

### New Tables Needed:

#### **orders** table
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE,
  customer_id INT NOT NULL,
  boutique_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  size VARCHAR(50),
  color VARCHAR(50),
  amount DECIMAL(10, 2),
  status ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
  payment_id VARCHAR(100),
  delivery_address JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (boutique_id) REFERENCES boutiques(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### **order_items** table (for future multi-product orders)
```sql
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT,
  price DECIMAL(10, 2),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### **payments** table
```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  payment_method VARCHAR(50),
  amount DECIMAL(10, 2),
  status ENUM('pending', 'completed', 'failed', 'refunded'),
  yoko_payment_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

---

## Backend API Changes

### New tRPC Procedures Needed:

#### **1. Create Checkout Session**
```typescript
payment.createBoutiqueCheckout({
  productId: number,
  quantity: number,
  size?: string,
  color?: string,
  deliveryAddress: {
    street: string,
    city: string,
    province: string,
    postalCode: string
  }
})
// Returns: { checkoutUrl: "https://yoko.co.za/pay/..." }
```

#### **2. Get Order Details**
```typescript
orders.getOrder({
  orderId: string
})
// Returns: Order object with all details
```

#### **3. List Customer Orders**
```typescript
orders.listMyOrders({
  limit?: number,
  offset?: number
})
// Returns: Array of customer's orders
```

#### **4. List Boutique Orders**
```typescript
orders.listBoutiqueOrders({
  boutiqueId: number,
  status?: string
})
// Returns: Array of orders for boutique
```

#### **5. Update Order Status** (Boutique owner only)
```typescript
orders.updateOrderStatus({
  orderId: string,
  status: 'processing' | 'shipped' | 'delivered'
})
```

---

## Frontend Components Needed

### 1. **ProductCheckoutModal.tsx**
- Shows product details
- Size/color/quantity selectors
- Price calculation
- "Proceed to Checkout" button

### 2. **BoutiqueCheckout.tsx**
- Customer info form
- Delivery address form
- Order summary
- "Continue to Payment" button

### 3. **OrderConfirmation.tsx**
- Order details display
- Delivery tracking
- Download invoice button
- Contact boutique button

### 4. **OrderHistory.tsx**
- List of customer's past orders
- Order status
- Reorder button
- Track shipment button

### 5. **BoutiqueOrderManagement.tsx**
- List of orders for boutique
- Filter by status
- Mark as shipped/delivered
- Print packing slip

---

## Revenue Flow

### How Money Moves:

```
Customer pays R 649.99
    ↓
Yoko takes 2.5% fee (R 16.25)
    ↓
Your platform receives R 633.74
    ↓
You take 15% commission (R 95.06)
    ↓
Boutique receives R 538.68
```

**Example Breakdown:**
- Customer pays: R 649.99
- Yoko fee (2.5%): -R 16.25
- Platform commission (15%): -R 95.06
- Boutique receives: R 538.68

---

## Webhook Integration

### Yoko sends webhook when payment completes:

```
POST /api/webhooks/yoko
{
  "event": "payment.completed",
  "payment_id": "yoko_12345",
  "amount": 649.99,
  "status": "completed",
  "customer_email": "john@example.com",
  "metadata": {
    "order_id": "ORD-12345",
    "boutique_id": 456
  }
}
```

**Backend Actions:**
1. Verify webhook signature
2. Update order status to "paid"
3. Send confirmation email to customer
4. Send order notification to boutique owner
5. Update boutique sales statistics

---

## Customer Journey Timeline

```
T+0 min:    Customer browses boutique shop
T+5 min:    Customer clicks "Buy Now"
T+6 min:    Customer fills checkout form
T+8 min:    Customer enters payment details on Yoko
T+9 min:    Payment processed successfully
T+10 min:   Customer sees order confirmation
T+15 min:   Boutique owner receives order notification
T+1 day:    Boutique owner marks order as "processing"
T+3 days:   Boutique owner marks order as "shipped"
T+10 days:  Order arrives at customer's address
T+11 days:  Customer marks order as "delivered"
```

---

## Security Considerations

1. **PCI Compliance**: Yoko handles all card data (we never see it)
2. **SSL/TLS**: All payment pages use HTTPS
3. **Webhook Verification**: Verify Yoko webhook signatures
4. **Rate Limiting**: Prevent payment spam
5. **Order Authorization**: Only customers can view their orders
6. **Boutique Authorization**: Only boutique owners can manage their orders

---

## Error Handling

### Possible Errors & Recovery:

| Error | Cause | Recovery |
|-------|-------|----------|
| Payment Declined | Card rejected | Try different card |
| Insufficient Funds | Not enough money | Add funds or try different card |
| Expired Card | Card expired | Use different card |
| Invalid CVV | Wrong security code | Re-enter CVV |
| Network Error | Connection lost | Retry payment |
| Timeout | Payment took too long | Contact support |

---

## Success Metrics

After implementation, track:
- Total orders created
- Total revenue
- Conversion rate (shop visitors → buyers)
- Average order value
- Payment success rate
- Customer satisfaction (reviews)
- Boutique satisfaction (seller ratings)

---

## Implementation Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1 | 2-3 days | Database schema, backend APIs |
| Phase 2 | 2-3 days | Frontend components, checkout flow |
| Phase 3 | 1-2 days | Yoko integration, webhook handling |
| Phase 4 | 1 day | Testing, error handling |
| Phase 5 | 1 day | Deployment, monitoring |

**Total: ~1 week**

---

## Next Steps

1. ✅ Review this flow document
2. ⬜ Approve payment integration approach
3. ⬜ Create database migrations
4. ⬜ Build backend APIs
5. ⬜ Build frontend components
6. ⬜ Integrate with Yoko
7. ⬜ Test end-to-end
8. ⬜ Deploy to production

