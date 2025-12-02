# Postman Collections Update Summary

## Overview
All Postman collections have been updated and fixed to match the actual API implementation. All JSON files are now valid and aligned with the current database structure and DTOs.

## Changes Made

### 1. Platform Admin Collection (`Platform_Admin_Collection.json`)
**Fixed Issues:**
- ✅ Payment DTO fields corrected:
  - Changed `amount` → `amountCents` (camelCase)
  - Changed `paymentMethod` → `provider` (enum: stripe, bkash, nagad, rocket, other)
  - Added `providerReference` field
  - Added proper `payload` field structure
- ✅ Webhook Event DTO corrected:
  - Added `provider` field
  - Fixed `eventType` format
  - Added proper payload structure
- ✅ Activity Log DTO corrected:
  - Changed `userId` → `actorId`
  - Added `tenantId` field
  - Fixed `metadata` structure
- ✅ Added Content-Type headers to all POST/PUT/PATCH requests

### 2. TenantAdmin Collection (`TenantAdmin_Collection.json`)
**Fixed Issues:**
- ✅ Event creation updated with new fields:
  - Added `is_public` (boolean) field
  - Added `hero_image_url` (string) field
  - Added `seo_meta` (JSON object) field
  - Updated city/country examples to Bangladesh (Dhaka, Bangladesh)
  - Updated timezone to BST (UTC+6) format
- ✅ Ticket Type creation:
  - Added `quantity_sold` field (required, default 0)
  - Updated timezone to BST format
- ✅ Discount Code creation:
  - Added `times_redeemed` field (required, default 0)
  - Updated timezone to BST format
- ✅ Staff invitation:
  - Added `role` field (required: "staff")

### 3. Staff Collection (`Staff_Collection.json`)
**Fixed Issues:**
- ✅ Updated phone number format to Bangladesh format (+880)
- ✅ Added Content-Type headers to all POST/PUT requests
- ✅ Activity Log creation:
  - Fixed metadata structure (moved description inside metadata)

### 4. Attendee Collection (`Attendee_Collection.json`) - NEW
**Created New Collection:**
- ✅ Complete collection for public attendee endpoints
- ✅ Events browsing (no auth required):
  - Get all public events
  - Get event by slug
  - Get event by ID
  - Get ticket types for event
- ✅ Discount code validation
- ✅ Checkout flow (creates orders and tickets)
- ✅ Order history by email
- ✅ Ticket viewing by order ID and email

## Files Cleaned Up
Removed unnecessary files:
- ❌ `check_staff_columns.sql` - No longer needed
- ❌ `fix_staff_columns.sql` - No longer needed
- ❌ `generate_password_hashes.js` - No longer needed
- ❌ `TEST_USERS_SETUP.sql` - Replaced by `TEST_USERS_SETUP_FIXED.sql`

## Remaining Files
- ✅ `Platform_Admin_Collection.json` - Fixed and validated
- ✅ `TenantAdmin_Collection.json` - Fixed and validated
- ✅ `Staff_Collection.json` - Fixed and validated
- ✅ `Attendee_Collection.json` - New, validated
- ✅ `TEST_USERS_SETUP_FIXED.sql` - Test data setup
- ✅ `PROJECT_DIAGRAM_AND_RELATIONS.txt` - Documentation
- ✅ `QUICK_SETUP_GUIDE.txt` - Setup instructions
- ✅ `TEST_INSTRUCTIONS.txt` - Testing guide

## Key Field Name Conventions
- **Payment Entity**: Uses camelCase (`orderId`, `amountCents`, `providerReference`)
- **Event Entity**: Uses snake_case (`is_public`, `hero_image_url`, `seo_meta`)
- **Order/Ticket Types**: Uses snake_case (`price_taka`, `total_taka`, `unit_price_taka`)
- **Timezones**: All dates use BST (UTC+6) format: `+06:00`
- **Phone Numbers**: Bangladesh format: `+880XXXXXXXXX`

## Validation
All JSON files have been validated and are syntactically correct. They can be imported directly into Postman.

## Next Steps
1. Import all collections into Postman
2. Set up environment variables:
   - `base_url`: http://localhost:3000
   - `access_token`: (will be set automatically after login)
3. Use `TEST_USERS_SETUP_FIXED.sql` to create test users
4. Follow `QUICK_SETUP_GUIDE.txt` for setup instructions

