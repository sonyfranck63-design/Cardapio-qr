import { NextResponse } from 'next/server'
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago'
import { paymentClient } from '@/lib/mercadopago'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { revalidateMenuAction } from '@/app/actions/revalidate'
import { PLAN_PRICE } from '@/lib/plans'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

    const effectiveId = String(paymentId || bodyData?.data?.id || bodyData?.id || '')
    const isPaymentNotification =
      topic === 'payment' ||
      bodyData?.action?.includes('payment') ||
      bodyData?.type === 'payment'

    if (!effectiveId || !isPaymentNotification) {
      return NextResponse.json({ received: true, ignored: true }, { status: 200 })
    }

    // 1. Validação Criptográfica de Assinatura do Webhook (x-signature / x-request-id)
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    const isProduction = process.env.NODE_ENV === 'production'

    if (!secret) {
      console.error('[Mercado Pago Webhook] MERCADOPAGO_WEBHOOK_SECRET não configurado.')
      if (isProduction) {
        return NextResponse.json(
          { error: 'Configuração de webhook incompleta no servidor' },
          { status: 500 }
        )
      }
    } else {
      const xSignature = req.headers.get('x-signature')
      const xRequestId = req.headers.get('x-request-id')

      try {
        WebhookSignatureValidator.validate({
          xSignature: xSignature || undefined,
          xRequestId: xRequestId || undefined,
          dataId: effectiveId,
          secret,
        })
      } catch (validationError) {
        if (validationError instanceof InvalidWebhookSignatureError) {
          console.warn(`[Mercado Pago Webhook] Assinatura inválida para pagamento ${effectiveId}: ${validationError.reason}`)
          return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
        }
        console.error('[Mercado Pago Webhook] Erro ao validar assinatura:', validationError)
        return NextResponse.json({ error: 'Falha na validação de assinatura' }, { status: 401 })
      }
    }

    // 2. Consulta à API Oficial do Mercado Pago
    let paymentInfo: any = null
    try {
      paymentInfo = await paymentClient.get({ id: effectiveId })
    } catch (mpError: any) {
      console.error('[Mercado Pago Webhook] Falha ao consultar pagamento no Mercado Pago:', mpError)
      return NextResponse.json({ error: 'Falha ao consultar pagamento no gateway' }, { status: 502 })
    }

    // 3. Validações de integridade do pagamento
    if (paymentInfo && paymentInfo.status === 'approved') {
      const restaurantId = paymentInfo.external_reference
      const transactionAmount = Number(paymentInfo.transaction_amount)

      // Valida se external_reference é um UUID válido
      if (!restaurantId || !UUID_REGEX.test(restaurantId)) {
        console.warn(`[Mercado Pago Webhook] Pagamento ${effectiveId} possui external_reference inválida: ${restaurantId}`)
        return NextResponse.json({ error: 'ID de restaurante inválido' }, { status: 400 })
      }

      // Valida se o valor pago confere com o plano (com tolerância a arredondamento de centavos)
      if (isNaN(transactionAmount) || Math.abs(transactionAmount - PLAN_PRICE) > 0.05) {
        console.warn(`[Mercado Pago Webhook] Valor divergente para pagamento ${effectiveId}: recebido ${transactionAmount}, esperado ${PLAN_PRICE}`)
        return NextResponse.json({ error: 'Valor da transação divergente' }, { status: 400 })
      }

      const supabase = getSupabaseAdminClient()

      // 4. Execução Atômica e Idempotente via RPC no PostgreSQL
      const { data: rpcResult, error: rpcError } = await supabase.rpc('apply_payment', {
        p_payment_id: String(effectiveId),
        p_restaurant_id: restaurantId,
        p_amount: transactionAmount,
      })

      if (rpcError) {
        console.error(`[Mercado Pago Webhook] Erro ao executar apply_payment para ${effectiveId}:`, rpcError)
        return NextResponse.json({ error: 'Erro ao processar pagamento no banco de dados' }, { status: 500 })
      }

      // Se já havia sido processado, retorna 200 idempotente
      if (rpcResult?.already_processed) {
        console.log(`[Mercado Pago Webhook] Pagamento ${effectiveId} já processado anteriormente.`)
        return NextResponse.json({
          received: true,
          already_processed: true,
        }, { status: 200 })
      }

      // 5. Revalidação do cardápio público sob demanda
      await revalidateMenuAction({ restaurantId })

      console.log(`[Mercado Pago Webhook] Assinatura estendida com sucesso para o restaurante: ${restaurantId}`)
      return NextResponse.json({
        received: true,
        success: true,
        restaurant_id: restaurantId,
        new_expires_at: rpcResult?.new_expires_at,
      }, { status: 200 })
    }

    return NextResponse.json({ received: true, status: paymentInfo?.status }, { status: 200 })
  } catch (error: any) {
    console.error('[Mercado Pago Webhook] Erro interno:', error?.message || error)
    return NextResponse.json({ error: 'Erro ao processar notificação de pagamento' }, { status: 500 })
  }
}
