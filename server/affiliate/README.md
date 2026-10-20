# Affiliate commission — integration contract

Any new purchase type that should earn affiliate commission MUST call
`calculateAndRecordCommission` from `server/affiliate/commission.ts`.

## Required inputs

| Field | Type | Source |
|---|---|---|
| `userId` | number | the referred customer's `users.id` |
| `affiliateLinkId` | number | from `affiliateAttributions` for that user |
| `attributionId` | number | from `affiliateAttributions` |
| `packageId` | string | the canonical product/package id in the purchasing system |
| `purchaseCategory` | `'individual' \| 'business'` | the verified server-side category |
| `amountCents` | integer | the verified paid amount in cents |
| `currency` | string | ISO code; must match package |
| `sourceType` | string | a stable identifier for the purchase system, e.g. `'yoco_credit_purchase'` |
| `sourceId` | string | the purchase's own stable id; must be unique per system |
| `eventTimestamp` | Date | when the purchase cleared |

## Rules

- The unique constraint `(source_type, source_id)` enforces one commission
  per purchase. A repeated call with the same pair is a no-op.
- `purchaseCategory` is re-verified against the canonical package record
  inside `calculateAndRecordCommission`. A mismatch throws — the caller
  cannot forge the category.
- `amountCents` is re-verified against the canonical package price. A
  mismatch throws — the caller cannot forge the amount.
- Commission status transitions `pending → approved` atomically with the
  insert. `approved → paid` happens via `markPayoutBatchPaid`. `→ reversed`
  happens via admin action (`reverseCommission`).
- Business purchases never contribute to the monthly tier aggregate.

## What this contract does NOT cover

Shop orders (§11 of the confirmed requirements) are not yet wired. When
they are, the checkout must:
1. On purchase completion, call `calculateAndRecordCommission` with
   `sourceType='shop_order'` and `sourceId=<shop_orders.id>`.
2. Expose a refund event that calls `reverseCommission` for the same
   `(source_type, source_id)` pair.