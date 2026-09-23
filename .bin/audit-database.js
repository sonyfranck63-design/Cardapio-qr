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

async function audit() {
  console.log('--- AUDITORIA DO BANCO SUPABASE ---');

  // 1. Checar tabelas existentes
  const tables = ['restaurants', 'categories', 'menu_items', 'processed_payments'];
  for (const table of tables) {
    const { data, error } = await client.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Tabela [${table}]: NÃO EXISTE ou ERRO (${error.message})`);
    } else {
      console.log(`✅ Tabela [${table}]: EXISTE`);
    }
  }

  // 2. Checar colunas em restaurants
  const { data: restData } = await client.from('restaurants').select('*').limit(1);
  if (restData && restData.length > 0) {
    console.log('Campos presentes em restaurants:', Object.keys(restData[0]).join(', '));
  }

  // 3. Checar colunas em categories
  const { data: catData } = await client.from('categories').select('*').limit(1);
  if (catData && catData.length > 0) {
    console.log('Campos presentes em categories:', Object.keys(catData[0]).join(', '));
  }

  // 4. Checar colunas em menu_items
  const { data: itemData } = await client.from('menu_items').select('*').limit(1);
  if (itemData && itemData.length > 0) {
    console.log('Campos presentes em menu_items:', Object.keys(itemData[0]).join(', '));
  }
}

audit().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
