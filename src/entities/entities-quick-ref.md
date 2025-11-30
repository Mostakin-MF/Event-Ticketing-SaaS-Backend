# Entity Classes - Quick Reference & Import Guide

## All 13 Entities Created (Following Your Project Structure)

### ✅ Created Files (in `src/entities/` folder)

```
src/entities/
├── user.entity.ts                    # UserEntity (provided)
├── tenant.entity.ts                  # TenantEntity (provided)
├── tenant-user.entity.ts             # TenantUserEntity (provided)
├── activity-log.entity.ts            # ActivityLogEntity (provided)
├── payment.entity.ts                 # PaymentEntity (provided)
├── webhook-event.entity.ts           # WebhookEventEntity (provided)
│
├── event.entity.ts                   # EventEntity (NEW)
├── event-session.entity.ts           # EventSessionEntity (NEW)
├── ticket-type.entity.ts             # TicketTypeEntity (NEW)
├── ticket.entity.ts                  # TicketEntity (NEW)
├── order.entity.ts                   # OrderEntity (NEW)
├── order-item.entity.ts              # OrderItemEntity (NEW)
└── discount-code.entity.ts           # DiscountCodeEntity (NEW)
```

---

## Entity Characteristics by Domain

### 1. **IDENTITY DOMAIN** (Multi-tenant foundation)
```ts
// UserEntity
- id (UUID)
- email (unique, global)
- passwordHash
- fullName
- isPlatformAdmin
- timestamps

// TenantEntity
- id (UUID)
- name
- slug (unique)
- brandingSettings (jsonb)
- status (active|suspended|pending)
- timestamps

// TenantUserEntity
- id (UUID)
- tenantId (FK)
- userId (FK)
- role (TenantAdmin|staff)
- status (active|inactive|suspended)
- invitedAt, lastLoginAt
- timestamps
```

### 2. **EVENTS DOMAIN** (Event management)
```ts
// EventEntity
- id (UUID)
- tenantId (FK) ⭐ Multi-tenant
- name
- slug (unique per tenant)
- description
- venue, city, country
- startAt, endAt
- status (DRAFT|PUBLISHED|ARCHIVED)
- isPublic
- heroImageUrl
- seoMeta (jsonb)
- timestamps
- Relations: Tenant, TicketTypes[], Orders[], Sessions[], DiscountCodes[]

// EventSessionEntity
- id (UUID)
- eventId (FK)
- title, description
- startAt, endAt, venue
- timestamps
- Relations: Event

// TicketTypeEntity
- id (UUID)
- eventId (FK)
- name, description
- priceCents, currency (USD|BDT|etc)
- quantityTotal, quantitySold
- salesStart, salesEnd
- status (ACTIVE|INACTIVE|HIDDEN)
- timestamps
- Relations: Event, Tickets[], OrderItems[]
```

### 3. **ORDERS DOMAIN** (Checkout & purchases)
```ts
// OrderEntity
- id (UUID)
- tenantId (FK) ⭐ Multi-tenant
- eventId (FK)
- buyerEmail, buyerName
- totalCents, currency
- status (PENDING|PAID|CANCELLED|REFUNDED)
- paymentIntentId (Stripe ref)
- publicLookupToken (for attendee self-service)
- timestamps
- Relations: Tenant, Event, OrderItems[], Tickets[], Payments[]

// OrderItemEntity
- id (UUID)
- orderId (FK)
- ticketTypeId (FK)
- unitPriceCents, quantity
- subtotalCents
- Relations: Order, TicketType
```

### 4. **TICKETS DOMAIN** (QR codes & check-in)
```ts
// TicketEntity
- id (UUID)
- orderId (FK)
- ticketTypeId (FK)
- attendeeName, attendeeEmail
- qrCodePayload (signed payload or ID)
- qrSignature (optional)
- status (PENDING|ACTIVE|CANCELLED|USED)
- checkedInAt (timestamp, null = not checked in)
- seatLabel (optional)
- timestamps
- Relations: Order, TicketType, ActivityLogs[]
```

### 5. **PAYMENTS DOMAIN** (Payment processing)
```ts
// PaymentEntity
- id (UUID)
- orderId (FK)
- provider (stripe|bkash|nagad|rocket|other)
- providerReference (Stripe charge ID, etc)
- status (pending|completed|failed|refunded)
- amountCents, currency
- processedAt
- payload (jsonb, raw provider response)
- createdAt
- Relations: Order
```

### 6. **DISCOUNTS DOMAIN** (Promo codes)
```ts
// DiscountCodeEntity
- id (UUID)
- eventId (FK)
- code (unique, e.g. "EARLY30")
- description
- maxRedemptions, timesRedeemed
- discountType (PERCENTAGE|FIXED_AMOUNT)
- discountValue (e.g., 30 for 30% or 500 for 500 BDT)
- startsAt, expiresAt
- status (ACTIVE|INACTIVE|EXPIRED)
- timestamps
- Relations: Event
```

### 7. **AUDIT DOMAIN** (Activity tracking)
```ts
// ActivityLogEntity
- id (UUID)
- tenantId (FK, nullable for platform-level)
- actorId (FK, User who performed action)
- action (CHECKIN_SUCCESS|CHECKIN_FAILED|INVALID_QR|DUPLICATE_SCAN|etc)
- metadata (jsonb, custom data)
- createdAt
- Relations: Tenant, Actor(User)

// WebhookEventEntity
- id (UUID)
- provider (stripe|bkash|nagad|rocket|mailer|other)
- eventType (charge.completed, order.confirmed, etc)
- payload (jsonb, full webhook data)
- receivedAt, processedAt
- status (pending|processed|failed)
- errorMessage (if failed)
- createdAt
```

---

## How to Use in Your Modules

### Staff Module Example
```ts
// src/staff/staff.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

// Import the entity classes
import { UserEntity } from '../entities/user.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { ActivityLogEntity } from '../entities/activity-log.entity';
import { TicketEntity } from '../entities/ticket.entity';
import { OrderEntity } from '../entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      TenantEntity,
      ActivityLogEntity,
      TicketEntity,
      OrderEntity,
    ]),
  ],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
```

### Event Module Example
```ts
// src/event/event.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventEntity } from '../entities/event.entity';
import { EventSessionEntity } from '../entities/event-session.entity';
import { TicketTypeEntity } from '../entities/ticket-type.entity';
import { OrderEntity } from '../entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      EventSessionEntity,
      TicketTypeEntity,
      OrderEntity,
    ]),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
```

### Order Module Example
```ts
// src/order/order.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { PaymentEntity } from '../entities/payment.entity';
import { TicketEntity } from '../entities/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      PaymentEntity,
      TicketEntity,
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
```

---

## Database Columns Reference

### Naming Conventions (All Entities)
- Primary key: `id` (UUID)
- Foreign keys: `{entity}_id` (snake_case)
  - Example: `order_id`, `tenant_id`, `event_id`
- Boolean flags: `is_{property}`
  - Example: `is_public`, `is_active`
- Timestamps: `created_at`, `updated_at`
  - Example: `start_at`, `end_at`, `checked_in_at`
- JSON data: ends with `_settings`, `_meta`, or `_payload`
  - Example: `branding_settings`, `seo_meta`, `metadata`

### Enum Types (Matching Your Project)
```ts
// Order Status
'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED'

// Event Status
'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

// Ticket Status
'PENDING' | 'ACTIVE' | 'CANCELLED' | 'USED'

// Payment Provider
'stripe' | 'bkash' | 'nagad' | 'rocket' | 'other'

// Payment Status
'pending' | 'completed' | 'failed' | 'refunded'

// TicketType Status
'ACTIVE' | 'INACTIVE' | 'HIDDEN'

// Discount Status
'ACTIVE' | 'INACTIVE' | 'EXPIRED'

// Discount Type
'PERCENTAGE' | 'FIXED_AMOUNT'

// Activity Action
'CHECKIN_SUCCESS' | 'CHECKIN_FAILED' | 'INVALID_QR' | 'DUPLICATE_SCAN' | ...

// User Role
'TenantAdmin' | 'staff'

// Tenant Status
'active' | 'suspended' | 'pending'

// WebhookEvent Status
'pending' | 'processed' | 'failed'
```

---

## Quick Relationships Diagram

```
UserEntity
    ↓ (many users, one User per login)
TenantEntity ← (owner/organizer)
    ↓ (one tenant, many events/orders)
├→ EventEntity
│    ↓
│    ├→ EventSessionEntity
│    ├→ TicketTypeEntity
│    │    ↓
│    │    ├→ TicketEntity
│    │    └→ OrderItemEntity
│    └→ DiscountCodeEntity
│
└→ OrderEntity
     ↓
     ├→ OrderItemEntity → TicketTypeEntity
     ├→ TicketEntity (one per unit)
     └→ PaymentEntity

ActivityLogEntity → UserEntity (actor)
                 → TenantEntity (scope)

WebhookEventEntity (external events, payment/email callbacks)
```

---

## Validation Rules (Use in Your Services)

```ts
// EventEntity
- slug must be unique per tenant
- startAt < endAt
- status in [DRAFT, PUBLISHED, ARCHIVED]

// TicketTypeEntity
- priceCents > 0
- quantityTotal > quantitySold
- salesStart < salesEnd (if both set)

// OrderEntity
- totalCents = sum(orderItems.subtotalCents)
- status updated via PaymentEntity confirmations
- paymentIntentId set after Stripe integration

// TicketEntity
- qrCodePayload unique
- one ticket per OrderItem
- checkedInAt can only be set once

// PaymentEntity
- amountCents must match order.totalCents
- provider reference must be validated with external API

// DiscountCodeEntity
- code must be alphanumeric, max 50 chars
- timesRedeemed ≤ maxRedemptions (if set)
- current date must be between startsAt and expiresAt
```

---

## Next Steps

1. ✅ Copy all entity files to `src/entities/`
2. ✅ Update `AppModule` to register all entities in TypeOrmModule
3. ✅ Create migrations using TypeORM CLI:
   ```bash
   npm run typeorm migration:generate -- src/migrations/CreateAllEntities
   npm run typeorm migration:run
   ```
4. ✅ Import entities in each module (Staff, Event, Order, etc.)
5. ✅ Implement services using TypeORM repositories
6. ✅ Add validation pipes for DTOs
