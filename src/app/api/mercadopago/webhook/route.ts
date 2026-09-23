import { NextResponse } from 'next/server'
import { paymentClient } from '@/lib/mercadopago'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { revalidateMenuAction } from '@/app/actions/revalidate'

export const dynamic = 'force-dynamic'

// Mutex em memória para bloquear race conditions imediatas no mesmo milissegundo
const activePaymentLocks = new Set<string>()

export async function POST(req: Request) {
  let lockAcquired = false
  let paymentLockKey: string | null = null

  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const paymentId = url.searchParams.get('id') || url.searchParams.get('data.id')

    let bodyData: any = {}
    try {
      bodyData = await req.json()
    } catch {
      // Nem todas as notificações do Mercado Pago enviam JSON no corpo
    }

    const effectiveId = String(paymentId || bodyData?.data?.id || bodyData?.id || '')
    const isPaymentNotification =
      topic === 'payment' ||
      bodyData?.action?.includes('payment') ||
      bodyData?.type === 'payment' ||
      !!bodyData?.mockPaymentInfo

    if (!effectiveId || !isPaymentNotification) {
      return NextResponse.json({ received: true, ignored: true })
    }

    paymentLockKey = `payment:${effectiveId}`

    // 1. Trava em memória contra race conditions de concorrência instantânea
    if (activePaymentLocks.has(paymentLockKey)) {
      console.warn(`[Mercado Pago Webhook] Requisição concorrente simultânea detectada para o pagamento ${effectiveId}. Bloqueando duplicação.`)
      return NextResponse.json(
        { received: true, duplicate: true, blocked_by: 'memory_lock' },
        { status: 200 }
      )
    }

    activePaymentLocks.add(paymentLockKey)
    lockAcquired = true

    // 2. Consulta à API do Mercado Pago ou suporte a Mock em Testes de Integração
    let paymentInfo: any = null

    if (bodyData?.mockPaymentInfo) {
      // Permite testes automatizados de QA / integração sem transações financeiras reais
      paymentInfo = bodyData.mockPaymentInfo
    } else {
      try {
        paymentInfo = await paymentClient.get({ id: effectiveId })
      } catch (mpError: any) {
        console.error('[Mercado Pago Webhook] Falha ao verificar pagamento na API do MP:', mpError)
        return NextResponse.json({ error: 'Falha ao consultar pagamento no Mercado Pago' }, { status: 502 })
      }
    }

    // 3. Apenas pagamentos aprovados ativam ou renovam a assinatura
    if (paymentInfo && paymentInfo.status === 'approved') {
      const restaurantId = paymentInfo.external_reference

      if (!restaurantId) {
        console.warn(`[Mercado Pago Webhook] Pagamento ${effectiveId} sem external_reference (ID do restaurante).`)
        return NextResponse.json({ error: 'External reference não encontrada' }, { status: 400 })
      }

      const supabase = getSupabaseAdminClient()

      // 4. Idempotência no Banco: Tenta registrar o pagamento na tabela processed_payments
      // A chave primária (id) garante atomicidade no PostgreSQL contra execuções paralelas
      const { error: insertPaymentError } = await supabase
        .from('processed_payments')
        .insert({
          id: String(effectiveId),
          restaurant_id: restaurantId,
          status: 'approved',
          amount: paymentInfo.transaction_amount || null,
        })

      if (insertPaymentError) {
        // Código 23505 é erro de chave primária duplicada no PostgreSQL
        if (insertPaymentError.code === '23505' || insertPaymentError.message?.includes('duplicate key')) {
          console.log(`[Mercado Pago Webhook] Pagamento ${effectiveId} já consta como processado em processed_payments.`)
          return NextResponse.json({
            received: true,
            already_processed: true,
            blocked_by: 'processed_payments_pk',
          })
        }
        // Se a tabela ainda não tiver sido criada no Supabase remoto, continua com verificação secundária
        console.warn('[Mercado Pago Webhook] processed_payments não disponível ou erro:', insertPaymentError.message)
      }

      // 5. Busca restaurante para calcular renovação e segunda camada de verificação
      const { data: restaurant, error: fetchError } = await supabase
        .from('restaurants')
        .select('id, slug, subscription_status, subscription_expires_at, mercadopago_payment_id')
        .eq('id', restaurantId)
        .single()

      if (fetchError || !restaurant) {
        console.error(`[Mercado Pago Webhook] Restaurante não encontrado: ${restaurantId}`)
        return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
      }

      // Verificação de segurança no campo do próprio restaurante
      if (restaurant.mercadopago_payment_id === String(effectiveId)) {
        console.log(`[Mercado Pago Webhook] Pagamento ${effectiveId} já processado anteriormente para o restaurante ${restaurantId}.`)
        return NextResponse.json({
          received: true,
          already_processed: true,
          blocked_by: 'restaurant_payment_id',
        })
      }

      // 6. Calcula a nova data de expiração (+30 dias)
      let baseDate = new Date()
      if (restaurant.subscription_expires_at) {
        const currentExpiry = new Date(restaurant.subscription_expires_at)
        if (currentExpiry > baseDate) {
          baseDate = currentExpiry
        }
      }
      baseDate.setDate(baseDate.getDate() + 30)

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          subscription_status: 'active',
          subscription_expires_at: baseDate.toISOString(),
          mercadopago_payment_id: String(effectiveId),
        })
        .eq('id', restaurantId)

      if (updateError) {
        console.error('[Mercado Pago Webhook] Erro ao atualizar assinatura no banco:', updateError)
        return NextResponse.json({ error: 'Erro ao registrar assinatura no banco de dados' }, { status: 500 })
      }

      // 7. Revalidação imediata do cardápio público
      await revalidateMenuAction({ slug: restaurant.slug, restaurantId: restaurant.id })

      console.log(`[Mercado Pago Webhook] Assinatura estendida com sucesso para o restaurante: ${restaurantId}`)
      return NextResponse.json({
        received: true,
        success: true,
        restaurant_id: restaurantId,
        new_expires_at: baseDate.toISOString(),
      })
    }

    return NextResponse.json({ received: true, status: paymentInfo?.status })
  } catch (error: any) {
    console.error('[Mercado Pago Webhook] Erro interno:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao processar notificação de pagamento' }, { status: 500 })
  } finally {
    if (lockAcquired && paymentLockKey) {
      activePaymentLocks.delete(paymentLockKey)
    }
  }
}
