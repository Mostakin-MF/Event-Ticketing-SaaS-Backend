const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'Saas',
});

async function debug_staff() {
    try {
        await client.connect();

        console.log('--- USERS (Staff related) ---');
        const users = await client.query("SELECT id, email, full_name FROM users WHERE email LIKE 'staff%'");
        console.table(users.rows);

        console.log('--- TENANT_USERS ---');
        const tenant_users = await client.query(`
            SELECT tu.user_id, u.email, tu.role, tu.status 
            FROM tenant_users tu
            JOIN users u ON tu.user_id = u.id
        `);
        console.table(tenant_users.rows);

        console.log('--- STAFF TABLE ---');
        const staff = await client.query(`
            SELECT s.user_id, u.email, s.position, s.is_active 
            FROM staff s
            JOIN users u ON s.user_id = u.id
        `);
        console.table(staff.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

debug_staff();
