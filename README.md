# Event Ticketing SaaS Platform (Bangladesh)

A multi-tenant event ticketing platform built with NestJS, TypeORM, and PostgreSQL, designed specifically for the Bangladesh market with BDT currency, local payment methods (bKash, Nagad, Rocket), and BST timezone support.

## Implementation Status

**⚠️ Current Status: Only Admin Module Implemented**

This project has 4 user types, but currently only the **Admin Module** is implemented. Other modules will be developed by team members:

- ✅ **Admin Module** - COMPLETE (Platform Admin functionality)
- ⏳ **TenantAdmin Module** - PENDING (to be implemented by team member)
- ⏳ **Staff Module** - PENDING (to be implemented by team member)
- ⏳ **Attendee Module** - PENDING (to be implemented by team member)

## Features (Admin Module)

- **Platform Admin Management**: Full CRUD for users, tenants, tenant users
- **Multi-Tenant Architecture**: Row-level tenancy with tenant isolation
- **Role-Based Access Control**: JWT authentication with role-based guards
- **Payment Management**: CRUD operations for payments (Stripe, bKash, Nagad, Rocket)
- **Webhook Management**: Webhook event tracking and processing
- **Activity Logging**: Comprehensive audit trail for all operations

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: class-validator with ValidationPipe
- **Language**: TypeScript

## Project Structure

```
src/
├── admin/          # ✅ Admin module (COMPLETE)
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   ├── admin.module.ts
│   ├── admin.dto.ts
│   └── *.entity.ts  # User, Tenant, TenantUser, Payment, WebhookEvent, ActivityLog
│
├── auth/           # ✅ Authentication module (COMPLETE)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   └── roles.decorator.ts
│
├── tenant-admin/   # ⏳ TenantAdmin module (PENDING - other team member)
├── staff/          # ⏳ Staff module (PENDING - other team member)
├── attendee/       # ⏳ Attendee module (PENDING - other team member)
│
└── app.module.ts   # Root module
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env file with:
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname
# JWT_SECRET=your-secret-key-change-in-production
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Endpoints (Currently Implemented)

### Authentication
- `POST /auth/login` - User login (returns JWT token with role information)

### Admin Module Routes (Protected - Platform Admin)
**User Management:**
- `GET /admin/users` - List all platform users
- `POST /admin/users` - Create new platform user
- `GET /admin/users/:id` - Get user by ID
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user

**Tenant Management:**
- `GET /admin/tenants` - List all tenants
- `POST /admin/tenants` - Create new tenant
- `GET /admin/tenants/:id` - Get tenant by ID
- `PUT /admin/tenants/:id` - Update tenant
- `PATCH /admin/tenants/:id/status` - Update tenant status
- `DELETE /admin/tenants/:id` - Delete tenant

**Tenant User Management:**
- `GET /admin/tenant-users` - List tenant users (Platform Admin, TenantAdmin)
- `POST /admin/tenant-users` - Create tenant user (Platform Admin, TenantAdmin)
- `GET /admin/tenant-users/:id` - Get tenant user by ID
- `PUT /admin/tenant-users/:id` - Update tenant user
- `PATCH /admin/tenant-users/:id/status` - Update tenant user status
- `DELETE /admin/tenant-users/:id` - Delete tenant user

**Payment Management:**
- `GET /admin/payments` - List payments (Platform Admin, TenantAdmin, Staff)
- `POST /admin/payments` - Create payment (Platform Admin, TenantAdmin)
- `GET /admin/payments/:id` - Get payment by ID
- `PUT /admin/payments/:id` - Update payment
- `PATCH /admin/payments/:id/status` - Update payment status
- `DELETE /admin/payments/:id` - Delete payment

**Webhook Management:**
- `GET /admin/webhook-events` - List webhook events (Platform Admin, TenantAdmin, Staff)
- `POST /admin/webhook-events` - Create webhook event (Platform Admin, TenantAdmin)
- `GET /admin/webhook-events/:id` - Get webhook event by ID
- `PUT /admin/webhook-events/:id` - Update webhook event
- `PATCH /admin/webhook-events/:id/status` - Update webhook event status
- `DELETE /admin/webhook-events/:id` - Delete webhook event

**Activity Logs:**
- `GET /admin/activity-logs` - List activity logs (All authenticated roles)
- `POST /admin/activity-logs` - Create activity log (All authenticated roles)
- `GET /admin/activity-logs/:id` - Get activity log by ID
- `DELETE /admin/activity-logs/:id` - Delete activity log (Platform Admin, TenantAdmin)

**All admin routes require JWT authentication and appropriate role permissions.**

### Pending Modules (To be implemented by other team members)
- **TenantAdmin Module**: Event management, ticket types, orders, reports
- **Staff Module**: Check-in operations, ticket scanning
- **Attendee Module**: Public event browsing, ticket purchase

## Documentation

- [Implementation Status](./IMPLEMENTATION_STATUS.md) - Current implementation status and module assignments
- [Implementation Plan](./event_ticketing_implementation_plan.md) - Detailed project plan and database structure
- [Backend Architecture](./backend_architecture_and_flow.md) - Architecture, flow, and technical details
- [Backend Requirements](./backend_requirements.md) - Project requirements and compliance

## User Roles

The platform supports 4 user types:

1. **Platform Admin** (`platform_admin`): ✅ **IMPLEMENTED**
   - Full system access across all tenants
   - Manages users, tenants, tenant users
   - Monitors payments, webhooks, activity logs

2. **Tenant Admin** (`TenantAdmin`): ⏳ **PENDING** (other team member)
   - Full access to their own tenant
   - Manages events, ticket types, orders
   - Views reports and analytics

3. **Staff** (`staff`): ⏳ **PENDING** (other team member)
   - Limited operations (check-in, read-only views)
   - Ticket scanning and validation
   - Attendee support

4. **User/Attendee**: ⏳ **PENDING** (other team member)
   - Public access (no login required)
   - Browse events, purchase tickets
   - View own tickets and QR codes

## Security

- Passwords are hashed using bcrypt
- JWT tokens expire after 1 hour
- Role-based access control on all protected routes
- Input validation using class-validator

## License

MIT
