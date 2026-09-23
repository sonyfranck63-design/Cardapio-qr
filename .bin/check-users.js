const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
let supabaseUrl = '';
let supabaseServiceKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseServiceKey = line.split('=')[1].trim();
});

const client = createClient(supabaseUrl, supabaseServiceKey);
client.auth.admin.listUsers().then(res => {
  if (res.data?.users) {
    console.log('USUARIOS:', res.data.users.map(u => ({ id: u.id, email: u.email })));
  } else {
    console.log('ERRO:', res.error);
  }
  process.exit(0);
});
