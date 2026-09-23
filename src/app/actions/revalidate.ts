'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { getPublicSupabaseClient } from '@/lib/supabase/public'

/**
 * Server Action para revalidar o cache do cardápio sob demanda.
 * Executa revalidação atômica de rotas e tags de cache do Next.js.
 */
export async function revalidateMenuAction({
  slug,
  restaurantId,
}: {
  slug?: string | null
  restaurantId?: string | null
}) {
  try {
    let targetSlug = slug

    // Se tivermos o ID do restaurante mas não o slug, buscamos rapidamente o slug correspondente
    if (!targetSlug && restaurantId) {
      const supabase = getPublicSupabaseClient()
      const { data } = await supabase
        .from('restaurants')
        .select('slug')
        .eq('id', restaurantId)
        .maybeSingle()

      if (data?.slug) {
        targetSlug = data.slug
      }
    }

    if (targetSlug) {
      const normalizedSlug = targetSlug.trim().toLowerCase()
      revalidateTag(`menu-${normalizedSlug}`)
      revalidatePath(`/${normalizedSlug}`)
    }

    if (restaurantId) {
      revalidateTag(`restaurant-${restaurantId}`)
    }

    revalidateTag('menus')

    return { success: true, revalidatedAt: new Date().toISOString(), slug: targetSlug }
  } catch (error: any) {
    console.error('[Revalidate Action] Falha ao revalidar cache:', error)
    return { success: false, error: error?.message || 'Erro ao revalidar' }
  }
}
