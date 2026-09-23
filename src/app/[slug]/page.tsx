import { notFound } from 'next/navigation'
import { getCachedMenuData } from '@/lib/menu-cache'
import { CategoryWithItems } from '@/types/database'
import MenuHeader from '@/components/public/MenuHeader'
import CategorySection from '@/components/public/CategorySection'
import CategoryNav from '@/components/public/CategoryNav'
import WhatsAppButton from '@/components/public/WhatsAppButton'
import type { Metadata } from 'next'

interface MenuPageProps {
  params: { slug: string }
}

/**
 * Geração de Metadata otimizada:
 * Reutiliza os dados cacheados via `getCachedMenuData`, evitando queries duplicadas ao Supabase.
 */
export async function generateMetadata({ params }: MenuPageProps): Promise<Metadata> {
  const { restaurant } = await getCachedMenuData(params.slug)

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

/**
 * Página pública do Cardápio:
 * Renderização estática com ISR (Incremental Static Regeneration) e cache agressivo em memória.
 * Não consome cookies ou sessões de usuário, permitindo suporte a milhares de clientes simultâneos
 * com zero consultas repetidas ao banco de dados PostgreSQL.
 */
export default async function MenuPage({ params }: MenuPageProps) {
  const { restaurant, categories } = await getCachedMenuData(params.slug)

  if (!restaurant) {
    notFound()
  }

  // Verifica se a assinatura do restaurante está ativa
  const isExpired = restaurant.subscription_expires_at
    ? new Date(restaurant.subscription_expires_at).getTime() < Date.now()
    : false
  const isSuspended =
    restaurant.subscription_status === 'past_due' ||
    restaurant.subscription_status === 'canceled' ||
    restaurant.subscription_status === 'expired' ||
    isExpired

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">{restaurant.name}</h1>
        <p className="text-gray-400 max-w-sm mb-6 text-sm">
          Este cardápio digital está temporariamente indisponível no momento.
        </p>
        <p className="text-xs text-gray-600">
          CardápioQR • Se você é o proprietário, acesse seu painel para regularizar.
        </p>
      </div>
    )
  }

  // Filtra categorias que têm pelo menos um item ativo
  const categoriesWithActiveItems = categories.filter(cat =>
    cat.menu_items && cat.menu_items.some(item => item.is_active)
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

      {/* Category sticky nav com IntersectionObserver */}
      <CategoryNav categories={categoriesWithActiveItems} />

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

/**
 * Revalidação temporal de fallback para ISR (em segundos).
 * A página é atualizada instantaneamente sob demanda através de On-Demand Revalidation.
 */
export const revalidate = 3600
