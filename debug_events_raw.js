
const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'Saas', // Fixed database name
    password: '1234', // Fixed password
    port: 5432,
});

async function run() {
    try {
        await client.connect();
        // Use parameterized query to ensure exact match logic is same as driver
        const query = 'SELECT id, name, slug FROM events_v2 WHERE slug = $1';
        const values = ['JBL2026'];

        console.log(`Executing query: ${query} with values: ${JSON.stringify(values)}`);
        const res = await client.query(query, values);

        console.log('Events found:', res.rows);

        if (res.rows.length === 0) {
            console.log("Checking for similar slugs...");
            const wildRes = await client.query("SELECT slug FROM events_v2 WHERE slug LIKE '%JBL%'");
            console.log("Similar slugs:", wildRes.rows);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
