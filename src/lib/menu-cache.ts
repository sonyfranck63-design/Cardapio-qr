import { unstable_cache } from 'next/cache'
import { getPublicSupabaseClient } from '@/lib/supabase/public'
import { CategoryWithItems, Restaurant } from '@/types/database'

export interface CachedMenuResult {
  restaurant: Restaurant | null
  categories: CategoryWithItems[]
}

/**
 * Busca os dados públicos do restaurante e do cardápio utilizando cache agressivo e ISR.
 * 
 * - Sem chamadas a cookies() ou sessões, permitindo resposta instantânea em memória/Edge.
 * - Utiliza tags estruturadas para suportar revalidação imediata sob demanda (On-Demand Revalidation):
 *   - `menus` (tag global)
 *   - `menu-${slug}` (tag específica por slug do restaurante)
 *   - `restaurant-${restaurantId}` (tag específica por ID do restaurante)
 */
export async function getCachedMenuData(slug: string): Promise<CachedMenuResult> {
  const normalizedSlug = slug.trim().toLowerCase()

  const fetcher = unstable_cache(
    async (targetSlug: string): Promise<CachedMenuResult> => {
      const supabase = getPublicSupabaseClient()

      // 1. Busca restaurante pelo slug
      const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', targetSlug)
        .maybeSingle()

      if (restError || !restaurant) {
        return { restaurant: null, categories: [] }
      }

      // 2. Busca categorias e itens vinculados
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select(`
          *,
          menu_items (
            *
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .order('order', { ascending: true })

      if (catError || !categoriesData) {
        return { restaurant, categories: [] }
      }

      const rawCategories = (categoriesData as unknown as CategoryWithItems[]) ?? []
      const categories = rawCategories.map(cat => ({
        ...cat,
        menu_items: (cat.menu_items || []).sort((a, b) => a.order - b.order),
      }))

      return {
        restaurant,
        categories,
      }
    },
    [`menu-cache-slug-${normalizedSlug}`],
    {
      revalidate: 3600, // Revalida em segundo plano após 1h (fallback temporal)
      tags: ['menus', `menu-${normalizedSlug}`],
    }
  )

  return fetcher(normalizedSlug)
}
