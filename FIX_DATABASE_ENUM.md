# Fix Database Enum Error

## Problem

The database has an enum `tenant_users_role_enum` that contains "admin", but the entity definition only allows `['TenantAdmin', 'staff']`.

**Error:**
```
QueryFailedError: invalid input value for enum tenant_users_role_enum: "admin"
```

## Solution

You need to update the database enum to match the entity definition. Follow these steps:

### Option 1: Using SQL Script (Recommended)

1. Connect to your PostgreSQL database
2. Run the SQL script: `fix_tenant_users_enum.sql`

```bash
psql -U your_username -d your_database -f fix_tenant_users_enum.sql
```

### Option 2: Manual SQL Commands

1. **Check current enum values:**
```sql
SELECT enum_range(NULL::tenant_users_role_enum);
```

2. **Update any existing rows with 'admin' value:**
```sql
-- If you have data with 'admin', update it to 'TenantAdmin'
UPDATE tenant_users 
SET role = 'TenantAdmin' 
WHERE role = 'admin';
```

3. **Recreate the enum:**
```sql
-- Create new enum with correct values
CREATE TYPE tenant_users_role_enum_new AS ENUM ('TenantAdmin', 'staff');

-- Alter the column to use new enum
ALTER TABLE tenant_users 
  ALTER COLUMN role TYPE tenant_users_role_enum_new 
  USING role::text::tenant_users_role_enum_new;

-- Drop old enum
DROP TYPE tenant_users_role_enum;

-- Rename new enum
ALTER TYPE tenant_users_role_enum_new RENAME TO tenant_users_role_enum;
```

4. **Verify:**
```sql
SELECT enum_range(NULL::tenant_users_role_enum);
-- Should show: {TenantAdmin,staff}
```

### Option 3: Drop and Recreate Table (If no important data)

**WARNING: This will delete all data in tenant_users table!**

```sql
-- Drop the table
DROP TABLE tenant_users CASCADE;

-- Drop the enum
DROP TYPE tenant_users_role_enum;

-- Restart your NestJS app - TypeORM will recreate the table with correct enum
```

## After Fixing

1. Restart your NestJS application
2. The error should be resolved
3. TypeORM will sync the schema correctly

## Prevention

To prevent this in the future:
- Always define enums in entities first
- Use migrations instead of `synchronize: true` in production
- Ensure database schema matches entity definitions

## Current Entity Definition

```typescript
@Column({
  type: 'enum',
  enum: ['TenantAdmin', 'staff'],
})
role: string;
```

The database enum must match exactly: `['TenantAdmin', 'staff']`

