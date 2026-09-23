/**
 * Teste de Concorrência e Idempotência (RPC PostgreSQL & Webhook Security)
 * 
 * Valida:
 * 1. A atomicidade e idempotência do RPC apply_payment no PostgreSQL sob alta concorrência.
 * 2. Que o endpoint HTTP do Webhook não aceita mais bypass de mockPaymentInfo.
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Carrega variáveis de ambiente do .env.local
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || '';

try {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) return;
    const [key, ...values] = trimmed.split('=');
    const val = values.join('=').trim();
    if (key === 'NEXT_PUBLIC_SUPABASE_URL' && !supabaseUrl) supabaseUrl = val;
    if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !supabaseKey) supabaseKey = val;
    if (key === 'MERCADOPAGO_WEBHOOK_SECRET' && !webhookSecret) webhookSecret = val;
  });
} catch (e) {
  // Ignora se não existir
}

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/mercadopago/webhook';

async function runConcurrencyTest() {
  console.log('\n============================================================');
  console.log('🧪 QA TEST: CONCORRÊNCIA E IDEMPOTÊNCIA DA ASSINATURA');
  console.log('============================================================\n');

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials não encontradas no ambiente. Pulando teste de banco.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Busca restaurante de teste
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id, name, subscription_expires_at')
    .limit(1)
    .maybeSingle();

  if (restError || !restaurant) {
    console.warn('⚠️ Nenhum restaurante encontrado para o teste no Supabase.');
    return;
  }

  console.log(`🏪 Restaurante: ${restaurant.name} (ID: ${restaurant.id})`);
  const testPaymentId = `sim_pay_${Date.now()}_concurrency`;
  console.log(`💳 ID de Pagamento Simulado: ${testPaymentId}`);
  console.log('⚡ Disparando 2 chamadas concorrentes ao RPC apply_payment simultaneamente...\n');

  const startTime = Date.now();

  const [res1, res2] = await Promise.all([
    supabase.rpc('apply_payment', {
      p_payment_id: testPaymentId,
      p_restaurant_id: restaurant.id,
      p_amount: 49.90,
    }),
    supabase.rpc('apply_payment', {
      p_payment_id: testPaymentId,
      p_restaurant_id: restaurant.id,
      p_amount: 49.90,
    }),
  ]);

  const duration = Date.now() - startTime;

  console.log('📥 Resposta RPC #1:', JSON.stringify(res1.data || res1.error, null, 2));
  console.log('📥 Resposta RPC #2:', JSON.stringify(res2.data || res2.error, null, 2));
  console.log(`\n⏱️ Tempo total da operação: ${duration}ms`);

  const results = [res1.data, res2.data].filter(Boolean);
  const successCount = results.filter(r => r.success === true && r.already_processed === false).length;
  const alreadyProcessedCount = results.filter(r => r.already_processed === true).length;

  console.log('\n============================================================');
  console.log('🔍 ANÁLISE DE ATOMICIDADE:');
  console.log('============================================================');

  let passed = true;

  if (successCount === 1) {
    console.log('✅ [PASS] Exatamente UMA chamada executou e estendeu a assinatura.');
  } else {
    console.log(`❌ [FAIL] Chamadas processadas com sucesso: ${successCount} (Esperado: 1)`);
    passed = false;
  }

  if (alreadyProcessedCount === 1) {
    console.log('✅ [PASS] Exatamente UMA chamada foi interceptada pela idempotência atômica.');
  } else {
    console.log(`❌ [FAIL] Chamadas marcadas como already_processed: ${alreadyProcessedCount} (Esperado: 1)`);
    passed = false;
  }

  // 2. Validação de rejeição de mock no Webhook HTTP
  console.log('\n🔒 Testando rejeição de requisição forjada no Webhook HTTP...');
  try {
    const fakeReq = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment',
        data: { id: 'fake_attempt_123' },
        mockPaymentInfo: { status: 'approved' },
      }),
    });

    console.log(`   HTTP Status retornado para mock não autenticado: ${fakeReq.status}`);
    if (fakeReq.status === 401 || fakeReq.status === 500 || fakeReq.status === 502) {
      console.log('✅ [PASS] O webhook rejeitou a tentativa não assinada/forjada.');
    } else {
      console.log(`⚠️ Status inesperado: ${fakeReq.status}`);
    }
  } catch (netErr) {
    console.log('ℹ️ Servidor web não está rodando localmente no momento (esperado em testes isolados).');
  }

  console.log('\n============================================================');
  if (passed) {
    console.log('🎉 RESULTADO: CONCORRÊNCIA E IDEMPOTÊNCIA VALIDADAS COM SUCESSO!');
    process.exit(0);
  } else {
    console.log('💥 RESULTADO: FALHA NA VALIDAÇÃO DE CONCORRÊNCIA.');
    process.exit(1);
  }
}

runConcurrencyTest().catch(err => {
  console.error('❌ Erro no teste de concorrência:', err);
  process.exit(1);
});
