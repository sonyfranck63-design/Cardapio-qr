import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  return createAdminClient(supabaseUrl, supabaseKey)
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const restaurantId = params.id
    if (!restaurantId) {
      return NextResponse.json({ error: 'ID do restaurante não fornecido' }, { status: 400 })
    }

    // Valida autenticação do Super Admin
    const userClient = createServerClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const adminEmails = (process.env.SUPERADMIN_EMAILS || 'sonyfranck63@gmail.com')
      .split(',')
      .map(e => e.trim().toLowerCase())

    const userEmail = user.email?.toLowerCase() || ''
    if (!adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin' }, { status: 403 })
    }

    const body = await req.json()
    const { action, days } = body

    const supabase = getAdminClient()

    // Busca o restaurante atual
    const { data: restaurant, error: findError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single()

    if (findError || !restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    let newStatus = restaurant.subscription_status
    let newExpiresAt = new Date()

    if (action === 'extend_30' || action === 'activate') {
      newStatus = 'active'
      let baseDate = new Date()
      if (restaurant.subscription_expires_at) {
        const currentExp = new Date(restaurant.subscription_expires_at)
        if (currentExp > baseDate) {
          baseDate = currentExp
        }
      }
      baseDate.setDate(baseDate.getDate() + 30)
      newExpiresAt = baseDate
    } else if (action === 'extend_7') {
      newStatus = 'trial'
      let baseDate = new Date()
      if (restaurant.subscription_expires_at) {
        const currentExp = new Date(restaurant.subscription_expires_at)
        if (currentExp > baseDate) {
          baseDate = currentExp
        }
      }
      baseDate.setDate(baseDate.getDate() + 7)
      newExpiresAt = baseDate
    } else if (action === 'suspend') {
      newStatus = 'expired'
      const pastDate = new Date()
      pastDate.setMinutes(pastDate.getMinutes() - 5)
      newExpiresAt = pastDate
    } else if (action === 'custom' && typeof days === 'number') {
      let baseDate = new Date()
      if (restaurant.subscription_expires_at) {
        const currentExp = new Date(restaurant.subscription_expires_at)
        if (currentExp > baseDate) {
          baseDate = currentExp
        }
      }
      baseDate.setDate(baseDate.getDate() + days)
      newExpiresAt = baseDate
      newStatus = 'active'
    } else {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    const updatePayload: any = {
      subscription_status: newStatus,
      subscription_expires_at: newExpiresAt.toISOString(),
    }

    if (action === 'extend_30' || action === 'activate') {
      updatePayload.mercadopago_payment_id = `MANUAL_ADMIN_${Date.now()}`
    }

    // Tenta atualizar usando o adminClient (service_role ou anon)
    let updateResult = await supabase
      .from('restaurants')
      .update(updatePayload)
      .eq('id', restaurantId)

    // Se falhou por RLS e o restaurante pertencer ao próprio admin, tenta com userClient
    if (updateResult.error) {
      updateResult = await userClient
        .from('restaurants')
        .update(updatePayload)
        .eq('id', restaurantId)
    }

    if (updateResult.error) {
      return NextResponse.json({ 
        error: updateResult.error.message || 'Erro ao atualizar assinatura',
        hint: 'Verifique se a SUPABASE_SERVICE_ROLE_KEY está configurada no .env.local ou na Vercel.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Assinatura do restaurante ${restaurant.name} atualizada com sucesso!`,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        subscription_status: newStatus,
        subscription_expires_at: newExpiresAt.toISOString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno do servidor' }, { status: 500 })
  }
}
