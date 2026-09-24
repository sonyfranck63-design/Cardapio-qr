import MenuHeader from '@/components/public/MenuHeader'
import CategorySection from '@/components/public/CategorySection'
import WhatsAppButton from '@/components/public/WhatsAppButton'
import { CategoryWithItems, PublicRestaurant } from '@/types/database'
import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'
import { getThemeFontClass } from '@/lib/theme'

// Restaurante de demonstração com atributos completos
const mockRestaurant: PublicRestaurant = {
  id: 'demo-restaurant-1',
  name: 'Bistrô & Hamburgueria do Chefe',
  slug: 'bar-do-chefe',
  logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
  cover_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
  tagline: 'Cozinha artesanal com ingredientes frescos e cortes selecionados',
  address: 'Rua dos Pinheiros, 450 — Pinheiros, São Paulo',
  opening_hours: 'Ter a Dom: 12h às 23h30',
  instagram: 'bardo_chefe',
  theme_color: '#1c1917',
  theme_font: 'moderno',
  show_sold_out: true,
  whatsapp: '5511999998888',
  whatsapp_message: 'Olá! Gostaria de fazer um pedido pelo cardápio digital.',
  subscription_status: 'active',
  subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
}

// Categorias com pratos com fotos apetitosas e pratos em estilo cardápio clássico pontilhado
const mockCategories: CategoryWithItems[] = [
  {
    id: 'cat-1',
    restaurant_id: 'demo-restaurant-1',
    name: 'Hambúrgueres Artesanais',
    order: 1,
    created_at: new Date().toISOString(),
    menu_items: [
      {
        id: 'item-1',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-1',
        name: 'Chefe Bacon Burger Especial',
        description: 'Pão brioche selado na manteiga da terra, burger 180g de costela, queijo cheddar inglês derretido, fatias crocantes de bacon artesanal e maionese defumada da casa.',
        price: 38.90,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
        is_active: true,
        order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-2',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-1',
        name: 'Duplo Smash Burger',
        description: 'Dois discos de 90g ultra prensados com crosta caramelizada, dobro de queijo prato, cebola roxa chapeada e molho secreto no pão de batata.',
        price: 34.50,
        image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&auto=format&fit=crop&q=80',
        is_active: true,
        order: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-3',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-1',
        name: 'Smoked Truffle Burger',
        description: 'Burger 200g angus, queijo gouda, cogumelos salteados no azeite trufado e aioli de alho negro. Edição limitada.',
        price: 46.00,
        image_url: null, // Sem foto intencional para exibir o estilo pontilhado clássico de bistrô
        is_active: false, // Esgotado de demonstração
        order: 3,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'cat-2',
    restaurant_id: 'demo-restaurant-1',
    name: 'Entradas & Petiscos',
    order: 2,
    created_at: new Date().toISOString(),
    menu_items: [
      {
        id: 'item-4',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-2',
        name: 'Batata Rústica com Alecrim e Parmesão',
        description: '450g de batatas selecionadas fritas em imersão dupla com ramos de alecrim fresco, flor de sal e chuva de queijo parmesão maturado.',
        price: 32.00,
        image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80',
        is_active: true,
        order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-5',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-2',
        name: 'Dadinhos de Queijo Coalho com Melaço',
        description: '10 unidades crocantes de tapioca e queijo coalho artesanal, servidos com melaço de cana infusionado com gengibre.',
        price: 29.00,
        image_url: null, // Linha pontilhada clássica
        is_active: true,
        order: 2,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'cat-3',
    restaurant_id: 'demo-restaurant-1',
    name: 'Bebidas & Coquetelaria',
    order: 3,
    created_at: new Date().toISOString(),
    menu_items: [
      {
        id: 'item-6',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-3',
        name: 'Chopp Artesanal IPA (400ml)',
        description: 'Cerveja puro malte com lúpulos americanos, notas florais e amargor limpo e equilibrado.',
        price: 18.00,
        image_url: 'https://images.unsplash.com/photo-1608270119337-14e3b7bca06f?w=400&auto=format&fit=crop&q=80',
        is_active: true,
        order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-7',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-3',
        name: 'Gin Tônica com Frutas Vermelhas e Hibisco',
        description: 'Gin premium nacional, água tônica artesanal, infusão de flores de hibisco e zimbro.',
        price: 28.00,
        image_url: null,
        is_active: true,
        order: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-8',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-3',
        name: 'Refrigerante Orgânico ou Água Mineral',
        description: 'Lata 350ml / Garrafa 500ml com ou sem gás.',
        price: 7.50,
        image_url: null,
        is_active: true,
        order: 3,
        created_at: new Date().toISOString(),
      },
    ],
  },
]

export const metadata = {
  title: 'Demonstração do Cardápio Digital — CardápioQR',
  description: 'Confira a experiência real de navegação do cardápio digital no smartphone.',
}

export default function DemoMenuPage() {
  const fontClass = getThemeFontClass(mockRestaurant.theme_font)

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 pb-24 ${fontClass}`}>
      {/* Barra Informativa Superior */}
      <div className="bg-stone-900 text-stone-200 px-4 py-2 text-xs font-medium flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span>Cardápio de Demonstração Interativo</span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-stone-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao site
        </Link>
      </div>

      {/* Header do Cardápio com Capa e Identidade */}
      <MenuHeader restaurant={mockRestaurant} />

      {/* Navegação Rápida entre Categorias */}
      <nav className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80 shadow-sm">
        <div className="max-w-xl mx-auto px-4 flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-thin">
          {mockCategories.map(cat => (
            <a
              key={cat.id}
              href={`#cat-${cat.id}`}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-stone-200/70 text-stone-800 hover:bg-stone-900 hover:text-white transition-colors"
            >
              {cat.name}
            </a>
          ))}
        </div>
      </nav>

      {/* Conteúdo do Cardápio */}
      <main className="max-w-xl mx-auto pt-6">
        {mockCategories.map(category => (
          <CategorySection
            key={category.id}
            category={category}
            showSoldOut={mockRestaurant.show_sold_out}
            whatsappNumber={mockRestaurant.whatsapp}
          />
        ))}
      </main>

      {/* Botão de WhatsApp */}
      <WhatsAppButton
        whatsapp={mockRestaurant.whatsapp}
        message={mockRestaurant.whatsapp_message}
      />
    </div>
  )
}
