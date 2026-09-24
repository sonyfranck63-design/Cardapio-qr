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
      .order('order', { ascending: true }),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center">
          <UtensilsCrossed className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Itens do Cardápio</h1>
          <p className="text-sm text-stone-500">Gerencie pratos, bebidas e porções</p>
        </div>
      </div>

      {(categories?.length ?? 0) === 0 ? (
        <div className="admin-card p-8 text-center bg-white border border-stone-200 rounded-2xl shadow-sm">
          <p className="text-stone-600 mb-3 font-medium">Você precisa criar pelo menos uma categoria antes de adicionar itens.</p>
          <a href="/admin/categories" className="btn-primary inline-flex text-xs font-semibold px-4 py-2">
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
