import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CategoryWithItems } from '@/types/database'
import MenuHeader from '@/components/public/MenuHeader'
import CategorySection from '@/components/public/CategorySection'
import WhatsAppButton from '@/components/public/WhatsAppButton'
import type { Metadata } from 'next'

interface MenuPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: MenuPageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!restaurant) {
    return { title: 'Cardápio não encontrado' }
  }

  return {
    title: `${restaurant.name} — Cardápio Digital`,
    description: `Veja o cardápio completo de ${restaurant.name}. Consulte pratos, bebidas e preços.`,
    openGraph: {
      title: `${restaurant.name} — Cardápio Digital`,
      description: `Cardápio digital de ${restaurant.name}`,
    },
  }
}

export default async function MenuPage({ params }: MenuPageProps) {
  const supabase = createClient()

  // Busca o restaurante pelo slug
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (restaurantError || !restaurant) {
    notFound()
  }

  // Busca categorias com seus itens ATIVOS
  const { data: categoriesData } = await supabase
    .from('categories')
    .select(`
      *,
      menu_items (
        *
      )
    `)
    .eq('restaurant_id', restaurant.id)
    .order('order', { ascending: true })

  const categories = (categoriesData ?? []) as CategoryWithItems[]

  // Filtra categorias que têm pelo menos um item ativo
  const categoriesWithActiveItems = categories.filter(cat =>
    cat.menu_items.some(item => item.is_active)
  )

  const hasWhatsApp = !!restaurant.whatsapp

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO: Schema.org para restaurante */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Restaurant',
            name: restaurant.name,
            hasMenu: {
              '@type': 'Menu',
              name: `Cardápio ${restaurant.name}`,
            },
          }),
        }}
      />

      <MenuHeader restaurant={restaurant} />

      {/* Category sticky nav */}
      {categoriesWithActiveItems.length > 1 && (
        <nav className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-lg mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-thin">
              {categoriesWithActiveItems.map(cat => (
                <a
                  key={cat.id}
                  href={`#cat-${cat.id}`}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium
                             bg-gray-100 text-gray-700 hover:bg-orange-500 hover:text-white
                             transition-all duration-200 whitespace-nowrap"
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Menu content */}
      <main className="max-w-lg mx-auto pt-6 pb-28">
        {categoriesWithActiveItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">🍽️</span>
            </div>
            <p className="text-gray-600 font-medium text-lg">Cardápio em breve</p>
            <p className="text-gray-400 text-sm mt-1">Estamos preparando nosso cardápio. Volte em breve!</p>
          </div>
        ) : (
          categoriesWithActiveItems.map(cat => (
            <CategorySection key={cat.id} category={cat} />
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 pointer-events-none">
        <div className="max-w-lg mx-auto px-4 pb-5 flex flex-col items-center gap-3">
          {hasWhatsApp && (
            <div className="pointer-events-auto w-full">
              <WhatsAppButton
                whatsapp={restaurant.whatsapp!}
                message={restaurant.whatsapp_message ?? 'Olá! Gostaria de fazer um pedido.'}
              />
            </div>
          )}
        </div>
      </footer>

      {/* Powered by watermark */}
      <div className={`text-center text-xs text-gray-400 py-3 ${hasWhatsApp ? 'pb-28' : 'pb-6'}`}>
        Powered by <span className="font-semibold text-orange-400">CardápioQR</span>
      </div>
    </div>
  )
}

export const revalidate = 60 // Revalida a cada 60 segundos
