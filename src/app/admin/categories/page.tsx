import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CategoriesManager from '@/components/admin/CategoriesManager'
import { Tag } from 'lucide-react'

export const metadata = { title: 'Categorias' }

export default async function CategoriesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!restaurant) redirect('/auth/register')

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('order', { ascending: true })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-500/15 rounded-xl flex items-center justify-center">
          <Tag className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Categorias</h1>
          <p className="text-sm text-gray-400">Organize os itens do seu cardápio em categorias</p>
        </div>
      </div>

      <CategoriesManager
        restaurantId={restaurant.id}
        initialCategories={categories ?? []}
      />
    </div>
  )
}
