import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import AdminSidebar from '@/components/admin/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Busca dados do restaurante vinculado ao usuário
  let { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Caso haja leve latência na execução do trigger do banco, efetua retry
  if (!restaurant) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    const { data: retried } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    restaurant = retried
  }

  // Contingência segura apenas se o banco não possuir o trigger handle_new_user ativo
  // Usa getSupabaseAdminClient() porque o INSERT direto pelo usuário autenticado foi revogado por segurança
  if (!restaurant) {
    const rawName = user.user_metadata?.restaurant_name || 'Meu Restaurante'
    const cleanSlug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'restaurante'
    const finalSlug = `${cleanSlug}-${user.id.slice(0, 6)}`
    
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const adminSupabase = getSupabaseAdminClient()
    const { data: createdRest } = await adminSupabase
      .from('restaurants')
      .insert({
        user_id: user.id,
        name: rawName,
        slug: finalSlug,
        subscription_status: 'trial',
        subscription_plan: 'mensal',
        subscription_expires_at: expiresAt.toISOString(),
      })
      .select('*')
      .maybeSingle()

    restaurant = createdRest || null
  }

  if (!restaurant) {
    redirect('/auth/login')
  }

  const isEmailPending = restaurant.subscription_status === 'pending_verification' || !user.email_confirmed_at

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex font-sans selection:bg-orange-100 selection:text-orange-950">
      <AdminSidebar restaurant={restaurant} />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {isEmailPending && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-3 text-amber-950 text-xs sm:text-sm flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>
              <strong>Confirmação de e-mail necessária:</strong> Enviamos um link para <strong>{user.email}</strong>. Confirme seu e-mail para desbloquear seus 7 dias gratuitos de degustação.
            </span>
          </div>
        )}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
