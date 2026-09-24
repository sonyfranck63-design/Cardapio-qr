import { notFound } from 'next/navigation'
import { getCachedMenuData } from '@/lib/menu-cache'
import MenuHeader from '@/components/public/MenuHeader'
import CategorySection from '@/components/public/CategorySection'
import CategoryNav from '@/components/public/CategoryNav'
import WhatsAppButton from '@/components/public/WhatsAppButton'
import { getThemeFontClass } from '@/lib/theme'
import { UtensilsCrossed, AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'

interface MenuPageProps {
  params: { slug: string }
}

/**
 * Geração de Metadata dinâmica para SEO e compartilhamento social:
 * Reutiliza os dados cacheados via `getCachedMenuData`, evitando queries adicionais.
 */
export async function generateMetadata({ params }: MenuPageProps): Promise<Metadata> {
  const { restaurant } = await getCachedMenuData(params.slug)

  if (!restaurant) {
    return { title: 'Cardápio não encontrado' }
  }

  const title = `${restaurant.name} — Cardápio Digital`
  const description = restaurant.tagline || `Consulte os pratos, bebidas e preços atualizados de ${restaurant.name}.`
  const previewImage = restaurant.cover_url || restaurant.logo_url

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: previewImage ? [{ url: previewImage }] : [],
    },
    twitter: {
      card: previewImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: previewImage ? [previewImage] : [],
    },
  }
}

/**
 * Página pública do Cardápio:
 * Renderização estática com ISR (Incremental Static Regeneration) e cache agressivo em memória.
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
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 stroke-[1.75]" />
        </div>
        <h1 className="text-2xl font-bold mb-2 tracking-tight">{restaurant.name}</h1>
        <p className="text-stone-400 max-w-sm mb-6 text-sm">
          Este cardápio digital está temporariamente indisponível no momento.
        </p>
        <p className="text-xs text-stone-500">
          CardápioQR • Se você é o proprietário, acesse seu painel para regularizar.
        </p>
      </div>
    )
  }

  const showSoldOut = restaurant.show_sold_out ?? false

  // Filtra categorias visíveis
  const visibleCategories = categories.filter(cat =>
    cat.menu_items && (showSoldOut ? cat.menu_items.length > 0 : cat.menu_items.some(item => item.is_active))
  )

  const hasWhatsApp = Boolean(restaurant.whatsapp)
  const fontClass = getThemeFontClass(restaurant.theme_font)

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 ${fontClass}`}>
      {/* SEO: Schema.org para restaurante */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Restaurant',
            name: restaurant.name,
            address: restaurant.address || undefined,
            hasMenu: {
              '@type': 'Menu',
              name: `Cardápio ${restaurant.name}`,
            },
          }),
        }}
      />

      <MenuHeader restaurant={restaurant} />

      {/* Navegação horizontal de categorias */}
      <CategoryNav categories={visibleCategories} />

      {/* Conteúdo do Cardápio */}
      <main className="max-w-xl mx-auto pt-6 pb-28">
        {visibleCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-4 text-stone-400 border border-stone-200">
              <UtensilsCrossed className="w-8 h-8 stroke-[1.5]" />
            </div>
            <p className="text-stone-800 font-semibold text-lg">Cardápio em preparação</p>
            <p className="text-stone-500 text-sm mt-1 max-w-xs">
              Novos pratos estão sendo adicionados em breve.
            </p>
          </div>
        ) : (
          visibleCategories.map(cat => (
            <CategorySection
              key={cat.id}
              category={cat}
              showSoldOut={showSoldOut}
              whatsappNumber={restaurant.whatsapp}
            />
          ))
        )}
      </main>

      {/* Botão de WhatsApp Flutuante Acessível */}
      {hasWhatsApp && (
        <WhatsAppButton
          whatsapp={restaurant.whatsapp!}
          message={restaurant.whatsapp_message ?? 'Olá! Gostaria de fazer um pedido.'}
        />
      )}

      {/* Rodapé discreto */}
      <footer className={`text-center text-xs text-stone-400 py-4 ${hasWhatsApp ? 'pb-24' : 'pb-8'}`}>
        Powered by <span className="font-semibold text-stone-600">CardápioQR</span>
      </footer>
    </div>
  )
}

/**
 * Revalidação temporal de fallback para ISR (em segundos).
 */
export const revalidate = 10
