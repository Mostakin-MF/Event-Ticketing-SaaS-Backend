const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'Saas',
});

async function fix_staff_login() {
    try {
        await client.connect();

        const tenant_dhaka = 'b0000000-0000-0000-0000-000000000001';
        const tenant_chittagong = 'b0000000-0000-0000-0000-000000000002';

        const staff_users = [
            { email: 'staff1@example.com', id: 'a0000000-0000-0000-0000-000000000004', tenantId: tenant_dhaka, fullName: 'Staff Member One', position: 'Checker' },
            { email: 'staff2@example.com', id: 'a0000000-0000-0000-0000-000000000005', tenantId: tenant_dhaka, fullName: 'Staff Member Two', position: 'Supervisor' },
            { email: 'staff3@example.com', id: 'a0000000-0000-0000-0000-000000000006', tenantId: tenant_chittagong, fullName: 'Staff Member Three', position: 'Checker' },
        ];

        console.log('--- Applying Fix ---');

        for (const staff of staff_users) {
            console.log(`Processing ${staff.email}...`);

            // 1. Check if record in tenant_users exists
            const tu_res = await client.query('SELECT id FROM tenant_users WHERE user_id = $1 AND tenant_id = $2', [staff.id, staff.tenantId]);
            if (tu_res.rows.length === 0) {
                console.log(`Creating tenant_users record for ${staff.email}...`);
                await client.query(
                    'INSERT INTO tenant_users (id, tenant_id, user_id, role, status, created_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())',
                    [staff.tenantId, staff.id, 'staff', 'active']
                );
            } else {
                console.log(`Record in tenant_users already exists for ${staff.email}.`);
            }

            // 2. Check if record in staff table exists
            const s_res = await client.query('SELECT id FROM staff WHERE user_id = $1 AND tenant_id = $2', [staff.id, staff.tenantId]);
            if (s_res.rows.length === 0) {
                console.log(`Creating staff record for ${staff.email}...`);
                await client.query(
                    'INSERT INTO staff (id, tenant_id, user_id, "fullName", position, is_active, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())',
                    [staff.tenantId, staff.id, staff.fullName, staff.position]
                );
            } else {
                console.log(`Record in staff table already exists for ${staff.email}.`);
            }
        }

        console.log('Fix applied successfully!');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

fix_staff_login();
