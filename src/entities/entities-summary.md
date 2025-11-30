# Complete Entity Classes - Event Ticketing SaaS

## Summary of All Entities (14 Tables)

All entities follow your project format with:
- ✅ `snake_case` column names
- ✅ UUID primary keys
- ✅ Proper enum types (matching your existing entities)
- ✅ Multi-tenant scoping via `tenant_id`
- ✅ Timestamps: `created_at`, `updated_at`
- ✅ TypeORM relations with cascading
- ✅ Index annotations for performance

---

## Entity List & Files Created

### Core Identity Entities (Already Provided)
1. **UserEntity** (`user.entity.ts`) - Platform users
2. **TenantEntity** (`tenant.entity.ts`) - Event organizers/tenants
3. **TenantUserEntity** (`tenant-user.entity.ts`) - User ↔ Tenant mapping (M:N)

### Events & Tickets
4. **EventEntity** (`event.entity.ts`) - Event definitions (1:N with Tenant)
5. **EventSessionEntity** (`event-session.entity.ts`) - Multi-day/slot blocks (1:N with Event)
6. **TicketTypeEntity** (`ticket-type.entity.ts`) - Pricing tiers (1:N with Event)
7. **TicketEntity** (`ticket.entity.ts`) - Individual QR codes (1:N with Order)

### Orders & Payments
8. **OrderEntity** (`order.entity.ts`) - Order records (1:N with Tenant & Event)
9. **OrderItemEntity** (`order-item.entity.ts`) - Line items (1:N with Order)
10. **PaymentEntity** (`payment.entity.ts`) - Payment transactions (1:N with Order)

### Discounts
11. **DiscountCodeEntity** (`discount-code.entity.ts`) - Promotions (1:N with Event)

### Operations & Audit
12. **ActivityLogEntity** (`activity-log.entity.ts`) - Staff/Admin actions (1:N with User/Tenant)
13. **WebhookEventEntity** (`webhook-event.entity.ts`) - Payment/Email callbacks

---

## Key Relationships Summary

### 1:N Relationships
- Tenant → Events
- Tenant → Orders
- Tenant → ActivityLogs
- Event → TicketTypes
- Event → EventSessions
- Event → Orders
- Event → DiscountCodes
- Order → OrderItems
- Order → Tickets
- Order → Payments
- TicketType → Tickets
- TicketType → OrderItems

### M:N Relationships
- User ↔ Tenant (via TenantUserEntity)

### Self/External
- ActivityLog → User (actor_id)
- ActivityLog → Tenant (tenant_id)

---

## Multi-Tenancy Implementation

All tenant-scoped tables include:
```ts
@Column({ name: 'tenant_id', type: 'uuid' })
tenantId: string;

@ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'tenant_id' })
tenant: TenantEntity;
```

This ensures:
- ✅ Every row is tied to a tenant
- ✅ Queries are always filtered by `tenantId`
- ✅ Cascading deletes when tenant is removed
- ✅ Composite indexes for performance

---

## Entity Imports (for your modules)

### Staff Module
```ts
import { StaffEntity } from './entities/staff.entity';
import { ActivityLogEntity } from './entities/activity-log.entity';
import { TicketEntity } from './entities/ticket.entity';
import { OrderEntity } from './entities/order.entity';
import { TicketTypeEntity } from './entities/ticket-type.entity';
```

### Event Module
```ts
import { EventEntity } from './entities/event.entity';
import { EventSessionEntity } from './entities/event-session.entity';
import { TicketTypeEntity } from './entities/ticket-type.entity';
```

### Order Module
```ts
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { PaymentEntity } from './entities/payment.entity';
```

### Discount Module
```ts
import { DiscountCodeEntity } from './entities/discount-code.entity';
```

### Webhook Module
```ts
import { WebhookEventEntity } from './entities/webhook-event.entity';
```

---

## TypeORM Migration Registration

Add to your `AppModule.forRoot()`:

```ts
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    UserEntity,
    TenantEntity,
    TenantUserEntity,
    EventEntity,
    EventSessionEntity,
    TicketTypeEntity,
    TicketEntity,
    OrderEntity,
    OrderItemEntity,
    PaymentEntity,
    DiscountCodeEntity,
    ActivityLogEntity,
    WebhookEventEntity,
  ],
  synchronize: false, // Use migrations in production
  migrations: ['src/migrations/*.ts'],
  migrationsRun: true,
})
```

---

## Validation Rules (for Pipes)

When creating/updating entities, ensure:

| Entity | Validation |
|--------|-----------|
| Event | `slug` unique per tenant, `startAt` < `endAt` |
| TicketType | `priceCents` > 0, `quantityTotal` > 0 |
| Order | `totalCents` matches sum of items |
| Ticket | `qrCodePayload` unique, one per OrderItem |
| DiscountCode | `code` unique per event, `startsAt` < `expiresAt` |
| Payment | `amountCents` matches order `totalCents` |

---

## Notes

- All entities use UUID primary keys for multi-tenancy safety
- Soft deletes can be added to StaffEntity (add `deletedAt` column)
- ActivityLog captures all tenant-scoped actions
- WebhookEvent stores raw payloads for debugging/replay
- Staff module builds on these core entities
