import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paymentClient } from '@/lib/mercadopago'

// Cliente Supabase com permissão para atualizar restaurantes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const paymentId = url.searchParams.get('id') || url.searchParams.get('data.id')

    let bodyData: any = {}
    try {
      bodyData = await req.json()
    } catch {
      // Nem todo webhook envia json no body
    }

    const effectiveId = paymentId || bodyData?.data?.id

    if (effectiveId && (topic === 'payment' || bodyData?.action?.includes('payment'))) {
      // Consulta o pagamento na API do Mercado Pago
      let paymentInfo: any = null
      try {
        paymentInfo = await paymentClient.get({ id: effectiveId })
      } catch (e) {
        console.error('Erro ao consultar pagamento no Mercado Pago:', e)
      }

      if (paymentInfo && paymentInfo.status === 'approved') {
        const restaurantId = paymentInfo.external_reference

        if (restaurantId) {
          // Busca o restaurante atual para calcular os novos 30 dias
          const { data: restaurant } = await supabase
            .from('restaurants')
            .select('subscription_expires_at')
            .eq('id', restaurantId)
            .single()

          let baseDate = new Date()
          if (restaurant?.subscription_expires_at) {
            const currentExpiry = new Date(restaurant.subscription_expires_at)
            if (currentExpiry > baseDate) {
              baseDate = currentExpiry
            }
          }

          // Adiciona 30 dias de assinatura
          baseDate.setDate(baseDate.getDate() + 30)

          await supabase
            .from('restaurants')
            .update({
              subscription_status: 'active',
              subscription_expires_at: baseDate.toISOString(),
              mercadopago_payment_id: String(effectiveId),
            })
            .eq('id', restaurantId)

          console.log(`[Mercado Pago] Assinatura renovada com sucesso para restaurante: ${restaurantId}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Erro no webhook do Mercado Pago:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
