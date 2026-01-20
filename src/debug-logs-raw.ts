
import { Client } from 'pg';

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'root',
    database: 'Saas',
});

async function run() {
    await client.connect();
    const tenantId = '40057f0e-3247-41d9-8730-73d3667a142e';

    console.log(`Checking logs for tenant: ${tenantId}`);

    const res = await client.query(
        'SELECT * FROM activity_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 10',
        [tenantId]
    );

    console.log(`Found ${res.rowCount} logs.`);
    console.log(JSON.stringify(res.rows, null, 2));

    await client.end();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
