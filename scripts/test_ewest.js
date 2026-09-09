const { Client } = require('pg');
const ref = 'unqzsukbwqhgfdnujwva';
const pass = '14621462aB.';
const host = 'aws-1-eu-west-1.pooler.supabase.com';

const attempts = [
  { label: 'session-5432 user=postgres.ref', cs: `postgresql://postgres.${ref}:${encodeURIComponent(pass)}@${host}:5432/postgres` },
  { label: 'txn-6543 user=postgres.ref', cs: `postgresql://postgres.${ref}:${encodeURIComponent(pass)}@${host}:6543/postgres` },
  { label: 'session-5432 raw pass', cs: `postgresql://postgres.${ref}:${pass}@${host}:5432/postgres` },
];

(async () => {
  for (const a of attempts) {
    const client = new Client({ connectionString: a.cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 6000 });
    try {
      await client.connect();
      const r = await client.query('select current_database() db, now()');
      console.log('SUCCESS ->', a.label, JSON.stringify(r.rows[0]));
      console.log('USE_CS=' + a.cs);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log('FAIL', a.label, '::', e.message);
      try { await client.end(); } catch (_) {}
    }
  }
  process.exit(2);
})();
