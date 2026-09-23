import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paymentClient } from '@/lib/mercadopago'

export const dynamic = 'force-dynamic'

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Chave de administração (SUPABASE_SERVICE_ROLE_KEY) não configurada no servidor.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(req: Request) {
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

    const effectiveId = paymentId || bodyData?.data?.id
    const isPaymentNotification =
      topic === 'payment' ||
      bodyData?.action?.includes('payment') ||
      bodyData?.type === 'payment'

    if (effectiveId && isPaymentNotification) {
      // 1. Consulta obrigatória e direta à API do Mercado Pago via SDK seguro do servidor
      let paymentInfo: any = null
      try {
        paymentInfo = await paymentClient.get({ id: effectiveId })
      } catch (mpError) {
        console.error('[Mercado Pago Webhook] Falha ao verificar pagamento na API do MP:', mpError)
        return NextResponse.json({ error: 'Falha ao consultar pagamento no Mercado Pago' }, { status: 502 })
      }

      // 2. Apenas pagamentos com status 'approved' ativam/renovam a assinatura
      if (paymentInfo && paymentInfo.status === 'approved') {
        const restaurantId = paymentInfo.external_reference

        if (restaurantId) {
          const supabase = getSupabaseAdminClient()

          // 3. Busca restaurante para garantir existência e verificar idempotência
          const { data: restaurant, error: fetchError } = await supabase
            .from('restaurants')
            .select('id, subscription_status, subscription_expires_at, mercadopago_payment_id')
            .eq('id', restaurantId)
            .single()

          if (fetchError || !restaurant) {
            console.error(`[Mercado Pago Webhook] Restaurante não encontrado: ${restaurantId}`)
            return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
          }

          // Idempotência: impede reprocessamento do mesmo ID de pagamento
          if (restaurant.mercadopago_payment_id === String(effectiveId)) {
            console.log(`[Mercado Pago Webhook] Pagamento ${effectiveId} já processado anteriormente para o restaurante ${restaurantId}.`)
            return NextResponse.json({ received: true, already_processed: true })
          }

          // 4. Calcula data de expiração (estende 30 dias a partir do vencimento atual se ainda vigente)
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

          console.log(`[Mercado Pago Webhook] Assinatura ativada com sucesso para restaurante: ${restaurantId}`)
        }
      } else {
        console.log(`[Mercado Pago Webhook] Pagamento ${effectiveId} com status não aprovado (${paymentInfo?.status}). Nenhuma assinatura alterada.`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Mercado Pago Webhook] Erro interno:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao processar notificação de pagamento' }, { status: 500 })
  }
}

