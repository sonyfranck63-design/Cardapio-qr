const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
  if (!supabaseKey && line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const client = createClient(supabaseUrl, supabaseKey);
client.from('processed_payments').select('id').limit(1).then(res => {
  if (res.error) {
    console.log('TABELA_STATUS:', res.error.message);
  } else {
    console.log('TABELA_STATUS: EXISTE');
  }
  process.exit(0);
});
