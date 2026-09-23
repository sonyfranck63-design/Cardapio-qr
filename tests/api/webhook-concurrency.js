/**
 * Teste de Concorrência e Idempotência do Webhook do Mercado Pago
 * 
 * Simula a chegada de duas notificações idênticas do mesmo pagamento
 * exatamente no mesmo milissegundo (race condition / retentativas de rede).
 */

const fs = require('fs');

// Carrega variáveis de ambiente do .env.local
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
    if (!supabaseKey && line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  });
} catch (e) {
  // Ignora se não existir
}

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/mercadopago/webhook';

async function getTestRestaurantId() {
  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from('restaurants').select('id, name, subscription_expires_at').limit(1).single();
      if (!error && data) {
        return data;
      }
    } catch (err) {
      // Fallback abaixo
    }
  }
  return { id: '733509f7-bb50-415c-8f5a-0a2e647121ce', name: 'Restaurante Teste' };
}

async function runConcurrencyTest() {
  console.log('\n============================================================');
  console.log('🧪 QA TEST: CONCORRÊNCIA E IDEMPOTÊNCIA DO WEBHOOK');
  console.log('============================================================\n');

  const restaurant = await getTestRestaurantId();
  const testPaymentId = `sim_pay_${Date.now()}_concurrency`;

  console.log(`📌 Alvo: ${WEBHOOK_URL}`);
  console.log(`🏪 Restaurante: ${restaurant.name} (ID: ${restaurant.id})`);
  console.log(`💳 ID de Pagamento Simulado: ${testPaymentId}`);
  console.log('⚡ Disparando 2 requests POST idênticos em paralelo (Promise.all)... \n');

  const payload = {
    type: 'payment',
    data: { id: testPaymentId },
    mockPaymentInfo: {
      id: testPaymentId,
      status: 'approved',
      external_reference: restaurant.id,
      transaction_amount: 49.90,
    },
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'MercadoPago Webhook Simulator / QA Suite',
    },
    body: JSON.stringify(payload),
  };

  const startTime = Date.now();

  // Disparo simultâneo no mesmo tick de execução
  const [response1, response2] = await Promise.all([
    fetch(WEBHOOK_URL, requestOptions),
    fetch(WEBHOOK_URL, requestOptions),
  ]);

  const duration = Date.now() - startTime;

  const data1 = await response1.json().catch(() => ({}));
  const data2 = await response2.json().catch(() => ({}));

  console.log('📥 Resposta Request #1:');
  console.log(`   HTTP Status: ${response1.status}`);
  console.log('   Body:', JSON.stringify(data1, null, 2));

  console.log('\n📥 Resposta Request #2:');
  console.log(`   HTTP Status: ${response2.status}`);
  console.log('   Body:', JSON.stringify(data2, null, 2));

  console.log(`\n⏱️ Tempo total da operação: ${duration}ms`);

  // Validação dos critérios de aceitação
  const bothHttp200 = response1.status === 200 && response2.status === 200;
  
  const successCount = [data1, data2].filter(d => d.success === true).length;
  const blockedCount = [data1, data2].filter(d => d.duplicate === true || d.already_processed === true).length;

  console.log('\n============================================================');
  console.log('🔍 ANÁLISE DE SEGURANÇA E IDEMPOTÊNCIA:');
  console.log('============================================================');

  let testPassed = true;

  if (bothHttp200) {
    console.log('✅ [PASS] Ambos os requests responderam HTTP 200 (Gateway do Mercado Pago satisfeito sem retries indevidos)');
  } else {
    console.log('❌ [FAIL] Ao menos um request não respondeu HTTP 200');
    testPassed = false;
  }

  if (successCount === 1) {
    console.log('✅ [PASS] Exatamente UMA notificação processou e estendeu a assinatura');
  } else {
    console.log(`❌ [FAIL] Número inesperado de processamentos bem-sucedidos: ${successCount} (Esperado: 1)`);
    testPassed = false;
  }

  if (blockedCount === 1) {
    const blockedReason = data1.blocked_by || data2.blocked_by || 'mecanismo de idempotência';
    console.log(`✅ [PASS] Exatamente UMA notificação foi bloqueada pela camada de idempotência: [${blockedReason}]`);
  } else {
    console.log(`❌ [FAIL] Número de requisições bloqueadas: ${blockedCount} (Esperado: 1)`);
    testPassed = false;
  }

  console.log('============================================================');
  if (testPassed) {
    console.log('🎉 RESULTADO: O SISTEMA ESTÁ 100% PROTEGIDO CONTRA RACE CONDITIONS!');
    console.log('   Nenhum cliente receberá duplicação de dias por retentativas de rede.');
    process.exit(0);
  } else {
    console.log('💥 RESULTADO: FALHA NO TESTE DE IDEMPOTÊNCIA.');
    process.exit(1);
  }
}

runConcurrencyTest().catch(err => {
  console.error('❌ Erro inesperado ao executar teste de concorrência:', err);
  process.exit(1);
});
