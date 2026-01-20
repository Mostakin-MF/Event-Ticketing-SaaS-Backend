import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminService } from './admin/admin.service';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  const email = 'admin@example.com';
  const password = 'password';

  // Ensure default admin exists
  let user = await adminService.findUserByEmail(email);
  if (!user) {
    console.log(`Creating default admin user: ${email}`);
    await adminService.createUser({
      email,
      password,
      fullName: 'Super Admin',
      isPlatformAdmin: true,
    });
    console.log('Admin user created successfully.');
  } else {
    console.log('Admin user already exists.');
  }

  // Create/Update user with SPECIFIC HASH provided by user
  const directEmail = 'admin@platform.com';
  const specificHash = '$2b$10$f9DPIIp2n.jKFToES3EALeds3yVewJgm9EbTpoIo2aXeXXdAxCxg6';

  // We use the repository directly via module reference or just raw query if needed.
  // Since we are in standalone script, getting repo is verbose.
  // Easiest is to use the service to create a dummy user, then update the hash manually.

  let platformUser = await adminService.findUserByEmail(directEmail);
  if (!platformUser) {
    console.log(`Creating platform admin user: ${directEmail}`);
    platformUser = await adminService.createUser({
      email: directEmail,
      password: 'temporaryPassword123', // Will be overwritten
      fullName: 'Platform Admin',
      isPlatformAdmin: true,
    });
  }

  // FORCE UPDATE the password hash
  // We need to access the repository safely. 
  // AdminService has private repository. 
  // Let's use QueryRunner or just SQL via DataSource?
  // We can get DataSource from app.
  const dataSource = app.get(DataSource);
  await dataSource.query(
    `UPDATE "users" SET "password_hash" = $1 WHERE "email" = $2`,
    [specificHash, directEmail]
  );
  console.log(`Updated password hash for ${directEmail}`);

  /*
  // Delete all existing themes first
  console.log('Removing old themes...');
  // Remove theme purchases first
  await dataSource.query(`DELETE FROM theme_purchases`);
  // Remove theme references from tenant_configs
  await dataSource.query(`UPDATE tenant_configs SET "themeId" = NULL WHERE "themeId" IS NOT NULL`);
  // Also remove from tenants table if it exists
  await dataSource.query(`UPDATE tenants SET "themeId" = NULL WHERE "themeId" IS NOT NULL`);
  // Now we can safely delete themes
  await dataSource.query(`DELETE FROM themes`);
  console.log('Old themes removed.');

  // Seed Themes
  console.log('Seeding themes...');
  
  const themes = [
    {
      name: 'Modern Dark',
      description: 'Perfect for concerts, nightlife events, and DJ performances. Features dark backgrounds with neon accents and glassmorphism effects.',
      isPremium: false,
      price: 0,
      status: 'active',
      thumbnailUrl: '/themes/modern-dark-preview.jpg',
      defaultProperties: {
        colors: {
          primary: '#10b981',
          secondary: '#f59e0b',
          background: '#020617',
          text: '#ffffff',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        layout: 'hero-focus',
      },
    },
    {
      name: 'Vibrant Festival',
      description: 'Ideal for music festivals, cultural events, and outdoor gatherings. Bright, colorful design with playful animations.',
      isPremium: false,
      price: 0,
      status: 'active',
      thumbnailUrl: '/themes/vibrant-festival-preview.jpg',
      defaultProperties: {
        colors: {
          primary: '#f97316',
          secondary: '#8b5cf6',
          background: '#fff7ed',
          text: '#1e1e2e',
        },
        fonts: {
          heading: 'Outfit',
          body: 'Roboto',
        },
        layout: 'grid',
      },
    },
    {
      name: 'Professional Corporate',
      description: 'Designed for conferences, seminars, and business networking events. Clean, minimal, and professional.',
      isPremium: true,
      price: 49.99,
      status: 'active',
      thumbnailUrl: '/themes/professional-corporate-preview.jpg',
      defaultProperties: {
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          background: '#f8fafc',
          text: '#0f172a',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        layout: 'list',
      },
    },
  ];

  // Insert all themes (we already deleted old ones)
  for (const themeData of themes) {
    await dataSource.query(
      `INSERT INTO themes (name, description, "isPremium", price, status, "thumbnailUrl", "defaultProperties", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        themeData.name,
        themeData.description,
        themeData.isPremium,
        themeData.price,
        themeData.status,
        themeData.thumbnailUrl,
        JSON.stringify(themeData.defaultProperties),
      ]
    );
    console.log(`Created theme: ${themeData.name}`);
  }

  console.log('Theme seeding completed!');
  */

  // =====================================================
  // STAFF LOOKUP SAMPLE DATA
  // =====================================================
  console.log('Checking for Staff Lookup sample data...');

  // 1. Get or Create Tenant
  let tenantId: string;
  const tenants = await dataSource.query(`SELECT id FROM tenants LIMIT 1`);

  if (tenants.length > 0) {
    tenantId = tenants[0].id;
    console.log(`Using existing Tenant: ${tenantId}`);
  } else {
    console.log('Creating sample tenant...');
    const result = await dataSource.query(`
      INSERT INTO tenants (id, name, slug, status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'Sample Tenant', 'sample-tenant', 'active', NOW(), NOW())
      RETURNING id
    `);
    tenantId = result[0].id;
  }

  // 2. Create Event (if not exists)
  const eventName = 'Summer Music Festival 2026';
  let eventId: string;
  const existingEvent = await dataSource.query(
    `SELECT id FROM events_v2 WHERE "tenantId" = $1 AND name = $2`,
    [tenantId, eventName]
  );

  if (existingEvent.length > 0) {
    eventId = existingEvent[0].id;
    console.log(`Event "${eventName}" already exists.`);
  } else {
    console.log(`Creating event: ${eventName}`);
    const result = await dataSource.query(`
      INSERT INTO events_v2 (
        id, "tenantId", name, slug, description, venue, city, country, 
        "startAt", "endAt", status, "isPublished", capacity, "soldCount", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(), $1, $2, 'summer-music-festival-2026', 
        'An amazing summer music festival with top artists!', 'Central Park Arena', 'Dhaka', 'Bangladesh',
        NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days 8 hours',
        'published', true, 5000, 10, NOW(), NOW()
      )
      RETURNING id
    `, [tenantId, eventName]);
    eventId = result[0].id;
  }

  // 3. Create Ticket Types
  console.log('Ensuring ticket types...');
  const ticketTypes = [
    { name: 'VIP Access', price: 5000, qty: 100 },
    { name: 'General Admission', price: 1500, qty: 4900 }
  ];

  let ticketTypeIds: Record<string, string> = {};

  for (const tt of ticketTypes) {
    const existingTT = await dataSource.query(
      `SELECT id FROM ticket_types WHERE event_id = $1 AND name = $2`,
      [eventId, tt.name]
    );

    if (existingTT.length > 0) {
      ticketTypeIds[tt.name] = existingTT[0].id;
    } else {
      const result = await dataSource.query(`
        INSERT INTO ticket_types (
          id, event_id, name, description, price_taka, currency, 
          quantity_total, quantity_sold, sales_start, sales_end, status, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, 'Standard entry', $3, 'BDT', $4, 0,
          NOW() - INTERVAL '10 days', NOW() + INTERVAL '29 days', 'active', NOW(), NOW()
        )
        RETURNING id
      `, [eventId, tt.name, tt.price, tt.qty]);
      ticketTypeIds[tt.name] = result[0].id;
      console.log(`Created ticket type: ${tt.name}`);
    }
  }

  // 4. Create Sample Order & Tickets
  const sampleOrderEmail = 'johndoe@example.com';
  const existingOrder = await dataSource.query(
    `SELECT id FROM orders WHERE tenant_id = $1 AND buyer_email = $2`,
    [tenantId, sampleOrderEmail]
  );

  if (existingOrder.length === 0) {
    console.log('Creating sample order for John Doe...');
    const result = await dataSource.query(`
      INSERT INTO orders (
        id, tenant_id, event_id, buyer_email, buyer_name, 
        total_taka, currency, status, payment_intent_id, public_lookup_token, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, 'John Doe', 
        6500, 'BDT', 'completed', 'pi_seed_123', upper(substring(md5(random()::text), 1, 8)), NOW(), NOW()
      )
      RETURNING id
    `, [tenantId, eventId, sampleOrderEmail]);
    const orderId = result[0].id;

    // Create Order Items
    await dataSource.query(`
        INSERT INTO order_items (id, order_id, ticket_type_id, unit_price_taka, quantity, subtotal_taka, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, 5000, 1, 5000, NOW(), NOW())
    `, [orderId, ticketTypeIds['VIP Access']]);

    await dataSource.query(`
        INSERT INTO order_items (id, order_id, ticket_type_id, unit_price_taka, quantity, subtotal_taka, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, 1500, 1, 1500, NOW(), NOW())
    `, [orderId, ticketTypeIds['General Admission']]);

    // Create Tickets
    // VIP for John
    await dataSource.query(`
      INSERT INTO tickets (
        id, order_id, ticket_type_id, attendee_name, attendee_email, 
        qr_code_payload, qr_signature, status, seat_label, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, 'John Doe', $3, 
        'payload_vip_john', 'sig_vip_john', 'valid', 'A-1', NOW(), NOW()
      )
    `, [orderId, ticketTypeIds['VIP Access'], sampleOrderEmail]);

    // GA for Alice (on John's order)
    await dataSource.query(`
      INSERT INTO tickets (
        id, order_id, ticket_type_id, attendee_name, attendee_email, 
        qr_code_payload, qr_signature, status, seat_label, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, 'Alice Smith', 'alice@example.com', 
        'payload_ga_alice', 'sig_ga_alice', 'valid', NULL, NOW(), NOW()
      )
    `, [orderId, ticketTypeIds['General Admission']]);

    // GA for Bob (Checked In)
    await dataSource.query(`
      INSERT INTO tickets (
        id, order_id, ticket_type_id, attendee_name, attendee_email, 
        qr_code_payload, qr_signature, status, checked_in_at, seat_label, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, 'Bob Brown', 'bob@example.com', 
        'payload_ga_bob', 'sig_ga_bob', 'scanned', NOW(), NULL, NOW(), NOW()
      )
    `, [orderId, ticketTypeIds['General Admission']]);

    console.log('Sample order and tickets created!');
  } else {
    console.log('Sample order already exists.');
  }

  await app.close();
}
bootstrap();
