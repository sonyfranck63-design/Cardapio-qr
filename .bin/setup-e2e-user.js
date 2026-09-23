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

async function ensureTestUser() {
  const email = 'qa-e2e-teste@cardapioqr.com';
  const password = 'QaPassword@123456';

  // 1. Busca se já existe
  const { data: { users } } = await client.auth.admin.listUsers();
  let user = users.find(u => u.email === email);

  if (!user) {
    const { data, error } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { restaurant_name: 'Restaurante QA Teste' },
    });
    if (error) {
      console.error('Erro ao criar usuário:', error.message);
      return;
    }
    user = data.user;
    console.log('✅ Usuário de teste criado:', user.id);
  } else {
    // Atualiza a senha para garantir
    await client.auth.admin.updateUserById(user.id, { password });
    console.log('✅ Usuário de teste já existe e senha redefinida:', user.id);
  }

  // 2. Aguarda e garante restaurante
  let { data: restaurant } = await client
    .from('restaurants')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!restaurant) {
    const { data: createdRest } = await client
      .from('restaurants')
      .insert({
        user_id: user.id,
        name: 'Restaurante QA Teste',
        slug: 'restaurante-qa-teste-' + Date.now().toString().slice(-4),
        subscription_status: 'active',
      })
      .select()
      .single();
    restaurant = createdRest;
  }

  // 3. Garante que tenha ao menos uma categoria
  const { data: categories } = await client
    .from('categories')
    .select('id')
    .eq('restaurant_id', restaurant.id);

  if (!categories || categories.length === 0) {
    await client.from('categories').insert({
      restaurant_id: restaurant.id,
      name: '🍕 Pratos Principais',
      order: 0,
    });
    console.log('✅ Categoria de teste criada');
  } else {
    console.log('✅ Categoria já existente');
  }

  console.log('USER_READY:', email, password);
}

ensureTestUser().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
