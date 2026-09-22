import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    let baseDate = new Date()
    if (restaurant.subscription_expires_at) {
      const currentExpiry = new Date(restaurant.subscription_expires_at)
      if (currentExpiry > baseDate) {
        baseDate = currentExpiry
      }
    }

    // Adiciona 30 dias
    baseDate.setDate(baseDate.getDate() + 30)

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({
        subscription_status: 'active',
        subscription_expires_at: baseDate.toISOString(),
        mercadopago_payment_id: `SIMULATED_${Date.now()}`,
      })
      .eq('id', restaurant.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Mensalidade renovada por +30 dias com sucesso (Modo Simulação)!',
      new_expiry: baseDate.toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
