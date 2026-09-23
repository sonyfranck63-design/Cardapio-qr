import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
  if (!restaurant) {
    const rawName = user.user_metadata?.restaurant_name || 'Meu Restaurante'
    const cleanSlug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'restaurante'
    const finalSlug = `${cleanSlug}-${user.id.slice(0, 6)}`
    
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: createdRest } = await supabase
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

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <AdminSidebar restaurant={restaurant} />
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
