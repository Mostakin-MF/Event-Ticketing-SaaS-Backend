# Backend Architecture & Flow Documentation

**Project:** Event Ticketing SaaS Platform (Bangladesh)  
**Backend Framework:** NestJS 11  
**Database:** PostgreSQL with TypeORM  
**Last Updated:** 2025-01-27

## ⚠️ Implementation Status

**Current Status: Only Admin Module Implemented**

This documentation describes the complete architecture, but currently only the **Admin Module** is implemented. Other modules are pending implementation by team members:

- ✅ **Admin Module** - COMPLETE (Platform Admin functionality)
- ⏳ **TenantAdmin Module** - PENDING (to be implemented by team member)
- ⏳ **Staff Module** - PENDING (to be implemented by team member)
- ⏳ **Attendee Module** - PENDING (to be implemented by team member)

---

## Table of Contents

1. [Backend Architecture Overview](#backend-architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Request Flow Architecture](#request-flow-architecture)
5. [Authentication & Authorization Flow](#authentication--authorization-flow)
6. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
7. [Database Layer](#database-layer)
8. [Service Layer](#service-layer)
9. [Controller Layer](#controller-layer)
10. [Validation & Error Handling](#validation--error-handling)
11. [Payment Processing Flow](#payment-processing-flow)
12. [QR Code Generation & Validation Flow](#qr-code-generation--validation-flow)
13. [Check-in Process Flow](#check-in-process-flow)
14. [Webhook Processing Flow](#webhook-processing-flow)
15. [Security Measures](#security-measures)
16. [Data Flow Diagrams](#data-flow-diagrams)

---

## Backend Architecture Overview

The backend is built using **NestJS**, a progressive Node.js framework that provides a modular architecture pattern. The system follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Request                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Controller Layer (REST API)                 │
│  - Route handling                                         │
│  - Request/Response transformation                       │
│  - Input validation (DTOs)                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Guard Layer (Security)                      │
│  - JWT Authentication                                     │
│  - Role-based Authorization                              │
│  - Tenant Context Isolation                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Service Layer (Business Logic)              │
│  - Core business operations                               │
│  - Data transformation                                   │
│  - External service integration                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Repository Layer (TypeORM)                 │
│  - Database queries                                      │
│  - Entity relationships                                  │
│  - Transaction management                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Modular Design**: Each feature is organized into its own module (admin, tenant-admin, staff, attendee)
2. **Dependency Injection**: NestJS's built-in DI container manages all dependencies
3. **Separation of Concerns**: Clear boundaries between controllers, services, and repositories
4. **Multi-Tenancy**: Row-level isolation using `tenant_id` in all domain tables
5. **Type Safety**: Full TypeScript support with strict typing
6. **Validation**: Automatic request validation using class-validator and DTOs

---

## Technology Stack

### Core Framework
- **NestJS 11.0.1**: Progressive Node.js framework with TypeScript
- **TypeScript 5.7.3**: Type-safe JavaScript
- **Express**: HTTP server (underlying NestJS platform)

### Database & ORM
- **PostgreSQL**: Relational database
- **TypeORM 0.3.27**: Object-Relational Mapping
- **pg 8.16.3**: PostgreSQL client

### Authentication & Security
- **JWT**: JSON Web Tokens for stateless authentication
- **bcrypt 6.0.0**: Password hashing
- **HttpOnly Cookies**: Secure token storage

### Validation & Transformation
- **class-validator 0.14.2**: Decorator-based validation
- **class-transformer 0.5.1**: Object transformation

### Configuration
- **@nestjs/config 4.0.2**: Environment configuration management

### Payment Providers (Planned)
- **Stripe**: International card payments
- **bKash**: Mobile financial service (Bangladesh)
- **Nagad**: Mobile wallet (Bangladesh)
- **Rocket**: Mobile banking (Bangladesh)

### Currency & Localization
- **Currency**: BDT (Bangladeshi Taka)
- **Timezone**: Bangladesh Standard Time (BST, UTC+6)

---

## Project Structure

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── admin/                     # Platform admin module
│   │   ├── admin.module.ts        # Module definition
│   │   ├── admin.controller.ts   # REST endpoints
│   │   ├── admin.service.ts      # Business logic
│   │   ├── admin.dto.ts          # Data Transfer Objects
│   │   ├── user.entity.ts        # User entity
│   │   ├── tenant.entity.ts      # Tenant entity
│   │   ├── tenant-user.entity.ts # Tenant-User relationship
│   │   ├── payment.entity.ts     # Payment entity
│   │   ├── webhook-event.entity.ts # Webhook entity
│   │   └── activity-log.entity.ts # Activity log entity
│   │
│   ├── tenant-admin/             # ⏳ Tenant admin module (PENDING - other team member)
│   ├── staff/                     # ⏳ Staff module (PENDING - other team member)
│   └── attendee/                  # ⏳ Attendee module (PENDING - other team member)
│
├── test/                          # E2E tests
├── dist/                          # Compiled JavaScript
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
└── nest-cli.json                  # NestJS CLI config
```

### Module Organization

Each module follows the same structure:
- **Module**: Registers controllers, services, and imports
- **Controller**: Handles HTTP requests/responses
- **Service**: Contains business logic
- **DTOs**: Data validation and transformation
- **Entities**: Database models (TypeORM)

---

## Request Flow Architecture

### Complete Request Lifecycle

```
1. HTTP Request arrives
   ↓
2. NestJS receives request at main.ts
   ↓
3. Global ValidationPipe validates request body/query
   ↓
4. Route matching (Controller method)
   ↓
5. Guards execute (Authentication/Authorization)
   ↓
6. Interceptors (if any) - Tenant context, logging
   ↓
7. Controller method executes
   ↓
8. Service method called with validated data
   ↓
9. Service performs business logic
   ↓
10. Repository/TypeORM queries database
   ↓
11. Database returns data
   ↓
12. Service transforms/processes data
   ↓
13. Controller formats response
   ↓
14. Response sent to client
```

### Example: Creating a Tenant

```typescript
// 1. HTTP Request
POST /admin/tenants
Body: { "name": "Tech Conference", "slug": "tech-conf-2025" }

// 2. Controller receives request
@Post('tenants')
createTenant(@Body() createTenantDto: CreateTenantDto) {
  return this.adminService.createTenant(createTenantDto);
}

// 3. ValidationPipe validates DTO
// - Checks required fields
// - Transforms data types
// - Applies custom validators

// 4. Service executes business logic
async createTenant(dto: CreateTenantDto): Promise<TenantEntity> {
  // Check slug uniqueness
  // Create tenant entity
  // Save to database
  return this.tenantRepository.save(tenant);
}

// 5. Response returned
{
  "id": "uuid",
  "name": "Tech Conference",
  "slug": "tech-conf-2025",
  "status": "pending",
  "createdAt": "2025-01-27T..."
}
```

---

## Authentication & Authorization Flow

### Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. POST /auth/login { email, password }
       ▼
┌─────────────────────┐
│  Auth Controller    │
└──────┬──────────────┘
       │ 2. Validate credentials
       ▼
┌─────────────────────┐
│  Auth Service       │
│  - Find user        │
│  - Verify password  │
│  - Generate JWT     │
└──────┬──────────────┘
       │ 3. Create JWT token
       ▼
┌─────────────────────┐
│  Set HttpOnly Cookie│
│  (Secure, SameSite) │
└──────┬──────────────┘
       │ 4. Return user info
       ▼
┌─────────────┐
│   Client    │
│ (Cookie set)│
└─────────────┘
```

### Authorization Flow (Protected Routes)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Request with Cookie
       ▼
┌─────────────────────┐
│  JWT Auth Guard     │
│  - Extract token    │
│  - Verify JWT       │
│  - Decode payload   │
└──────┬──────────────┘
       │ 2. User context
       ▼
┌─────────────────────┐
│  Role Guard         │
│  - Check user role  │
│  - Verify permissions│
└──────┬──────────────┘
       │ 3. Authorized
       ▼
┌─────────────────────┐
│  Controller Method  │
└─────────────────────┘
```

### JWT Token Structure

```typescript
{
  sub: "user-uuid",           // User ID
  email: "admin@example.com",
  role: "platform_admin",     // or "tenant_admin", "staff"
  tenantId: "tenant-uuid",    // (if applicable)
  iat: 1234567890,            // Issued at
  exp: 1234571490             // Expires at
}
```

### Role-Based Access Control

| Role | Access Level | Modules |
|------|-------------|---------|
| **platform_admin** | Full system access | All modules, all tenants |
| **tenant_admin** | Tenant-scoped admin | Own tenant only |
| **staff** | Limited operations | Check-in, read-only views |
| **attendee** | Public access | Event browsing, ticket purchase |

---

## Multi-Tenancy Implementation

### Row-Level Tenancy

Every domain table includes `tenant_id` to isolate data:

```typescript
@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;  // ← Multi-tenancy key

  @Column()
  name: string;
  
  // ... other fields
}
```

### Tenant Context Guard

All tenant-scoped requests automatically filter by `tenant_id`:

```typescript
// Interceptor adds tenant context
@UseInterceptors(TenantContextInterceptor)
@Get('events')
getEvents(@Request() req) {
  // req.user.tenantId automatically used in queries
  return this.eventService.findAll(req.user.tenantId);
}
```

### Data Isolation Flow

```
1. User authenticates → JWT contains tenantId
   ↓
2. Request arrives → TenantContextInterceptor extracts tenantId
   ↓
3. Service method receives tenantId
   ↓
4. Repository queries automatically filter:
   WHERE tenant_id = :tenantId
   ↓
5. Only tenant's data returned
```

### Composite Uniqueness

Slugs and other identifiers are unique per tenant:

```typescript
// Event slug must be unique within tenant
@Column()
slug: string;  // Combined with tenant_id for uniqueness

// Query example:
WHERE tenant_id = :tenantId AND slug = :slug
```

---

## Database Layer

### TypeORM Entity Structure

Entities are TypeScript classes decorated with TypeORM decorators:

```typescript
@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'jsonb', nullable: true })
  brandingSettings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Entity Relationships

#### One-to-Many Relationships

```typescript
// Tenant → Events
@Entity('events')
export class EventEntity {
  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;
}

// Event → Ticket Types
@Entity('ticket_types')
export class TicketTypeEntity {
  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;
}
```

#### Many-to-Many Relationships

```typescript
// User ↔ Tenant (via TenantUser)
@Entity('tenant_users')
export class TenantUserEntity {
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;
}
```

### Repository Pattern

TypeORM repositories provide database operations:

```typescript
@Injectable()
export class EventService {
  constructor(
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>,
  ) {}

  async findAll(tenantId: string) {
    return this.eventRepository.find({
      where: { tenantId },
      relations: ['ticketTypes'],
    });
  }
}
```

### Database Queries

TypeORM supports:
- **Query Builder**: Complex queries with joins
- **Raw SQL**: Direct SQL when needed
- **Transactions**: ACID-compliant operations
- **Migrations**: Version-controlled schema changes

---

## Service Layer

### Service Responsibilities

Services contain all business logic:

1. **Data Validation**: Beyond DTO validation
2. **Business Rules**: Inventory checks, pricing calculations
3. **External Integrations**: Payment providers, email services
4. **Data Transformation**: Format responses
5. **Error Handling**: Business-specific exceptions

### Example Service Method

```typescript
@Injectable()
export class OrderService {
  async createOrder(dto: CreateOrderDto, tenantId: string) {
    // 1. Validate event exists
    const event = await this.eventRepository.findOne({
      where: { id: dto.eventId, tenantId },
    });
    if (!event) throw new NotFoundException('Event not found');

    // 2. Check inventory
    for (const item of dto.items) {
      const ticketType = await this.ticketTypeRepository.findOne({
        where: { id: item.ticketTypeId },
      });
      if (ticketType.quantitySold + item.quantity > ticketType.quantityTotal) {
        throw new BadRequestException('Insufficient inventory');
      }
    }

    // 3. Calculate total (BDT)
    const total = this.calculateTotal(dto.items);

    // 4. Create order
    const order = this.orderRepository.create({
      tenantId,
      eventId: dto.eventId,
      buyerEmail: dto.buyerEmail,
      totalCents: total,
      currency: 'BDT',
      status: 'pending',
    });

    // 5. Create order items
    const orderItems = dto.items.map(item => 
      this.orderItemRepository.create({
        orderId: order.id,
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      })
    );

    // 6. Save in transaction
    await this.dataSource.transaction(async manager => {
      await manager.save(order);
      await manager.save(orderItems);
      // Update inventory
      for (const item of orderItems) {
        await manager.increment(
          TicketTypeEntity,
          { id: item.ticketTypeId },
          'quantitySold',
          item.quantity,
        );
      }
    });

    return order;
  }
}
```

### Service Dependencies

Services can inject:
- Other services
- Repositories
- External services (payment, email)
- Configuration

---

## Controller Layer

### Controller Responsibilities

Controllers handle HTTP-specific concerns:

1. **Route Definition**: HTTP methods and paths
2. **Request Parsing**: Body, query, params
3. **Response Formatting**: Status codes, response structure
4. **Error Handling**: HTTP exceptions
5. **Validation**: DTO validation via ValidationPipe

### Example Controller

```typescript
@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('platform_admin')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.tenantService.createTenant(dto);
  }

  @Get()
  async getAllTenants(@Query() query: TenantQueryDto) {
    return this.tenantService.findAll(query);
  }

  @Get(':id')
  async getTenantById(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.tenantService.updateStatus(id, dto.status);
  }
}
```

### RESTful Endpoint Patterns

| Method | Pattern | Purpose |
|--------|---------|---------|
| `GET` | `/resource` | List all (paginated) |
| `GET` | `/resource/:id` | Get one by ID |
| `POST` | `/resource` | Create new |
| `PUT` | `/resource/:id` | Full update |
| `PATCH` | `/resource/:id` | Partial update |
| `DELETE` | `/resource/:id` | Delete |

---

## Validation & Error Handling

### DTO Validation

Data Transfer Objects use class-validator decorators:

```typescript
export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsOptional()
  @IsObject()
  brandingSettings?: Record<string, any>;
}
```

### Global Validation Pipe

Configured in `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,        // Strip unknown properties
    transform: true,        // Auto-transform types
    forbidNonWhitelisted: true, // Reject unknown properties
  }),
);
```

### Error Handling

NestJS provides HTTP exceptions:

```typescript
// In service
if (!tenant) {
  throw new NotFoundException('Tenant not found');
}

if (tenant.status === 'suspended') {
  throw new ForbiddenException('Tenant is suspended');
}

// Automatic response:
// {
//   "statusCode": 404,
//   "message": "Tenant not found",
//   "error": "Not Found"
// }
```

### Custom Exception Filters

For consistent error formatting:

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Format error response
    // Log error
    // Return consistent structure
  }
}
```

---

## Payment Processing Flow

### Payment Flow (Bangladesh Market)

```
┌─────────────┐
│  Attendee   │
└──────┬──────┘
       │ 1. Select tickets, proceed to checkout
       ▼
┌─────────────────────┐
│  Order Service      │
│  - Create order     │
│  - Reserve inventory│
│  - Calculate total  │
└──────┬──────────────┘
       │ 2. Order created (status: pending)
       ▼
┌─────────────────────┐
│  Payment Service    │
│  - Select provider   │
│  (Stripe/bKash/etc) │
└──────┬──────────────┘
       │ 3. Initiate payment
       ▼
┌─────────────────────┐
│  Payment Provider   │
│  - Process payment   │
│  - Return reference │
└──────┬──────────────┘
       │ 4. Payment intent created
       ▼
┌─────────────────────┐
│  Webhook Listener   │
│  - Receive callback  │
│  - Verify signature  │
│  - Update order      │
└──────┬──────────────┘
       │ 5. Order status: paid
       ▼
┌─────────────────────┐
│  Ticket Service     │
│  - Generate tickets │
│  - Create QR codes  │
│  - Send email       │
└──────┬──────────────┘
       │ 6. Tickets delivered
       ▼
┌─────────────┐
│  Attendee   │
│ (Receives   │
│  tickets)   │
└─────────────┘
```

### Payment Provider Integration

```typescript
@Injectable()
export class PaymentService {
  async createPaymentIntent(
    orderId: string,
    amountCents: number,
    provider: 'stripe' | 'bkash' | 'nagad' | 'rocket',
  ) {
    switch (provider) {
      case 'stripe':
        return this.stripeService.createPaymentIntent(amountCents, 'bdt');
      case 'bkash':
        return this.bkashService.initiatePayment(amountCents);
      case 'nagad':
        return this.nagadService.createTransaction(amountCents);
      case 'rocket':
        return this.rocketService.processPayment(amountCents);
    }
  }
}
```

### Payment Status States

```
pending → processing → succeeded
                    ↓
                 failed
                    ↓
                 refunded
```

---

## QR Code Generation & Validation Flow

### QR Code Generation

```
┌─────────────────────┐
│  Ticket Service     │
│  (After payment)    │
└──────┬──────────────┘
       │ 1. For each ticket in order
       ▼
┌─────────────────────┐
│  Generate QR Payload│
│  - Ticket ID        │
│  - Order ID         │
│  - Event ID         │
│  - Timestamp        │
└──────┬──────────────┘
       │ 2. Sign payload (HMAC)
       ▼
┌─────────────────────┐
│  Create QR Code     │
│  - Encode payload   │
│  - Generate image  │
└──────┬──────────────┘
       │ 3. Store in database
       ▼
┌─────────────────────┐
│  Ticket Entity      │
│  - qrCodePayload    │
│  - qrSignature      │
└──────┬──────────────┘
       │ 4. Attach to email
       ▼
┌─────────────┐
│  Attendee   │
└─────────────┘
```

### QR Code Payload Structure

```typescript
{
  ticketId: "uuid",
  orderId: "uuid",
  eventId: "uuid",
  attendeeName: "John Doe",
  timestamp: 1234567890,
  signature: "hmac-sha256-signature"
}
```

### QR Code Validation

```
┌─────────────┐
│  Staff      │
│  (Scans QR)  │
└──────┬──────┘
       │ 1. POST /staff/check-in { qrCode }
       ▼
┌─────────────────────┐
│  Check-in Service   │
│  - Decode QR        │
│  - Verify signature │
└──────┬──────────────┘
       │ 2. Validate ticket
       ▼
┌─────────────────────┐
│  Validation Checks  │
│  ✓ Ticket exists    │
│  ✓ Not checked in   │
│  ✓ Event matches    │
│  ✓ Not expired      │
└──────┬──────────────┘
       │ 3. Update ticket
       ▼
┌─────────────────────┐
│  Mark Checked In    │
│  - checkedInAt      │
│  - Log activity     │
└──────┬──────────────┘
       │ 4. Return success
       ▼
┌─────────────┐
│  Staff      │
│  (Confirmed)│
└─────────────┘
```

---

## Check-in Process Flow

### Check-in Workflow

```
1. Staff logs into check-in app
   ↓
2. Select event from list (filtered by tenant)
   ↓
3. Open camera scanner
   ↓
4. Scan attendee's QR code
   ↓
5. Backend validates:
   - QR signature valid
   - Ticket exists
   - Not already checked in
   - Event matches
   - Ticket status is 'active'
   ↓
6. Update ticket:
   - Set checkedInAt timestamp
   - Update status to 'checked_in'
   ↓
7. Log activity:
   - Actor: staff user
   - Action: 'ticket.checked_in'
   - Metadata: ticket ID, event ID
   ↓
8. Return success response
   ↓
9. Staff sees confirmation
```

### Offline Check-in Support

For venues with poor connectivity:

```typescript
// 1. Pre-download event tickets
GET /staff/events/:eventId/tickets

// 2. Store locally (IndexedDB/LocalStorage)

// 3. Scan QR code
// 4. Validate against local cache
// 5. Queue check-in for sync
// 6. Sync when connection restored
POST /staff/check-in/batch
```

---

## Webhook Processing Flow

### Webhook Lifecycle

```
┌─────────────────────┐
│  Payment Provider   │
│  (Stripe/bKash/etc) │
└──────┬──────────────┘
       │ 1. Payment event occurs
       ▼
┌─────────────────────┐
│  Webhook Endpoint   │
│  POST /webhooks/:provider│
└──────┬──────────────┘
       │ 2. Verify signature
       ▼
┌─────────────────────┐
│  Signature Check    │
│  ✓ Valid signature  │
│  ✓ Not duplicate    │
└──────┬──────────────┘
       │ 3. Store webhook event
       ▼
┌─────────────────────┐
│  Webhook Service    │
│  - Save to DB       │
│  - Status: pending  │
└──────┬──────────────┘
       │ 4. Process asynchronously
       ▼
┌─────────────────────┐
│  Event Processor    │
│  - Update order     │
│  - Update payment   │
│  - Generate tickets │
└──────┬──────────────┘
       │ 5. Mark as processed
       ▼
┌─────────────────────┐
│  Webhook Event     │
│  Status: processed  │
└─────────────────────┘
```

### Idempotent Processing

```typescript
async processWebhook(webhookId: string, payload: any) {
  // Check if already processed
  const existing = await this.webhookRepository.findOne({
    where: { providerReference: payload.id },
  });
  
  if (existing?.status === 'processed') {
    return existing; // Idempotent: return existing result
  }

  // Process webhook
  await this.updateOrderStatus(payload.orderId, payload.status);
  
  // Mark as processed
  await this.webhookRepository.update(webhookId, {
    status: 'processed',
    processedAt: new Date(),
  });
}
```

---

## Security Measures

### Authentication Security

1. **Password Hashing**: bcrypt with salt rounds (10+)
   ```typescript
   const hash = await bcrypt.hash(password, 10);
   ```

2. **JWT Security**:
   - Short expiration (15-60 minutes)
   - Refresh tokens for longer sessions
   - HttpOnly cookies (prevents XSS)
   - Secure flag (HTTPS only)
   - SameSite: 'strict' (prevents CSRF)

3. **Token Validation**:
   - Verify signature
   - Check expiration
   - Validate issuer/audience

### Authorization Security

1. **Role-Based Access Control (RBAC)**:
   ```typescript
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('platform_admin')
   ```

2. **Tenant Isolation**:
   - All queries filtered by tenant_id
   - Guards prevent cross-tenant access
   - Interceptors add tenant context

3. **Resource Ownership**:
   - Verify user owns resource
   - Check tenant membership

### Data Security

1. **Input Validation**: All inputs validated via DTOs
2. **SQL Injection Prevention**: TypeORM parameterized queries
3. **XSS Prevention**: Input sanitization
4. **CSRF Protection**: SameSite cookies, CSRF tokens
5. **Rate Limiting**: Prevent brute force attacks

### Payment Security

1. **Webhook Signature Verification**: Verify all webhooks
2. **Idempotent Operations**: Prevent duplicate processing
3. **PCI Compliance**: No card data storage (use payment provider)

---

## Data Flow Diagrams

### Complete Order Creation Flow

```
Attendee → Frontend → Backend API
                           ↓
                    [ValidationPipe]
                           ↓
                    [JWT Auth Guard]
                           ↓
                    [Controller]
                           ↓
                    [Order Service]
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
    [Event Repository]        [TicketType Repository]
    - Verify event exists     - Check inventory
              ↓                         ↓
              └────────────┬────────────┘
                           ↓
                    [Order Repository]
                    - Create order
                    - Create order items
                    - Update inventory (transaction)
                           ↓
                    [Payment Service]
                    - Create payment intent
                           ↓
                    [Payment Provider]
                    - Process payment
                           ↓
                    [Webhook Listener]
                    - Update order status
                           ↓
                    [Ticket Service]
                    - Generate tickets
                    - Create QR codes
                    - Send email
                           ↓
                    Response to Frontend
                           ↓
                    Attendee receives tickets
```

### Multi-Tenant Query Flow

```
Request with JWT
       ↓
[Extract tenantId from JWT]
       ↓
[TenantContextInterceptor]
       ↓
[Service Method]
       ↓
[Repository Query]
WHERE tenant_id = :tenantId
       ↓
[PostgreSQL]
       ↓
[Filtered Results]
       ↓
[Response (tenant's data only)]
```

---

## Summary

This backend architecture provides:

1. **Scalability**: Modular design allows horizontal scaling
2. **Security**: Multi-layer authentication and authorization
3. **Maintainability**: Clear separation of concerns
4. **Type Safety**: Full TypeScript support
5. **Multi-Tenancy**: Row-level isolation for data security
6. **Extensibility**: Easy to add new features/modules
7. **Bangladesh-Specific**: BDT currency, local payment methods, BST timezone

The system is designed to handle the complete event ticketing lifecycle from event creation to check-in, with robust security and multi-tenant isolation throughout.

