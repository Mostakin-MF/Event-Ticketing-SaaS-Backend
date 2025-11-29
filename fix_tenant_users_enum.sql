-- Fix tenant_users_role_enum to match entity definition
-- This script removes 'admin' from the enum and ensures only 'TenantAdmin' and 'staff' exist

-- Step 1: Check current enum values
SELECT enum_range(NULL::tenant_users_role_enum);

-- Step 2: If there are any rows with 'admin' value, update them first
-- (Replace 'admin' with 'TenantAdmin' if that makes sense, or delete those rows)
UPDATE tenant_users 
SET role = 'TenantAdmin' 
WHERE role = 'admin';

-- Step 3: Remove 'admin' from the enum (if it exists)
-- Note: PostgreSQL doesn't allow removing enum values directly
-- We need to recreate the enum

-- Step 3a: Create a new enum with correct values
CREATE TYPE tenant_users_role_enum_new AS ENUM ('TenantAdmin', 'staff');

-- Step 3b: Alter the column to use the new enum
ALTER TABLE tenant_users 
  ALTER COLUMN role TYPE tenant_users_role_enum_new 
  USING role::text::tenant_users_role_enum_new;

-- Step 3c: Drop the old enum
DROP TYPE tenant_users_role_enum;

-- Step 3d: Rename the new enum to the original name
ALTER TYPE tenant_users_role_enum_new RENAME TO tenant_users_role_enum;

-- Step 4: Verify the enum now has correct values
SELECT enum_range(NULL::tenant_users_role_enum);

