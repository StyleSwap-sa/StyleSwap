# StyleSwap API Documentation

## Complete API Reference for Retail Shop Integration

---

## Overview

The StyleSwap API enables retail shops, e-commerce platforms, and fashion brands to integrate virtual try-on functionality directly into their applications. This API provides endpoints for managing products, processing customer photos, generating try-ons, and tracking analytics.

**API Base URL:** `https://api.styleswap.com/v1`

**Authentication:** Bearer Token (OAuth 2.0)

**Response Format:** JSON

**Rate Limits:** 100 requests/minute (standard), custom for enterprise

---

## Table of Contents

1. [Authentication](#authentication)
2. [Core Endpoints](#core-endpoints)
3. [Product Management](#product-management)
4. [Try-On Generation](#try-on-generation)
5. [Customer Management](#customer-management)
6. [Analytics & Reporting](#analytics--reporting)
7. [Webhooks](#webhooks)
8. [Error Handling](#error-handling)
9. [Code Examples](#code-examples)
10. [Best Practices](#best-practices)

---

## Authentication

### OAuth 2.0 Token Flow

All API requests require authentication using a Bearer token. Obtain your token by exchanging your credentials with the authentication endpoint.

**Endpoint:** `POST https://api.styleswap.com/v1/auth/token`

**Request Body:**
```json
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "client_credentials"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "products:read products:write tryons:read tryons:write"
}
```

### Using the Token

Include the token in the Authorization header for all subsequent requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

Tokens expire after 1 hour. Refresh your token before expiration:

**Endpoint:** `POST https://api.styleswap.com/v1/auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "your_refresh_token"
}
```

---

## Core Endpoints

### 1. Health Check

Verify that the API is operational.

**Endpoint:** `GET /health`

**Authentication:** Not required

**Response:**
```json
{
  "status": "operational",
  "version": "1.0.0",
  "timestamp": "2026-02-09T14:30:00Z"
}
```

### 2. Get Account Information

Retrieve your account details and usage statistics.

**Endpoint:** `GET /account`

**Authentication:** Required

**Response:**
```json
{
  "account_id": "acc_12345",
  "business_name": "Mr Price",
  "plan": "enterprise",
  "credits_remaining": 45000,
  "monthly_limit": 50000,
  "usage_this_month": 5000,
  "created_at": "2025-01-15T10:00:00Z",
  "api_keys_count": 3,
  "webhook_endpoints": 2
}
```

---

## Product Management

### 1. Create Product

Add a new product to your catalog.

**Endpoint:** `POST /products`

**Authentication:** Required (scope: `products:write`)

**Request Body:**
```json
{
  "external_id": "SKU-12345",
  "name": "Blue Cotton T-Shirt",
  "description": "Comfortable 100% cotton t-shirt",
  "category": "Tops",
  "subcategory": "T-Shirts",
  "price": 29.99,
  "currency": "USD",
  "image_url": "https://cdn.example.com/product-blue-tshirt.jpg",
  "image_urls": [
    "https://cdn.example.com/product-blue-tshirt-1.jpg",
    "https://cdn.example.com/product-blue-tshirt-2.jpg",
    "https://cdn.example.com/product-blue-tshirt-3.jpg"
  ],
  "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
  "colors": ["Blue", "Red", "Black", "White"],
  "gender": "Women",
  "garment_type": "Top",
  "material": "100% Cotton",
  "care_instructions": "Machine wash cold. Do not bleach.",
  "return_policy": "30-day returns",
  "is_active": true,
  "metadata": {
    "collection": "Spring 2026",
    "brand": "StyleSwap",
    "supplier_id": "SUP-789"
  }
}
```

**Response:**
```json
{
  "id": "prod_abc123",
  "external_id": "SKU-12345",
  "name": "Blue Cotton T-Shirt",
  "status": "active",
  "created_at": "2026-02-09T14:30:00Z",
  "updated_at": "2026-02-09T14:30:00Z"
}
```

### 2. Get Product

Retrieve a specific product by ID.

**Endpoint:** `GET /products/{product_id}`

**Authentication:** Required (scope: `products:read`)

**Response:**
```json
{
  "id": "prod_abc123",
  "external_id": "SKU-12345",
  "name": "Blue Cotton T-Shirt",
  "description": "Comfortable 100% cotton t-shirt",
  "category": "Tops",
  "price": 29.99,
  "image_url": "https://cdn.example.com/product-blue-tshirt.jpg",
  "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
  "colors": ["Blue", "Red", "Black", "White"],
  "gender": "Women",
  "garment_type": "Top",
  "is_active": true,
  "created_at": "2026-02-09T14:30:00Z",
  "updated_at": "2026-02-09T14:30:00Z",
  "tryons_count": 1250,
  "conversion_rate": 0.18
}
```

### 3. Update Product

Modify an existing product.

**Endpoint:** `PUT /products/{product_id}`

**Authentication:** Required (scope: `products:write`)

**Request Body:**
```json
{
  "name": "Blue Cotton T-Shirt - Updated",
  "price": 24.99,
  "is_active": true,
  "image_url": "https://cdn.example.com/product-blue-tshirt-updated.jpg"
}
```

**Response:**
```json
{
  "id": "prod_abc123",
  "name": "Blue Cotton T-Shirt - Updated",
  "price": 24.99,
  "updated_at": "2026-02-09T14:35:00Z"
}
```

### 4. List Products

Retrieve a paginated list of your products.

**Endpoint:** `GET /products?page=1&limit=50&category=Tops&is_active=true`

**Authentication:** Required (scope: `products:read`)

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50, max: 500)
- `category` (string): Filter by category
- `is_active` (boolean): Filter by active status
- `search` (string): Search by name or external_id

**Response:**
```json
{
  "data": [
    {
      "id": "prod_abc123",
      "external_id": "SKU-12345",
      "name": "Blue Cotton T-Shirt",
      "price": 29.99,
      "category": "Tops",
      "is_active": true,
      "tryons_count": 1250,
      "conversion_rate": 0.18
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5000,
    "pages": 100
  }
}
```

### 5. Bulk Upload Products

Upload multiple products at once via CSV.

**Endpoint:** `POST /products/bulk-upload`

**Authentication:** Required (scope: `products:write`)

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (file): CSV file with product data
- `update_existing` (boolean): Whether to update existing products

**CSV Format:**
```
external_id,name,category,price,image_url,sizes,colors,gender,garment_type
SKU-12345,Blue Cotton T-Shirt,Tops,29.99,https://cdn.example.com/product.jpg,"XS,S,M,L,XL","Blue,Red,Black",Women,Top
SKU-12346,Black Denim Jeans,Bottoms,59.99,https://cdn.example.com/jeans.jpg,"28,30,32,34,36",Black,Women,Bottom
```

**Response:**
```json
{
  "job_id": "bulk_upload_123",
  "status": "processing",
  "total_products": 1000,
  "processed": 0,
  "succeeded": 0,
  "failed": 0,
  "created_at": "2026-02-09T14:30:00Z"
}
```

### 6. Get Bulk Upload Status

Check the status of a bulk upload job.

**Endpoint:** `GET /products/bulk-upload/{job_id}`

**Authentication:** Required (scope: `products:read`)

**Response:**
```json
{
  "job_id": "bulk_upload_123",
  "status": "completed",
  "total_products": 1000,
  "processed": 1000,
  "succeeded": 998,
  "failed": 2,
  "errors": [
    {
      "row": 5,
      "error": "Invalid price format"
    },
    {
      "row": 12,
      "error": "Missing required field: image_url"
    }
  ],
  "completed_at": "2026-02-09T14:45:00Z"
}
```

### 7. Delete Product

Remove a product from your catalog.

**Endpoint:** `DELETE /products/{product_id}`

**Authentication:** Required (scope: `products:write`)

**Response:**
```json
{
  "id": "prod_abc123",
  "status": "deleted",
  "deleted_at": "2026-02-09T14:30:00Z"
}
```

---

## Try-On Generation

### 1. Upload Customer Photo

Upload a customer's body photo for try-on generation.

**Endpoint:** `POST /tryons/upload-photo`

**Authentication:** Required (scope: `tryons:write`)

**Content-Type:** `multipart/form-data`

**Form Data:**
- `photo` (file): JPEG or PNG image (max 10MB)
- `customer_id` (string, optional): Your internal customer ID
- `metadata` (JSON, optional): Additional data

**Response:**
```json
{
  "photo_id": "photo_abc123",
  "url": "https://cdn.styleswap.com/photos/photo_abc123.jpg",
  "width": 1080,
  "height": 1920,
  "file_size": 2048576,
  "quality_score": 0.92,
  "uploaded_at": "2026-02-09T14:30:00Z"
}
```

### 2. Generate Try-On

Create a virtual try-on using a customer photo and product.

**Endpoint:** `POST /tryons/generate`

**Authentication:** Required (scope: `tryons:write`)

**Request Body:**
```json
{
  "photo_id": "photo_abc123",
  "product_id": "prod_abc123",
  "size": "M",
  "color": "Blue",
  "garment_part": "top",
  "customer_id": "cust_xyz789",
  "session_id": "sess_def456",
  "metadata": {
    "source": "website",
    "device": "mobile",
    "utm_source": "google"
  }
}
```

**Response:**
```json
{
  "tryon_id": "tryon_123abc",
  "status": "processing",
  "photo_id": "photo_abc123",
  "product_id": "prod_abc123",
  "estimated_time": 15,
  "created_at": "2026-02-09T14:30:00Z"
}
```

### 3. Get Try-On Result

Retrieve the generated try-on image.

**Endpoint:** `GET /tryons/{tryon_id}`

**Authentication:** Required (scope: `tryons:read`)

**Response (Processing):**
```json
{
  "id": "tryon_123abc",
  "status": "processing",
  "progress": 65,
  "estimated_time_remaining": 8
}
```

**Response (Completed):**
```json
{
  "id": "tryon_123abc",
  "status": "completed",
  "photo_id": "photo_abc123",
  "product_id": "prod_abc123",
  "result_url": "https://cdn.styleswap.com/tryons/tryon_123abc.jpg",
  "result_thumbnail_url": "https://cdn.styleswap.com/tryons/tryon_123abc_thumb.jpg",
  "confidence_score": 0.94,
  "size": "M",
  "color": "Blue",
  "garment_part": "top",
  "customer_id": "cust_xyz789",
  "credits_used": 1,
  "generated_at": "2026-02-09T14:31:15Z",
  "expires_at": "2026-03-09T14:31:15Z"
}
```

**Response (Failed):**
```json
{
  "id": "tryon_123abc",
  "status": "failed",
  "error_code": "INVALID_PHOTO_QUALITY",
  "error_message": "Photo quality is too low. Please upload a clearer image.",
  "failed_at": "2026-02-09T14:31:15Z"
}
```

### 4. List Try-Ons

Retrieve a list of try-ons with optional filtering.

**Endpoint:** `GET /tryons?customer_id=cust_xyz789&status=completed&limit=50`

**Authentication:** Required (scope: `tryons:read`)

**Query Parameters:**
- `customer_id` (string): Filter by customer
- `product_id` (string): Filter by product
- `status` (string): Filter by status (processing, completed, failed)
- `date_from` (ISO 8601): Filter by start date
- `date_to` (ISO 8601): Filter by end date
- `page` (integer): Page number
- `limit` (integer): Items per page (max: 500)

**Response:**
```json
{
  "data": [
    {
      "id": "tryon_123abc",
      "status": "completed",
      "product_id": "prod_abc123",
      "customer_id": "cust_xyz789",
      "result_url": "https://cdn.styleswap.com/tryons/tryon_123abc.jpg",
      "confidence_score": 0.94,
      "credits_used": 1,
      "generated_at": "2026-02-09T14:31:15Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "pages": 25
  }
}
```

### 5. Save Try-On

Save a try-on to a customer's account.

**Endpoint:** `POST /tryons/{tryon_id}/save`

**Authentication:** Required (scope: `tryons:write`)

**Request Body:**
```json
{
  "customer_id": "cust_xyz789",
  "collection_name": "My Favorites",
  "notes": "Love this look!"
}
```

**Response:**
```json
{
  "id": "tryon_123abc",
  "saved": true,
  "collection_id": "coll_456def",
  "saved_at": "2026-02-09T14:32:00Z"
}
```

### 6. Share Try-On

Generate a shareable link for a try-on.

**Endpoint:** `POST /tryons/{tryon_id}/share`

**Authentication:** Required (scope: `tryons:write`)

**Request Body:**
```json
{
  "expiration_days": 7,
  "allow_download": true,
  "message": "Check out my new look!"
}
```

**Response:**
```json
{
  "id": "tryon_123abc",
  "share_url": "https://styleswap.com/share/share_xyz789",
  "share_token": "share_xyz789",
  "expires_at": "2026-02-16T14:32:00Z",
  "allow_download": true
}
```

### 7. Delete Try-On

Remove a try-on from the system.

**Endpoint:** `DELETE /tryons/{tryon_id}`

**Authentication:** Required (scope: `tryons:write`)

**Response:**
```json
{
  "id": "tryon_123abc",
  "deleted": true,
  "deleted_at": "2026-02-09T14:33:00Z"
}
```

---

## Customer Management

### 1. Create Customer

Register a new customer in the StyleSwap system.

**Endpoint:** `POST /customers`

**Authentication:** Required (scope: `customers:write`)

**Request Body:**
```json
{
  "external_id": "cust_xyz789",
  "email": "customer@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "+1-555-0123",
  "gender": "Female",
  "date_of_birth": "1990-05-15",
  "country": "US",
  "state": "CA",
  "city": "Los Angeles",
  "metadata": {
    "vip": true,
    "loyalty_tier": "gold"
  }
}
```

**Response:**
```json
{
  "id": "cust_abc123",
  "external_id": "cust_xyz789",
  "email": "customer@example.com",
  "first_name": "Jane",
  "created_at": "2026-02-09T14:30:00Z"
}
```

### 2. Get Customer

Retrieve customer details.

**Endpoint:** `GET /customers/{customer_id}`

**Authentication:** Required (scope: `customers:read`)

**Response:**
```json
{
  "id": "cust_abc123",
  "external_id": "cust_xyz789",
  "email": "customer@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "+1-555-0123",
  "gender": "Female",
  "country": "US",
  "tryons_count": 12,
  "total_credits_used": 12,
  "last_tryon_at": "2026-02-08T10:30:00Z",
  "created_at": "2026-02-09T14:30:00Z",
  "updated_at": "2026-02-09T14:30:00Z"
}
```

### 3. Update Customer

Modify customer information.

**Endpoint:** `PUT /customers/{customer_id}`

**Authentication:** Required (scope: `customers:write`)

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "phone": "+1-555-0456",
  "metadata": {
    "vip": false,
    "loyalty_tier": "silver"
  }
}
```

**Response:**
```json
{
  "id": "cust_abc123",
  "email": "newemail@example.com",
  "updated_at": "2026-02-09T14:35:00Z"
}
```

### 4. List Customers

Retrieve a paginated list of customers.

**Endpoint:** `GET /customers?page=1&limit=50&country=US`

**Authentication:** Required (scope: `customers:read`)

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `country` (string): Filter by country
- `search` (string): Search by name or email
- `date_from` (ISO 8601): Filter by creation date

**Response:**
```json
{
  "data": [
    {
      "id": "cust_abc123",
      "email": "customer@example.com",
      "first_name": "Jane",
      "tryons_count": 12,
      "created_at": "2026-02-09T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 50000,
    "pages": 1000
  }
}
```

---

## Analytics & Reporting

### 1. Get Account Analytics

Retrieve high-level analytics for your account.

**Endpoint:** `GET /analytics/account?date_from=2026-01-01&date_to=2026-02-09`

**Authentication:** Required (scope: `analytics:read`)

**Query Parameters:**
- `date_from` (ISO 8601): Start date
- `date_to` (ISO 8601): End date
- `granularity` (string): daily, weekly, monthly

**Response:**
```json
{
  "period": {
    "from": "2026-01-01",
    "to": "2026-02-09"
  },
  "summary": {
    "total_tryons": 45000,
    "total_customers": 12500,
    "total_credits_used": 45000,
    "average_confidence_score": 0.92,
    "total_shares": 8500,
    "total_saves": 6200
  },
  "daily_data": [
    {
      "date": "2026-02-09",
      "tryons": 1200,
      "new_customers": 150,
      "credits_used": 1200,
      "shares": 180,
      "saves": 95
    }
  ]
}
```

### 2. Get Product Analytics

Retrieve analytics for a specific product.

**Endpoint:** `GET /analytics/products/{product_id}?date_from=2026-01-01&date_to=2026-02-09`

**Authentication:** Required (scope: `analytics:read`)

**Response:**
```json
{
  "product_id": "prod_abc123",
  "product_name": "Blue Cotton T-Shirt",
  "period": {
    "from": "2026-01-01",
    "to": "2026-02-09"
  },
  "metrics": {
    "total_tryons": 1250,
    "unique_customers": 890,
    "conversion_rate": 0.18,
    "average_confidence_score": 0.94,
    "most_tried_size": "M",
    "most_tried_color": "Blue",
    "total_shares": 125,
    "total_saves": 95
  },
  "daily_data": [
    {
      "date": "2026-02-09",
      "tryons": 45,
      "unique_customers": 35,
      "conversion_rate": 0.22,
      "shares": 5,
      "saves": 3
    }
  ]
}
```

### 3. Get Customer Analytics

Retrieve analytics for a specific customer.

**Endpoint:** `GET /analytics/customers/{customer_id}`

**Authentication:** Required (scope: `analytics:read`)

**Response:**
```json
{
  "customer_id": "cust_abc123",
  "customer_name": "Jane Doe",
  "metrics": {
    "total_tryons": 12,
    "total_purchases": 5,
    "purchase_rate": 0.42,
    "total_spent": 249.95,
    "average_order_value": 49.99,
    "favorite_category": "Tops",
    "favorite_size": "M",
    "favorite_color": "Blue"
  },
  "tryons": [
    {
      "id": "tryon_123abc",
      "product_name": "Blue Cotton T-Shirt",
      "generated_at": "2026-02-08T10:30:00Z",
      "purchased": true,
      "purchase_date": "2026-02-08T11:45:00Z"
    }
  ]
}
```

### 4. Export Analytics Report

Generate and download a detailed analytics report.

**Endpoint:** `POST /analytics/export`

**Authentication:** Required (scope: `analytics:read`)

**Request Body:**
```json
{
  "date_from": "2026-01-01",
  "date_to": "2026-02-09",
  "format": "csv",
  "metrics": [
    "tryons",
    "conversions",
    "customers",
    "revenue",
    "product_performance"
  ]
}
```

**Response:**
```json
{
  "export_id": "export_123abc",
  "status": "generating",
  "format": "csv",
  "estimated_time": 30,
  "created_at": "2026-02-09T14:30:00Z"
}
```

### 5. Get Export Status

Check the status of an export job.

**Endpoint:** `GET /analytics/export/{export_id}`

**Authentication:** Required (scope: `analytics:read`)

**Response (Completed):**
```json
{
  "export_id": "export_123abc",
  "status": "completed",
  "download_url": "https://cdn.styleswap.com/exports/export_123abc.csv",
  "file_size": 5242880,
  "expires_at": "2026-02-16T14:30:00Z",
  "completed_at": "2026-02-09T14:35:00Z"
}
```

---

## Webhooks

### Webhook Events

StyleSwap can send real-time notifications to your application when events occur.

**Supported Events:**
- `tryon.generated` - Try-on successfully generated
- `tryon.failed` - Try-on generation failed
- `tryon.shared` - Customer shared a try-on
- `tryon.saved` - Customer saved a try-on
- `customer.created` - New customer registered
- `product.created` - New product added
- `product.updated` - Product information updated
- `credits.low` - Account credits running low

### 1. Register Webhook Endpoint

Register a webhook endpoint to receive events.

**Endpoint:** `POST /webhooks`

**Authentication:** Required (scope: `webhooks:write`)

**Request Body:**
```json
{
  "url": "https://your-domain.com/webhooks/styleswap",
  "events": [
    "tryon.generated",
    "tryon.failed",
    "tryon.shared",
    "customer.created"
  ],
  "active": true,
  "secret": "your_webhook_secret"
}
```

**Response:**
```json
{
  "id": "webhook_123abc",
  "url": "https://your-domain.com/webhooks/styleswap",
  "events": ["tryon.generated", "tryon.failed", "tryon.shared", "customer.created"],
  "active": true,
  "created_at": "2026-02-09T14:30:00Z"
}
```

### 2. Webhook Payload Example

When an event occurs, StyleSwap sends a POST request to your endpoint:

**Headers:**
```
Content-Type: application/json
X-StyleSwap-Signature: sha256=abcd1234efgh5678...
X-StyleSwap-Event: tryon.generated
X-StyleSwap-Timestamp: 1644415800
```

**Body (tryon.generated event):**
```json
{
  "event": "tryon.generated",
  "timestamp": 1644415800,
  "data": {
    "id": "tryon_123abc",
    "status": "completed",
    "photo_id": "photo_abc123",
    "product_id": "prod_abc123",
    "customer_id": "cust_xyz789",
    "result_url": "https://cdn.styleswap.com/tryons/tryon_123abc.jpg",
    "confidence_score": 0.94,
    "credits_used": 1,
    "generated_at": "2026-02-09T14:31:15Z"
  }
}
```

### 3. Verify Webhook Signature

Verify that webhook requests are from StyleSwap by checking the signature:

**Python Example:**
```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

# In your webhook handler:
signature = request.headers.get('X-StyleSwap-Signature').split('=')[1]
payload = request.get_data(as_text=True)
secret = 'your_webhook_secret'

if verify_webhook(payload, signature, secret):
    # Process webhook
    pass
else:
    # Invalid signature
    return 401
```

### 4. List Webhooks

Retrieve all registered webhook endpoints.

**Endpoint:** `GET /webhooks`

**Authentication:** Required (scope: `webhooks:read`)

**Response:**
```json
{
  "data": [
    {
      "id": "webhook_123abc",
      "url": "https://your-domain.com/webhooks/styleswap",
      "events": ["tryon.generated", "tryon.failed"],
      "active": true,
      "last_triggered": "2026-02-09T14:31:15Z",
      "created_at": "2026-02-09T14:30:00Z"
    }
  ]
}
```

### 5. Update Webhook

Modify a webhook endpoint.

**Endpoint:** `PUT /webhooks/{webhook_id}`

**Authentication:** Required (scope: `webhooks:write`)

**Request Body:**
```json
{
  "url": "https://new-domain.com/webhooks/styleswap",
  "events": ["tryon.generated", "tryon.failed", "tryon.shared"],
  "active": true
}
```

**Response:**
```json
{
  "id": "webhook_123abc",
  "url": "https://new-domain.com/webhooks/styleswap",
  "updated_at": "2026-02-09T14:35:00Z"
}
```

### 6. Delete Webhook

Remove a webhook endpoint.

**Endpoint:** `DELETE /webhooks/{webhook_id}`

**Authentication:** Required (scope: `webhooks:write`)

**Response:**
```json
{
  "id": "webhook_123abc",
  "deleted": true,
  "deleted_at": "2026-02-09T14:36:00Z"
}
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request body is invalid",
    "details": {
      "field": "price",
      "issue": "Price must be a positive number"
    },
    "request_id": "req_abc123"
  }
}
```

### HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `INVALID_REQUEST` | Request format is invalid | Check request body and parameters |
| `AUTHENTICATION_FAILED` | Authentication credentials are invalid | Verify API key and token |
| `INSUFFICIENT_CREDITS` | Account has insufficient credits | Purchase more credits |
| `INVALID_PHOTO_QUALITY` | Uploaded photo quality is too low | Upload a clearer, higher-resolution image |
| `PRODUCT_NOT_FOUND` | Specified product does not exist | Verify product ID |
| `CUSTOMER_NOT_FOUND` | Specified customer does not exist | Verify customer ID |
| `RATE_LIMIT_EXCEEDED` | Too many requests in short time | Implement exponential backoff |
| `INVALID_FILE_FORMAT` | Uploaded file format is not supported | Use JPEG or PNG format |
| `FILE_TOO_LARGE` | Uploaded file exceeds size limit | Reduce file size to under 10MB |

---

## Code Examples

### Example 1: Complete Try-On Workflow (Node.js)

```javascript
const axios = require('axios');

const API_BASE = 'https://api.styleswap.com/v1';
const CLIENT_ID = 'your_client_id';
const CLIENT_SECRET = 'your_client_secret';

let accessToken = null;

// Step 1: Authenticate
async function authenticate() {
  const response = await axios.post(`${API_BASE}/auth/token`, {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'client_credentials'
  });
  
  accessToken = response.data.access_token;
  console.log('Authenticated successfully');
}

// Step 2: Upload customer photo
async function uploadPhoto(filePath) {
  const FormData = require('form-data');
  const fs = require('fs');
  
  const form = new FormData();
  form.append('photo', fs.createReadStream(filePath));
  form.append('customer_id', 'cust_xyz789');
  
  const response = await axios.post(
    `${API_BASE}/tryons/upload-photo`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  console.log('Photo uploaded:', response.data.photo_id);
  return response.data.photo_id;
}

// Step 3: Generate try-on
async function generateTryOn(photoId, productId) {
  const response = await axios.post(
    `${API_BASE}/tryons/generate`,
    {
      photo_id: photoId,
      product_id: productId,
      size: 'M',
      color: 'Blue',
      garment_part: 'top',
      customer_id: 'cust_xyz789'
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  console.log('Try-on generation started:', response.data.tryon_id);
  return response.data.tryon_id;
}

// Step 4: Poll for result
async function getTryOnResult(tryonId) {
  let completed = false;
  let result = null;
  
  while (!completed) {
    const response = await axios.get(
      `${API_BASE}/tryons/${tryonId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (response.data.status === 'completed') {
      completed = true;
      result = response.data;
      console.log('Try-on completed:', result.result_url);
    } else if (response.data.status === 'failed') {
      throw new Error(`Try-on failed: ${response.data.error_message}`);
    } else {
      console.log(`Processing... ${response.data.progress}%`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
  }
  
  return result;
}

// Main workflow
async function main() {
  try {
    await authenticate();
    const photoId = await uploadPhoto('./customer-photo.jpg');
    const tryonId = await generateTryOn(photoId, 'prod_abc123');
    const result = await getTryOnResult(tryonId);
    console.log('Final result URL:', result.result_url);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

main();
```

### Example 2: Bulk Product Upload (Python)

```python
import requests
import csv

API_BASE = 'https://api.styleswap.com/v1'
CLIENT_ID = 'your_client_id'
CLIENT_SECRET = 'your_client_secret'

def authenticate():
    response = requests.post(
        f'{API_BASE}/auth/token',
        json={
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'grant_type': 'client_credentials'
        }
    )
    return response.json()['access_token']

def bulk_upload_products(csv_file, access_token):
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    with open(csv_file, 'rb') as f:
        files = {'file': f}
        response = requests.post(
            f'{API_BASE}/products/bulk-upload',
            files=files,
            data={'update_existing': 'true'},
            headers=headers
        )
    
    return response.json()

def check_upload_status(job_id, access_token):
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    response = requests.get(
        f'{API_BASE}/products/bulk-upload/{job_id}',
        headers=headers
    )
    
    return response.json()

# Main
access_token = authenticate()
result = bulk_upload_products('products.csv', access_token)
job_id = result['job_id']

print(f'Upload started: {job_id}')

# Check status
import time
while True:
    status = check_upload_status(job_id, access_token)
    if status['status'] == 'completed':
        print(f"Upload completed: {status['succeeded']} succeeded, {status['failed']} failed")
        break
    print(f"Processing... {status['processed']}/{status['total_products']}")
    time.sleep(5)
```

### Example 3: Webhook Handler (Flask)

```python
from flask import Flask, request
import hmac
import hashlib
import json

app = Flask(__name__)
WEBHOOK_SECRET = 'your_webhook_secret'

def verify_signature(payload, signature):
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

@app.route('/webhooks/styleswap', methods=['POST'])
def handle_webhook():
    # Verify signature
    signature = request.headers.get('X-StyleSwap-Signature', '').split('=')[1]
    payload = request.get_data(as_text=True)
    
    if not verify_signature(payload, signature):
        return {'error': 'Invalid signature'}, 401
    
    # Parse event
    event = request.json
    event_type = event['event']
    data = event['data']
    
    # Handle different event types
    if event_type == 'tryon.generated':
        print(f"Try-on generated: {data['id']}")
        # Update your database, send notifications, etc.
        
    elif event_type == 'tryon.failed':
        print(f"Try-on failed: {data['id']} - {data['error_message']}")
        # Handle failure
        
    elif event_type == 'customer.created':
        print(f"New customer: {data['id']}")
        # Send welcome email, etc.
    
    return {'success': True}, 200

if __name__ == '__main__':
    app.run(port=5000)
```

---

## Best Practices

### 1. Authentication & Security

- **Store credentials securely:** Never commit API keys to version control. Use environment variables or secure vaults.
- **Use HTTPS only:** All API requests must use HTTPS to encrypt data in transit.
- **Rotate tokens regularly:** Implement token rotation every 30 days.
- **Implement rate limiting:** Respect rate limits and implement exponential backoff for retries.
- **Validate webhook signatures:** Always verify webhook signatures to ensure requests are from StyleSwap.

### 2. Error Handling

- **Implement retry logic:** Use exponential backoff for failed requests (1s, 2s, 4s, 8s, etc.).
- **Handle rate limits gracefully:** When receiving 429 responses, wait and retry.
- **Log errors:** Keep detailed logs of API errors for debugging.
- **Provide user feedback:** Display meaningful error messages to end users.

### 3. Performance Optimization

- **Batch requests:** Use bulk upload endpoints instead of individual product creation.
- **Implement caching:** Cache product data and analytics locally to reduce API calls.
- **Use webhooks:** Subscribe to webhooks instead of polling for updates.
- **Optimize image uploads:** Compress images before uploading to reduce bandwidth.

### 4. Data Management

- **Sync regularly:** Keep your product catalog in sync with StyleSwap (daily or weekly).
- **Clean up old data:** Delete expired try-ons and unused photos to manage storage.
- **Backup data:** Regularly export analytics reports for backup and analysis.
- **Privacy compliance:** Ensure customer data handling complies with GDPR and local regulations.

### 5. Monitoring & Analytics

- **Track key metrics:** Monitor try-on volume, conversion rates, and customer satisfaction.
- **Set up alerts:** Configure alerts for low credits, high error rates, or unusual activity.
- **Review analytics regularly:** Analyze performance data to identify optimization opportunities.
- **A/B test:** Test different UI/UX approaches to improve conversion rates.

---

## Support & Resources

**Documentation:** https://docs.styleswap.com

**API Status:** https://status.styleswap.com

**Community Forum:** https://community.styleswap.com

**Email Support:** support@styleswap.com

**Phone Support:** +1-800-STYLESWAP (Enterprise customers)

---

**Last Updated:** February 2026
**API Version:** 1.0.0
**Document Version:** 1.0
