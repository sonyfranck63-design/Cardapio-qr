import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const admin = getSupabaseAdminClient()

    // 1. Localiza o restaurante do usuário autenticado
    const { data: restaurant } = await admin
      .from('restaurants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (restaurant) {
      // 2. Remove produtos, categorias e restaurante do banco
      await admin.from('menu_items').delete().eq('restaurant_id', restaurant.id)
      await admin.from('categories').delete().eq('restaurant_id', restaurant.id)
      await admin.from('restaurants').delete().eq('id', restaurant.id)
    }

    // 3. Exclui o usuário permanentemente de auth.users
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id)

    if (deleteUserError) {
      console.error('[Delete Account] Erro ao excluir usuário do auth:', deleteUserError)
      return NextResponse.json(
        { error: deleteUserError.message || 'Erro ao excluir usuário da autenticação' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Conta excluída com sucesso' })
  } catch (err: any) {
    console.error('[Delete Account] Erro inesperado:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro interno ao processar exclusão' },
      { status: 500 }
    )
  }
}
