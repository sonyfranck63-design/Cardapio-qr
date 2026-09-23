import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { preferenceClient } from '@/lib/mercadopago'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const hasToken = process.env.MERCADOPAGO_ACCESS_TOKEN && !process.env.MERCADOPAGO_ACCESS_TOKEN.startsWith('TEST-00000000')

    if (!hasToken) {
      return NextResponse.json(
        { error: 'O gateway de pagamento está temporariamente indisponível. Entre em contato com o suporte.' },
        { status: 503 }
      )
    }

    // Monta o corpo da preferência de pagamento no Mercado Pago
    const isHttps = appUrl.startsWith('https://')

    const body: any = {
      items: [
        {
          id: 'plano-mensal-cardapioqr',
          title: `Assinatura Mensal CardápioQR - ${restaurant.name}`,
          description: 'Acesso mensal completo ao Cardápio Digital QR Code',
          quantity: 1,
          unit_price: 49.90,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: user.email,
      },
      external_reference: restaurant.id,
      back_urls: {
        success: `${appUrl}/admin/subscription?payment=success`,
        pending: `${appUrl}/admin/subscription?payment=pending`,
        failure: `${appUrl}/admin/subscription?payment=failure`,
      },
    }

    // Mercado Pago exige HTTPS para auto_return e webhook público
    if (isHttps) {
      body.auto_return = 'approved'
      body.notification_url = `${appUrl}/api/mercadopago/webhook`
    }

    const preference = await preferenceClient.create({ body })

    const checkoutUrl = preference.init_point || preference.sandbox_init_point

    return NextResponse.json({ url: checkoutUrl })
  } catch (error: any) {
    console.error('Erro ao gerar checkout Mercado Pago:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}
