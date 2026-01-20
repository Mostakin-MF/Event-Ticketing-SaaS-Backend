const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'Saas',
});

// Utility function to hash passwords
async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

async function seed() {
    try {
        await client.connect();
        console.log('Connected to database successfully!\n');

        // ========================================
        // 0. CLEANUP EXISTING TEST DATA
        // ========================================
        console.log('🧹 Cleaning up existing test data from events table...');

        // Clean up old test data
        await client.query(`DELETE FROM ticket_types WHERE event_id IN (SELECT id FROM events WHERE name LIKE '%Summit 2026%' OR name LIKE '%Bangladesh%')`);
        await client.query(`DELETE FROM events WHERE name LIKE '%Summit 2026%' OR name LIKE '%Bangladesh%' OR name LIKE '%Rock Fest%' OR name LIKE '%Symphony%' OR name LIKE '%Job Fair%'`);

        // Clean up attendees
        await client.query(`DELETE FROM attendees WHERE "userId" IN (SELECT id FROM users WHERE email LIKE 'attendee%@test.com')`);
        await client.query(`DELETE FROM users WHERE email LIKE 'attendee%@test.com'`);

        console.log('  ✓ Cleanup completed\n');

        // ========================================
        // 1. GET OR CREATE TENANT
        // ========================================
        console.log('📋 Getting/Creating Tenant...');

        // Check if tenant exists
        let tenant = await client.query(`SELECT id FROM tenants WHERE slug = 'default-tenant' LIMIT 1`);
        let tenantId;

        if (tenant.rows.length > 0) {
            tenantId = tenant.rows[0].id;
            console.log(`  ✓ Using existing tenant: ${tenantId}`);
        } else {
            // Create a default tenant
            const tenantResult = await client.query(
                `INSERT INTO tenants (name, slug, status, created_at, updated_at)
                 VALUES ($1, $2, $3, NOW(), NOW())
                 RETURNING id`,
                ['Default Organizer', 'default-tenant', 'active']
            );
            tenantId = tenantResult.rows[0].id;
            console.log(`  ✓ Created new tenant: ${tenantId}`);
        }

        // ========================================
        // 2. CREATE EVENTS IN 'events' TABLE
        // ========================================
        console.log('\n🎉 Creating Events in events table...');
        const events = [];

        const eventData = [
            {
                tenantId,
                name: 'Tech Summit 2026',
                slug: 'tech-summit-2026',
                description: 'The largest technology conference in Bangladesh, featuring industry leaders and cutting-edge innovations in AI, Cloud Computing, Cybersecurity, and Web3.',
                startAt: new Date('2026-03-15T09:00:00'),
                endAt: new Date('2026-03-16T18:00:00'),
                venue: 'Bangabandhu International Conference Center',
                city: 'Dhaka',
                country: 'Bangladesh',
                status: 'active',
                isPublic: true,
                heroImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
            },
            {
                tenantId,
                name: 'JavaScript Bangladesh Meetup',
                slug: 'js-bangladesh-meetup',
                description: 'Monthly meetup for JavaScript developers. Learn about React, Node.js, and modern web development.',
                startAt: new Date('2026-02-20T18:00:00'),
                endAt: new Date('2026-02-20T21:00:00'),
                venue: 'BRAC Centre',
                city: 'Dhaka',
                country: 'Bangladesh',
                status: 'active',
                isPublic: true,
                heroImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'
            },
            {
                tenantId,
                name: 'Rock Fest Bangladesh 2026',
                slug: 'rock-fest-bangladesh-2026',
                description: 'The biggest rock music festival in Bangladesh! Featuring top local and international rock bands.',
                startAt: new Date('2026-04-10T16:00:00'),
                endAt: new Date('2026-04-11T23:00:00'),
                venue: 'Army Stadium',
                city: 'Dhaka',
                country: 'Bangladesh',
                status: 'active',
                isPublic: true,
                heroImageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'
            },
            {
                tenantId,
                name: 'Classical Symphony Night',
                slug: 'classical-symphony-night',
                description: 'An elegant evening of classical music featuring the Dhaka Symphony Orchestra.',
                startAt: new Date('2026-06-25T19:00:00'),
                endAt: new Date('2026-06-25T22:00:00'),
                venue: 'National Theatre Hall',
                city: 'Dhaka',
                country: 'Bangladesh',
                status: 'active',
                isPublic: true,
                heroImageUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800'
            },
            {
                tenantId,
                name: 'Job Fair Dhaka 2026',
                slug: 'job-fair-dhaka-2026',
                description: 'Connect with 100+ top employers. Find your dream job at Bangladesh\'s largest career fair.',
                startAt: new Date('2026-02-28T09:00:00'),
                endAt: new Date('2026-02-28T17:00:00'),
                venue: 'International Convention City Bashundhara',
                city: 'Dhaka',
                country: 'Bangladesh',
                status: 'active',
                isPublic: true,
                heroImageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800'
            }
        ];

        for (const event of eventData) {
            const result = await client.query(
                `INSERT INTO events 
                 (tenant_id, name, slug, description, start_at, end_at, venue, city, country, status, is_public, hero_image_url, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
                 RETURNING id, name`,
                [
                    event.tenantId, event.name, event.slug, event.description,
                    event.startAt, event.endAt, event.venue, event.city, event.country,
                    event.status, event.isPublic, event.heroImageUrl
                ]
            );
            events.push({ ...event, id: result.rows[0].id });
            console.log(`  ✓ Created event: ${result.rows[0].name} (${result.rows[0].id})`);
        }

        // ========================================
        // 3. CREATE TICKET TYPES
        // ========================================
        console.log('\n🎫 Creating Ticket Types...');
        const tickets = [];

        const ticketData = [
            // Tech Summit 2026
            {
                eventId: events[0].id,
                name: 'Early Bird',
                description: 'Limited early bird discount - save 40%!',
                priceTaka: 900,
                quantityTotal: 100,
                quantitySold: 0,
                salesStart: new Date('2026-01-01T00:00:00'),
                salesEnd: new Date('2026-03-14T23:59:59'),
                status: 'active'
            },
            {
                eventId: events[0].id,
                name: 'General Admission',
                description: 'Standard ticket with full access',
                priceTaka: 1500,
                quantityTotal: 300,
                quantitySold: 0,
                salesStart: new Date('2026-01-01T00:00:00'),
                salesEnd: new Date('2026-03-14T23:59:59'),
                status: 'active'
            },
            {
                eventId: events[0].id,
                name: 'VIP Pass',
                description: 'Premium experience with exclusive benefits',
                priceTaka: 2500,
                quantityTotal: 100,
                quantitySold: 0,
                salesStart: new Date('2026-01-01T00:00:00'),
                salesEnd: new Date('2026-03-14T23:59:59'),
                status: 'active'
            },
            // JS Bangladesh Meetup
            {
                eventId: events[1].id,
                name: 'Free Entry',
                description: 'Free admission - just register!',
                priceTaka: 0,
                quantityTotal: 120,
                quantitySold: 0,
                salesStart: new Date('2026-01-01T00:00:00'),
                salesEnd: new Date('2026-02-19T23:59:59'),
                status: 'active'
            },
            // Rock Fest Bangladesh
            {
                eventId: events[2].id,
                name: 'Early Bird',
                description: 'Get 50% off - limited slots!',
                priceTaka: 400,
                quantityTotal: 500,
                quantitySold: 0,
                salesStart: new Date('2026-01-01T00:00:00'),
                salesEnd: new Date('2026-04-09T23:59:59'),
                status: 'active'
            },
            {
                eventId: events[2].id,
                name: 'General Admission',
                description: 'Standard festival pass',
                priceTaka: 800,
                quantityTotal: 3500,
                quantitySold: 0,
                salesStart: new Date('2026-01-01T00:00:00'),
                salesEnd: new Date('2026-04-09T23:59:59'),
                status: 'active'
            },
            {
                eventId: events[2].id,
                name: 'VIP Experience',
                description: 'Premium festival experience',
                priceTaka: 2000,
                quantityTotal: 500,
                quantitySold: 0,
                salesStart: new Date('2026-01-01T00:00:00'),
                salesEnd: new Date('2026-04-09T23:59:59'),
                status: 'active'
            },
            {
                eventId: events[2].id,
                name: 'Student Pass',
                description: 'Special discount for students',
                priceTaka: 500,
                quantityTotal: 500,
                quantitySold: 0,
                salesStart: new Date('2026-01-01T00:00:00'),
                salesEnd: new Date('2026-04-09T23:59:59'),
                status: 'active'
            },
            // Classical Symphony
            {
                eventId: events[3].id,
                name: 'Standard Seat',
                description: 'Regular seating',
                priceTaka: 1200,
                quantityTotal: 200,
                quantitySold: 0,
                salesStart: new Date('2026-01-01T00:00:00'),
                salesEnd: new Date('2026-06-24T23:59:59'),
                status: 'active'
            },
            {
                eventId: events[3].id,
                name: 'Premium Seat',
                description: 'Front section seating',
                priceTaka: 2000,
                quantityTotal: 100,
                quantitySold: 0,
                salesStart: new Date('2026-01-01T00:00:00'),
                salesEnd: new Date('2026-06-24T23:59:59'),
                status: 'active'
            },
            // Job Fair
            {
                eventId: events[4].id,
                name: 'Job Seeker Pass',
                description: 'Access to all employer booths',
                priceTaka: 200,
                quantityTotal: 1500,
                quantitySold: 0,
                salesStart: new Date('2026-01-01T00:00:00'),
                salesEnd: new Date('2026-02-27T23:59:59'),
                status: 'active'
            },
            {
                eventId: events[4].id,
                name: 'Professional Plus',
                description: 'Includes workshops and coaching',
                priceTaka: 500,
                quantityTotal: 500,
                quantitySold: 0,
                salesStart: new Date('2026-01-01T00:00:00'),
                salesEnd: new Date('2026-02-27T23:59:59'),
                status: 'active'
            }
        ];

        for (const ticket of ticketData) {
            const result = await client.query(
                `INSERT INTO ticket_types 
                 (event_id, name, description, price_taka, currency, quantity_total, quantity_sold, sales_start, sales_end, status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                 RETURNING id, name`,
                [
                    ticket.eventId, ticket.name, ticket.description, ticket.priceTaka,
                    'BDT', ticket.quantityTotal, ticket.quantitySold,
                    ticket.salesStart, ticket.salesEnd, ticket.status
                ]
            );
            tickets.push({ ...ticket, id: result.rows[0].id });
            console.log(`  ✓ Created ticket: ${result.rows[0].name} for event (${ticket.eventId})`);
        }

        // ========================================
        // 4. CREATE ATTENDEE USERS
        // ========================================
        console.log('\n👤 Creating Attendee Users...');
        const users = [];
        const attendees = [];

        const password = 'password123';
        const passwordHash = await hashPassword(password);

        const userData = [
            {
                email: 'attendee1@test.com',
                fullName: 'Rahul Ahmed',
                phoneNumber: '+8801712345678',
                dateOfBirth: '1995-05-15',
                gender: 'Male',
                country: 'Bangladesh',
                city: 'Dhaka'
            },
            {
                email: 'attendee2@test.com',
                fullName: 'Fatima Khan',
                phoneNumber: '+8801823456789',
                dateOfBirth: '1998-08-22',
                gender: 'Female',
                country: 'Bangladesh',
                city: 'Chittagong'
            },
            {
                email: 'attendee3@test.com',
                fullName: 'Imran Hassan',
                phoneNumber: '+8801934567890',
                dateOfBirth: '1992-12-10',
                gender: 'Male',
                country: 'Bangladesh',
                city: 'Dhaka'
            }
        ];

        for (const user of userData) {
            // Create user account
            const userResult = await client.query(
                `INSERT INTO users (email, password_hash, full_name, is_platform_admin, created_at, updated_at)
                 VALUES ($1, $2, $3, false, NOW(), NOW())
                 RETURNING id, email, full_name`,
                [user.email, passwordHash, user.fullName]
            );
            const userId = userResult.rows[0].id;
            users.push({ ...user, id: userId });
            console.log(`  ✓ Created user: ${userResult.rows[0].full_name} (${userResult.rows[0].email})`);

            // Create attendee profile
            const attendeeResult = await client.query(
                `INSERT INTO attendees ("userId", "phoneNumber", "dateOfBirth", gender, country, city, "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                 RETURNING id`,
                [userId, user.phoneNumber, user.dateOfBirth, user.gender, user.country, user.city]
            );
            attendees.push({ ...user, id: attendeeResult.rows[0].id, userId });
            console.log(`    → Created attendee profile for ${user.fullName}`);
        }

        // ========================================
        // SUMMARY
        // ========================================
        console.log('\n\n✅ ========================================');
        console.log('✅  SEED COMPLETED SUCCESSFULLY!');
        console.log('✅ ========================================\n');

        console.log('📊 Summary:');
        console.log(`   • 1 Tenant (using default-tenant)`);
        console.log(`   • ${events.length} Events created in 'events' table`);
        console.log(`   • ${tickets.length} Ticket types created`);
        console.log(`   • ${users.length} Attendee users created`);
        console.log(`   • ${attendees.length} Attendee profiles created\n`);

        console.log('🔑 Test Credentials:');
        console.log('   ├─ Email: attendee1@test.com');
        console.log('   │  Password: password123');
        console.log('   │  Name: Rahul Ahmed');
        console.log('   │');
        console.log('   ├─ Email: attendee2@test.com');
        console.log('   │  Password: password123');
        console.log('   │  Name: Fatima Khan');
        console.log('   │');
        console.log('   └─ Email: attendee3@test.com');
        console.log('      Password: password123');
        console.log('      Name: Imran Hassan\n');

        console.log('🎉 Events Available:');
        for (const event of events) {
            console.log(`   • ${event.name} (${event.city}, ${new Date(event.startAt).toLocaleDateString()})`);
        }

        console.log('\n💡 Next Steps:');
        console.log('   1. Start the backend: cd Backend && npm run start:dev');
        console.log('   2. Start the frontend: cd Frontend && npm run dev');
        console.log('   3. Login as attendee1@test.com and test the workflow!');
        console.log('   4. Go to /attendee/dashboard/events to see the events');
        console.log('\n📌 Note: Events are now in the correct \'events\' table with status=\'active\' and is_public=true\n');

    } catch (err) {
        console.error('❌ Error during seeding:', err);
        console.error('Stack trace:', err.stack);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

seed();
