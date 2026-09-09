const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    const r = await client.query('select now() as now, version() as version');
    console.log('CONNECTED OK:', r.rows[0].now);
    await client.end();
  } catch (e) {
    console.error('CONNECT FAILED:', e.message);
    process.exit(1);
  }
})();
