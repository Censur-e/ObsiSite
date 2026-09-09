const { Client } = require('pg');

const ref = 'unqzsukbwqhgfdnujwva';
const pass = '14621462aB.';
const regions = [
  'eu-west-3','eu-central-1','eu-west-1','eu-west-2','eu-north-1','eu-central-2',
  'us-east-1','us-east-2','us-west-1','us-west-2',
  'ap-southeast-1','ap-southeast-2','ap-northeast-1','ap-south-1','sa-east-1','ca-central-1'
];
const prefixes = ['aws-0','aws-1'];

(async () => {
  for (const pre of prefixes) {
    for (const region of regions) {
      const host = `${pre}-${region}.pooler.supabase.com`;
      const cs = `postgresql://postgres.${ref}:${encodeURIComponent(pass)}@${host}:5432/postgres`;
      const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 4000 });
      try {
        await client.connect();
        await client.query('select 1');
        console.log('WORKING_CONNECTION_STRING=' + cs);
        await client.end();
        process.exit(0);
      } catch (e) {
        console.log(`fail ${host}: ${e.message}`);
        try { await client.end(); } catch (_) {}
      }
    }
  }
  console.log('NO_WORKING_POOLER');
  process.exit(2);
})();
