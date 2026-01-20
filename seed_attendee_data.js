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

// Utility function to generate slug from name
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function seed() {
    try {
        await client.connect();
        console.log('Connected to database successfully!\n');

        // ========================================
        // 0. CLEANUP EXISTING TEST DATA
        // ========================================
        console.log('🧹 Cleaning up existing test data...');

        // Delete in reverse dependency order
        await client.query(`DELETE FROM attendees WHERE "userId" IN (SELECT id FROM users WHERE email LIKE 'attendee%@test.com')`);
        await client.query(`DELETE FROM users WHERE email LIKE 'attendee%@test.com'`);
        await client.query(`DELETE FROM tickets_v2 WHERE "eventId" IN (SELECT id FROM events_v2 WHERE slug IN ('tech-summit-2026', 'js-bangladesh-meetup', 'rock-fest-bangladesh-2026', 'classical-symphony-night', 'job-fair-dhaka-2026'))`);
        await client.query(`DELETE FROM events_v2 WHERE slug IN ('tech-summit-2026', 'js-bangladesh-meetup', 'rock-fest-bangladesh-2026', 'classical-symphony-night', 'job-fair-dhaka-2026')`);
        await client.query(`DELETE FROM tenants WHERE slug IN ('tech-events-bd', 'music-mania', 'career-connect')`);

        console.log('  ✓ Cleanup completed\n');

        // ========================================
        // 1. CREATE TENANTS (Event Organizers)
        // ========================================
        console.log('📋 Creating Tenants...');
        const tenants = [];

        const tenantData = [
            {
                name: 'Tech Events BD',
                slug: 'tech-events-bd',
                status: 'active',
                brandingSettings: {
                    logo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200',
                    primaryColor: '#3B82F6',
                    secondaryColor: '#10B981'
                }
            },
            {
                name: 'Music Mania',
                slug: 'music-mania',
                status: 'active',
                brandingSettings: {
                    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
                    primaryColor: '#EF4444',
                    secondaryColor: '#F59E0B'
                }
            },
            {
                name: 'Career Connect',
                slug: 'career-connect',
                status: 'active',
                brandingSettings: {
                    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
                    primaryColor: '#8B5CF6',
                    secondaryColor: '#EC4899'
                }
            }
        ];

        for (const tenant of tenantData) {
            const result = await client.query(
                `INSERT INTO tenants (name, slug, status, branding_settings, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 RETURNING id, name`,
                [tenant.name, tenant.slug, tenant.status, JSON.stringify(tenant.brandingSettings)]
            );
            tenants.push({ ...tenant, id: result.rows[0].id });
            console.log(`  ✓ Created tenant: ${result.rows[0].name} (${result.rows[0].id})`);
        }

        // ========================================
        // 2. CREATE EVENTS
        // ========================================
        console.log('\n🎉 Creating Events...');
        const events = [];

        const eventData = [
            // Tech Events BD
            {
                tenantId: tenants[0].id,
                tenantSlug: tenants[0].slug,
                name: 'Tech Summit 2026',
                slug: 'tech-summit-2026',
                description: 'The largest technology conference in Bangladesh, featuring industry leaders and cutting-edge innovations.',
                startAt: new Date('2026-03-15T09:00:00'),
                endAt: new Date('2026-03-16T18:00:00'),
                venue: 'Bangabandhu International Conference Center',
                city: 'Dhaka',
                country: 'Bangladesh',
                imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
                price: 1500,
                status: 'published',
                isPublished: true,
                capacity: 500,
                soldCount: 87,
                fullDescription: 'Join us for two days of inspiring talks, hands-on workshops, and networking opportunities with tech professionals from across South Asia. Topics include AI, Cloud Computing, Cybersecurity, and Web3.',
                schedule: [
                    { time: '09:00 AM', activity: 'Registration & Breakfast', description: 'Check-in and networking breakfast' },
                    { time: '10:00 AM', activity: 'Opening Keynote', description: 'Future of Technology in Bangladesh' },
                    { time: '12:00 PM', activity: 'Workshop Sessions', description: 'Parallel tracks on AI, Cloud, and Security' },
                    { time: '02:00 PM', activity: 'Lunch Break', description: 'Networking lunch' },
                    { time: '03:00 PM', activity: 'Panel Discussion', description: 'Building Tech Startups in 2026' }
                ],
                faq: [
                    { question: 'What should I bring?', answer: 'Bring your laptop, notebook, and business cards for networking.' },
                    { question: 'Is parking available?', answer: 'Yes, free parking is available for all attendees.' },
                    { question: 'Can I get a refund?', answer: 'Refunds available up to 7 days before the event.' }
                ]
            },
            {
                tenantId: tenants[0].id,
                tenantSlug: tenants[0].slug,
                name: 'JavaScript Bangladesh Meetup',
                slug: 'js-bangladesh-meetup',
                description: 'Monthly meetup for JavaScript developers. Learn about React, Node.js, and modern web development.',
                startAt: new Date('2026-02-20T18:00:00'),
                endAt: new Date('2026-02-20T21:00:00'),
                venue: 'BRAC Centre',
                city: 'Dhaka',
                country: 'Bangladesh',
                imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
                price: 0,
                status: 'published',
                isPublished: true,
                capacity: 120,
                soldCount: 45,
                fullDescription: 'A casual evening meetup for JavaScript enthusiasts. Share knowledge, learn new frameworks, and connect with fellow developers.',
                schedule: [
                    { time: '06:00 PM', activity: 'Registration', description: 'Welcome & refreshments' },
                    { time: '06:30 PM', activity: 'Lightning Talks', description: '3 quick presentations on latest JS trends' },
                    { time: '08:00 PM', activity: 'Open Discussion', description: 'Q&A and networking' }
                ],
                faq: [
                    { question: 'Is this event free?', answer: 'Yes, completely free! Just register to secure your spot.' },
                    { question: 'Do I need to be an expert?', answer: 'No! All skill levels are welcome.' }
                ]
            },
            // Music Mania
            {
                tenantId: tenants[1].id,
                tenantSlug: tenants[1].slug,
                name: 'Rock Fest Bangladesh 2026',
                slug: 'rock-fest-bangladesh-2026',
                description: 'The biggest rock music festival in Bangladesh! Featuring top local and international rock bands.',
                startAt: new Date('2026-04-10T16:00:00'),
                endAt: new Date('2026-04-11T23:00:00'),
                venue: 'Army Stadium',
                city: 'Dhaka',
                country: 'Bangladesh',
                imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
                price: 800,
                status: 'published',
                isPublished: true,
                capacity: 5000,
                soldCount: 1234,
                fullDescription: 'Two days of non-stop rock music! Experience electrifying performances from Bangladesh\'s top rock bands and special international guests. Food trucks, merchandise stalls, and an unforgettable atmosphere.',
                schedule: [
                    { time: '04:00 PM', activity: 'Gates Open', description: 'Entry and food court opens' },
                    { time: '05:00 PM', activity: 'Opening Acts', description: 'Local emerging bands' },
                    { time: '07:00 PM', activity: 'Headliners', description: 'Main performances begin' },
                    { time: '10:00 PM', activity: 'Closing Act', description: 'Grand finale' }
                ],
                faq: [
                    { question: 'Can I bring my camera?', answer: 'Small cameras are allowed. Professional equipment requires media pass.' },
                    { question: 'Is food available?', answer: 'Yes! Multiple food trucks and stalls will be available.' },
                    { question: 'What about safety?', answer: 'Full security, medical assistance, and emergency services on-site.' }
                ]
            },
            {
                tenantId: tenants[1].id,
                tenantSlug: tenants[1].slug,
                name: 'Classical Symphony Night',
                slug: 'classical-symphony-night',
                description: 'An elegant evening of classical music featuring the Dhaka Symphony Orchestra.',
                startAt: new Date('2026-06-25T19:00:00'),
                endAt: new Date('2026-06-25T22:00:00'),
                venue: 'National Theatre Hall',
                city: 'Dhaka',
                country: 'Bangladesh',
                imageUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800',
                price: 1200,
                status: 'published',
                isPublished: true,
                capacity: 300,
                soldCount: 12,
                fullDescription: 'Experience the beauty of classical music with performances of Mozart, Beethoven, and Vivaldi. A sophisticated evening in an intimate setting.',
                schedule: [
                    { time: '07:00 PM', activity: 'Doors Open', description: 'Welcome reception with light refreshments' },
                    { time: '07:30 PM', activity: 'First Movement', description: 'Mozart and Vivaldi' },
                    { time: '08:30 PM', activity: 'Intermission', description: '15-minute break' },
                    { time: '08:45 PM', activity: 'Second Movement', description: 'Beethoven Symphony' }
                ],
                faq: [
                    { question: 'What is the dress code?', answer: 'Smart casual to formal attire recommended.' },
                    { question: 'Are children allowed?', answer: 'Yes, children above 8 years are welcome.' }
                ]
            },
            // Career Connect
            {
                tenantId: tenants[2].id,
                tenantSlug: tenants[2].slug,
                name: 'Job Fair Dhaka 2026',
                slug: 'job-fair-dhaka-2026',
                description: 'Connect with 100+ top employers. Find your dream job at Bangladesh\'s largest career fair.',
                startAt: new Date('2026-02-28T09:00:00'),
                endAt: new Date('2026-02-28T17:00:00'),
                venue: 'International Convention City Bashundhara',
                city: 'Dhaka',
                country: 'Bangladesh',
                imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
                price: 200,
                status: 'published',
                isPublished: true,
                capacity: 2000,
                soldCount: 456,
                fullDescription: 'Meet recruiters from multinational companies, local enterprises, and startups. Participate in resume reviews, mock interviews, and career counseling sessions. Opportunities across IT, Finance, Marketing, Engineering, and more.',
                schedule: [
                    { time: '09:00 AM', activity: 'Registration', description: 'Check-in and badge collection' },
                    { time: '10:00 AM', activity: 'Opening Ceremony', description: 'Welcome address by industry leaders' },
                    { time: '10:30 AM', activity: 'Employer Booths Open', description: 'Meet recruiters and submit resumes' },
                    { time: '01:00 PM', activity: 'Resume Review Sessions', description: 'Get expert feedback on your CV' },
                    { time: '03:00 PM', activity: 'Mock Interviews', description: 'Practice with professional interviewers' }
                ],
                faq: [
                    { question: 'What should I bring?', answer: 'Bring multiple copies of your resume and dress professionally.' },
                    { question: 'Will there be on-the-spot interviews?', answer: 'Yes, many companies conduct preliminary interviews at the fair.' },
                    { question: 'Is there an age limit?', answer: 'No age limit. Open to fresh graduates and experienced professionals.' }
                ]
            }
        ];

        for (const event of eventData) {
            const result = await client.query(
                `INSERT INTO events_v2 
                 ("tenantId", name, slug, description, "startAt", "endAt", venue, city, country, 
                  "imageUrl", price, status, "isPublished", capacity, "soldCount", "fullDescription", 
                  schedule, faq, "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
                 RETURNING id, name`,
                [
                    event.tenantId, event.name, event.slug, event.description,
                    event.startAt, event.endAt, event.venue, event.city, event.country,
                    event.imageUrl, event.price, event.status, event.isPublished,
                    event.capacity, event.soldCount, event.fullDescription,
                    JSON.stringify(event.schedule), JSON.stringify(event.faq)
                ]
            );
            events.push({ ...event, id: result.rows[0].id });
            console.log(`  ✓ Created event: ${result.rows[0].name} (${result.rows[0].id})`);
        }

        // ========================================
        // 3. CREATE TICKETS
        // ========================================
        console.log('\n🎫 Creating Ticket Types...');
        const tickets = [];

        const ticketData = [
            // Tech Summit 2026
            {
                eventId: events[0].id,
                name: 'Early Bird',
                description: 'Limited early bird discount - save 40%!',
                price: 900,
                quantity: 100,
                soldCount: 45,
                status: 'available',
                metadata: { features: ['Full access to all sessions', 'Conference materials', 'Lunch included', 'Certificate of participation'] }
            },
            {
                eventId: events[0].id,
                name: 'General Admission',
                description: 'Standard ticket with full access',
                price: 1500,
                quantity: 300,
                soldCount: 35,
                status: 'available',
                metadata: { features: ['Full access to all sessions', 'Conference materials', 'Lunch included', 'Certificate of participation'] }
            },
            {
                eventId: events[0].id,
                name: 'VIP Pass',
                description: 'Premium experience with exclusive benefits',
                price: 2500,
                quantity: 100,
                soldCount: 7,
                status: 'available',
                metadata: { features: ['Front row seating', 'VIP lounge access', 'Meet & greet with speakers', 'Premium swag bag', 'All General benefits'] }
            },
            // JS Bangladesh Meetup
            {
                eventId: events[1].id,
                name: 'Free Entry',
                description: 'Free admission - just register!',
                price: 0,
                quantity: 120,
                soldCount: 45,
                status: 'available',
                metadata: { features: ['Access to all talks', 'Networking session', 'Refreshments'] }
            },
            // Rock Fest Bangladesh
            {
                eventId: events[2].id,
                name: 'Early Bird',
                description: 'Get 50% off - limited slots!',
                price: 400,
                quantity: 500,
                soldCount: 234,
                status: 'available',
                metadata: { features: ['2-day access', 'Standing area', 'Food court access'] }
            },
            {
                eventId: events[2].id,
                name: 'General Admission',
                description: 'Standard festival pass',
                price: 800,
                quantity: 3500,
                soldCount: 890,
                status: 'available',
                metadata: { features: ['2-day access', 'Standing area', 'Food court access', 'Official festival wristband'] }
            },
            {
                eventId: events[2].id,
                name: 'VIP Experience',
                description: 'Premium festival experience',
                price: 2000,
                quantity: 500,
                soldCount: 78,
                status: 'available',
                metadata: { features: ['VIP seating area', 'Dedicated entry gate', 'Backstage access', 'Meet artists', 'Free merchandise', 'VIP lounge'] }
            },
            {
                eventId: events[2].id,
                name: 'Student Pass',
                description: 'Special discount for students',
                price: 500,
                quantity: 500,
                soldCount: 32,
                status: 'available',
                metadata: { features: ['2-day access', 'Standing area', 'Student ID required at entry'] }
            },
            // Classical Symphony
            {
                eventId: events[3].id,
                name: 'Standard Seat',
                description: 'Regular seating',
                price: 1200,
                quantity: 200,
                soldCount: 8,
                status: 'available',
                metadata: { features: ['Reserved seating', 'Program booklet'] }
            },
            {
                eventId: events[3].id,
                name: 'Premium Seat',
                description: 'Front section seating',
                price: 2000,
                quantity: 100,
                soldCount: 4,
                status: 'available',
                metadata: { features: ['Premium section seating', 'Program booklet', 'Meet the orchestra after show'] }
            },
            // Job Fair
            {
                eventId: events[4].id,
                name: 'Job Seeker Pass',
                description: 'Access to all employer booths',
                price: 200,
                quantity: 1500,
                soldCount: 356,
                status: 'available',
                metadata: { features: ['Access to all booths', 'Resume upload to database', 'Job fair bag'] }
            },
            {
                eventId: events[4].id,
                name: 'Professional Plus',
                description: 'Includes workshops and coaching',
                price: 500,
                quantity: 500,
                soldCount: 100,
                status: 'available',
                metadata: { features: ['All Job Seeker benefits', 'Resume review session', 'Mock interview', 'Career counseling', 'Lunch voucher'] }
            }
        ];

        for (const ticket of ticketData) {
            const result = await client.query(
                `INSERT INTO tickets_v2 
                 ("eventId", name, description, price, quantity, "soldCount", status, metadata, "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                 RETURNING id, name`,
                [
                    ticket.eventId, ticket.name, ticket.description, ticket.price,
                    ticket.quantity, ticket.soldCount, ticket.status, JSON.stringify(ticket.metadata)
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
        console.log(`   • ${tenants.length} Tenants created`);
        console.log(`   • ${events.length} Events created`);
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

        console.log('\n📝 Event URLs:');
        for (const event of events) {
            const tenant = tenants.find(t => t.id === event.tenantId);
            console.log(`   • http://localhost:3000/${tenant.slug}/${event.slug}`);
        }

        console.log('\n💡 Next Steps:');
        console.log('   1. Start the backend: cd Backend && npm run start:dev');
        console.log('   2. Start the frontend: cd Frontend && npm run dev');
        console.log('   3. Login as attendee1@test.com and test the workflow!');
        console.log('   4. Browse events, add tickets to cart, and complete checkout');
        console.log('\n📌 Note: Customer accounts and sample orders will be created when');
        console.log('   attendees make their first purchases through the application.\n');

    } catch (err) {
        console.error('❌ Error during seeding:', err);
        console.error('Stack trace:', err.stack);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

seed();
