import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ItemsManager from '@/components/admin/ItemsManager'
import { UtensilsCrossed } from 'lucide-react'

export const metadata = { title: 'Itens do Cardápio' }

export default async function ItemsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!restaurant) redirect('/auth/register')

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('order', { ascending: true }),
    supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-500/15 rounded-xl flex items-center justify-center">
          <UtensilsCrossed className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Itens do Cardápio</h1>
          <p className="text-sm text-gray-400">Gerencie pratos, bebidas e tudo mais</p>
        </div>
      </div>

      {(categories?.length ?? 0) === 0 ? (
        <div className="admin-card p-8 text-center">
          <p className="text-gray-400 mb-2">Você precisa criar pelo menos uma categoria antes de adicionar itens.</p>
          <a href="/admin/categories" className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
            Criar categoria →
          </a>
        </div>
      ) : (
        <ItemsManager
          restaurantId={restaurant.id}
          restaurantSlug={restaurant.slug}
          categories={categories ?? []}
          initialItems={items ?? []}
        />
      )}
    </div>
  )
}
