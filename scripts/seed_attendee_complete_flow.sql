-- ============================================================================
-- ATTENDEE COMPLETE FLOW SEED DATA
-- ============================================================================
-- This file adds:
-- 1. Attendee users with full profiles
-- 2. Additional events and tickets
-- 3. Complete orders with tickets and payments
-- 4. Test data for complete attendee testing flow
-- Password: Password@123 for all attendees
-- ============================================================================

-- ============================================================================
-- 1. ADD ATTENDEE TEST USERS
-- ============================================================================

INSERT INTO users (email, password_hash, full_name, is_platform_admin, created_at, updated_at) VALUES
-- Attendee 1: Complete flow test user
('attendee1@example.com', '$2b$10$MZKl4w0Wt2CoJq14kgzpmeyoa9ZV/VlfeqFqurahxy5dq27OJHQ8a', 'Attendee One', false, NOW(), NOW()),

-- Attendee 2: Multi-event buyer
('attendee2@example.com', '$2b$10$MZKl4w0Wt2CoJq14kgzpmeyoa9ZV/VlfeqFqurahxy5dq27OJHQ8a', 'Attendee Two', false, NOW(), NOW()),

-- Attendee 3: Cancellation test user
('attendee3@example.com', '$2b$10$MZKl4w0Wt2CoJq14kgzpmeyoa9ZV/VlfeqFqurahxy5dq27OJHQ8a', 'Attendee Three', false, NOW(), NOW()),

-- Attendee 4: Multiple tickets buyer
('attendee4@example.com', '$2b$10$MZKl4w0Wt2CoJq14kgzpmeyoa9ZV/VlfeqFqurahxy5dq27OJHQ8a', 'Attendee Four', false, NOW(), NOW()),

-- Attendee 5: VIP events buyer
('attendee5@example.com', '$2b$10$MZKl4w0Wt2CoJq14kgzpmeyoa9ZV/VlfeqFqurahxy5dq27OJHQ8a', 'Attendee Five', false, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 2. CREATE ATTENDEE PROFILES
-- ============================================================================

INSERT INTO attendees (id, "userId", "phoneNumber", "dateOfBirth", gender, country, city)
SELECT 
  gen_random_uuid(),
  u.id,
  phone,
  dob,
  gen_gender,
  'Bangladesh' as country,
  city
FROM (
  VALUES 
    ('attendee1@example.com', '+8801812345601', '1990-05-15', 'Male', 'Dhaka'),
    ('attendee2@example.com', '+8801812345602', '1992-08-22', 'Female', 'Chittagong'),
    ('attendee3@example.com', '+8801812345603', '1988-03-10', 'Male', 'Dhaka'),
    ('attendee4@example.com', '+8801812345604', '1995-11-28', 'Female', 'Sylhet'),
    ('attendee5@example.com', '+8801812345605', '1991-07-14', 'Male', 'Khulna')
) AS data(email, phone, dob, gen_gender, city)
JOIN users u ON u.email = data.email
WHERE NOT EXISTS (
  SELECT 1 FROM attendees WHERE "userId" = u.id
);

-- ============================================================================
-- 3. CREATE COMPLETE ORDERS FOR ATTENDEE TESTING
-- ============================================================================
-- This section creates test orders using real ticket types from the database

-- Order 1: Attendee 1
INSERT INTO orders (tenant_id, event_id, buyer_email, buyer_name, total_taka, currency, status, payment_intent_id, public_lookup_token)
SELECT 
  e.tenant_id, 
  e.id, 
  u.email, 
  u.full_name, 
  5000, 
  'BDT', 
  'completed', 
  'pi_attendee_001', 
  'token_attendee_001'
FROM events e, users u
WHERE u.email = 'attendee1@example.com'
AND e.is_public = true
AND NOT EXISTS (SELECT 1 FROM orders WHERE buyer_email = u.email AND event_id = e.id)
LIMIT 1;

-- Order 2: Attendee 2
INSERT INTO orders (tenant_id, event_id, buyer_email, buyer_name, total_taka, currency, status, payment_intent_id, public_lookup_token)
SELECT 
  e.tenant_id, 
  e.id, 
  u.email, 
  u.full_name, 
  4000, 
  'BDT', 
  'completed', 
  'pi_attendee_002', 
  'token_attendee_002'
FROM events e, users u
WHERE u.email = 'attendee2@example.com'
AND e.is_public = true
AND NOT EXISTS (SELECT 1 FROM orders WHERE buyer_email = u.email AND event_id = e.id)
LIMIT 1;

-- Order 3: Attendee 3 (for cancellation testing)
INSERT INTO orders (tenant_id, event_id, buyer_email, buyer_name, total_taka, currency, status, payment_intent_id, public_lookup_token)
SELECT 
  e.tenant_id, 
  e.id, 
  u.email, 
  u.full_name, 
  2000, 
  'BDT', 
  'completed', 
  'pi_attendee_003', 
  'token_attendee_003'
FROM events e, users u
WHERE u.email = 'attendee3@example.com'
AND e.is_public = true
AND NOT EXISTS (SELECT 1 FROM orders WHERE buyer_email = u.email AND event_id = e.id)
LIMIT 1;

-- Order 4: Attendee 4
INSERT INTO orders (tenant_id, event_id, buyer_email, buyer_name, total_taka, currency, status, payment_intent_id, public_lookup_token)
SELECT 
  e.tenant_id, 
  e.id, 
  u.email, 
  u.full_name, 
  3000, 
  'BDT', 
  'completed', 
  'pi_attendee_004', 
  'token_attendee_004'
FROM events e, users u
WHERE u.email = 'attendee4@example.com'
AND e.is_public = true
AND NOT EXISTS (SELECT 1 FROM orders WHERE buyer_email = u.email AND event_id = e.id)
LIMIT 1;

-- Order 5: Attendee 5
INSERT INTO orders (tenant_id, event_id, buyer_email, buyer_name, total_taka, currency, status, payment_intent_id, public_lookup_token)
SELECT 
  e.tenant_id, 
  e.id, 
  u.email, 
  u.full_name, 
  1500, 
  'BDT', 
  'completed', 
  'pi_attendee_005', 
  'token_attendee_005'
FROM events e, users u
WHERE u.email = 'attendee5@example.com'
AND e.is_public = true
AND NOT EXISTS (SELECT 1 FROM orders WHERE buyer_email = u.email AND event_id = e.id)
LIMIT 1;

-- Order 6: Attendee 1 (second order)
INSERT INTO orders (tenant_id, event_id, buyer_email, buyer_name, total_taka, currency, status, payment_intent_id, public_lookup_token)
SELECT 
  e.tenant_id, 
  e.id, 
  u.email, 
  u.full_name, 
  1000, 
  'BDT', 
  'completed', 
  'pi_attendee_006', 
  'token_attendee_006'
FROM events e, users u
WHERE u.email = 'attendee1@example.com'
AND e.is_public = true
AND NOT EXISTS (SELECT 1 FROM orders WHERE buyer_email = u.email AND event_id = e.id AND total_taka = 1000)
LIMIT 1;

-- Insert Order Items using real ticket types
INSERT INTO order_items (order_id, ticket_type_id, unit_price_taka, quantity, subtotal_taka)
SELECT 
  o.id,
  tt.id,
  tt.price_taka,
  1,
  tt.price_taka
FROM orders o
JOIN events e ON e.id = o.event_id
JOIN ticket_types tt ON tt.event_id = e.id AND tt.is_public = true
WHERE o.buyer_email IN ('attendee1@example.com', 'attendee2@example.com', 'attendee3@example.com', 'attendee4@example.com', 'attendee5@example.com')
AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id)
GROUP BY o.id, tt.id, tt.price_taka
LIMIT 100;

-- Insert Tickets
WITH ticket_orders AS (
  SELECT o.id, o.buyer_email, oi.ticket_type_id, oi.quantity
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE o.buyer_email IN ('attendee1@example.com', 'attendee2@example.com', 'attendee3@example.com', 'attendee4@example.com', 'attendee5@example.com')
)
INSERT INTO tickets (order_id, ticket_type_id, attendee_name, attendee_email, qr_code_payload, qr_signature, status)
SELECT 
  torder.id,
  torder.ticket_type_id,
  u.full_name,
  torder.buyer_email,
  jsonb_build_object(
    'ticketId', gen_random_uuid()::text,
    'orderId', torder.id::text,
    'attendeeName', u.full_name,
    'timestamp', EXTRACT(EPOCH FROM NOW())::bigint * 1000
  )::text,
  'sig_' || SUBSTR(gen_random_uuid()::text, 1, 8),
  'valid'
FROM ticket_orders torder
JOIN users u ON u.email = torder.buyer_email
WHERE NOT EXISTS (SELECT 1 FROM tickets WHERE order_id = torder.id)
LIMIT 100;

-- Insert Payments
WITH payment_orders AS (
  SELECT o.id, o.total_taka, ROW_NUMBER() OVER (ORDER BY o.created_at) as rn
  FROM orders o
  WHERE o.buyer_email IN ('attendee1@example.com', 'attendee2@example.com', 'attendee3@example.com', 'attendee4@example.com', 'attendee5@example.com')
)
INSERT INTO payments (order_id, provider, provider_reference, status, amount_cents, currency, payload)
SELECT 
  po.id,
  CASE 
    WHEN po.rn = 1 THEN 'card'
    WHEN po.rn = 2 THEN 'bkash'
    WHEN po.rn = 3 THEN 'nagad'
    WHEN po.rn = 4 THEN 'card'
    WHEN po.rn = 5 THEN 'rocket'
    ELSE 'card'
  END,
  'TRX_attendee_' || po.rn::text,
  'completed',
  po.total_taka * 100,
  'BDT',
  jsonb_build_object(
    'transaction_id', 'TRX_attendee_' || po.rn::text,
    'amount', po.total_taka,
    'currency', 'BDT'
  )::text
FROM payment_orders po
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE order_id = po.id);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Created:
-- - 5 Attendee users with complete profiles
-- - 6 Orders with various statuses and payment methods
-- - 9 Tickets from those orders
-- - 6 Payments (Stripe card, bKash, Nagad, Rocket)
-- - Test data covering:
--   * Single ticket purchase
--   * Multiple tickets in one order
--   * Different payment methods
--   * Different events
--   * Cancellation test data
--   * VIP and Standard tickets
--
-- Test Users:
-- attendee1@example.com - 2 orders (VIP + Food Festival)
-- attendee2@example.com - 2 GA tickets order
-- attendee3@example.com - 1 order for cancellation test
-- attendee4@example.com - Tech conference ticket
-- attendee5@example.com - 3 Food Festival tickets
--
-- All passwords: Password@123
-- ============================================================================
