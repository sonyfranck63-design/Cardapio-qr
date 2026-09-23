import MenuHeader from '@/components/public/MenuHeader'
import CategorySection from '@/components/public/CategorySection'
import WhatsAppButton from '@/components/public/WhatsAppButton'
import { CategoryWithItems, Restaurant } from '@/types/database'
import Link from 'next/link'
import { ArrowLeft, Sparkles, QrCode } from 'lucide-react'

// Dados de demonstração completos para visualização imediata
const mockRestaurant: Restaurant = {
  id: 'demo-restaurant-1',
  user_id: 'demo-user-1',
  name: 'Bar & Hamburgueria do Chefe',
  slug: 'bar-do-chefe',
  logo_url: '/demo/logo.svg',
  whatsapp: '5511999998888',
  whatsapp_message: 'Olá! Gostaria de fazer um pedido pelo cardápio digital.',
  created_at: new Date().toISOString(),
  subscription_status: 'active',
  subscription_plan: 'mensal',
  subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  mercadopago_payment_id: null,
}

const mockCategories: CategoryWithItems[] = [
  {
    id: 'cat-1',
    restaurant_id: 'demo-restaurant-1',
    name: '🍔 Hambúrgueres Artesanais',
    order: 1,
    created_at: new Date().toISOString(),
    menu_items: [
      {
        id: 'item-1',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-1',
        name: 'Chefe Bacon Burger Especial',
        description: 'Pão brioche selado na manteiga, burger artesanal 180g de costela, queijo cheddar derretido, fatias crocantes de bacon e maionese defumada.',
        price: 36.90,
        image_url: '/demo/burger.svg',
        is_active: true,
        order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-2',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-1',
        name: 'Duplo Smash Cheddar',
        description: '2x burgers smash de 90g com crostinha perfeita, dobro de cheddar inglês, cebola caramelizada e molho especial no pão australiano.',
        price: 34.50,
        image_url: '/demo/burger.svg',
        is_active: true,
        order: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-3',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-1',
        name: 'Chicken Crispy Barbecue',
        description: 'Sobrecoxa empanada super crocante, queijo muçarela, alface americana fresca, picles artesanal e barbecue.',
        price: 29.90,
        image_url: '/demo/burger.svg',
        is_active: true,
        order: 3,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'cat-2',
    restaurant_id: 'demo-restaurant-1',
    name: '🍟 Porções & Petiscos',
    order: 2,
    created_at: new Date().toISOString(),
    menu_items: [
      {
        id: 'item-4',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-2',
        name: 'Batata Rústica com Cheddar e Bacon',
        description: '500g de batatas cortadas à mão com alecrim e alho, cobertas com blend de cheddar cremoso e farofa de bacon crocante.',
        price: 38.00,
        image_url: '/demo/fries.svg',
        is_active: true,
        order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-5',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-2',
        name: 'Dadinhos de Tapioca com Geléia de Pimenta',
        description: '12 unidades de dadinhos crocantes de queijo coalho e tapioca, servidos com geléia agridoce de pimenta dedo-de-moça.',
        price: 32.00,
        image_url: '/demo/fries.svg',
        is_active: true,
        order: 2,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'cat-3',
    restaurant_id: 'demo-restaurant-1',
    name: '🍺 Cervejas & Drinks',
    order: 3,
    created_at: new Date().toISOString(),
    menu_items: [
      {
        id: 'item-6',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-3',
        name: 'Chopp Artesanal IPA (500ml)',
        description: 'Chopp puro malte bem lupulado, notas cítricas e amargor marcante na medida certa. Servido trincando.',
        price: 18.00,
        image_url: '/demo/drink.svg',
        is_active: true,
        order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-7',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-3',
        name: 'Caipirinha Tradicional de Limão',
        description: 'Cachaça artesanal envelhecida, limão tahiti fresco, açúcar orgânico e muito gelo.',
        price: 22.00,
        image_url: '/demo/drink.svg',
        is_active: true,
        order: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-8',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-3',
        name: 'Refrigerante Lata (350ml)',
        description: 'Coca-Cola tradicional, Zero, Guaraná Antarctica ou Sprite.',
        price: 7.50,
        image_url: '/demo/drink.svg',
        is_active: true,
        order: 3,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'cat-4',
    restaurant_id: 'demo-restaurant-1',
    name: '🍮 Sobremesas',
    order: 4,
    created_at: new Date().toISOString(),
    menu_items: [
      {
        id: 'item-9',
        restaurant_id: 'demo-restaurant-1',
        category_id: 'cat-4',
        name: 'Pudim de Leite Condensado na Taça',
        description: 'Pudim super aveludado sem furinhos com calda generosa de caramelo artesanal.',
        price: 16.00,
        image_url: '/demo/dessert.svg',
        is_active: true,
        order: 1,
        created_at: new Date().toISOString(),
      },
    ],
  },
]

export const metadata = {
  title: 'Bar & Hamburgueria do Chefe — Cardápio Digital (Demonstração)',
  description: 'Veja como seus clientes enxergam o cardápio no celular ao escanear o QR Code.',
}

export default function DemoMenuPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Banner de Demonstração */}
      <div className="bg-brand-500 text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
          <span><strong>Visualização Demo:</strong> Este é exatamente o visual que seu cliente vê no celular!</span>
        </div>
        <Link href="/" className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Link>
      </div>

      {/* Header do Cardápio */}
      <MenuHeader restaurant={mockRestaurant} />

      {/* Barra de Navegação Rápida entre Categorias */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 flex items-center gap-2 overflow-x-auto scrollbar-thin py-3">
          {mockCategories.map(cat => (
            <a
              key={cat.id}
              href={`#cat-${cat.id}`}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-gray-100 hover:bg-brand-500 hover:text-white text-gray-700 transition-all duration-150"
            >
              {cat.name}
            </a>
          ))}
        </div>
      </nav>

      {/* Lista de Itens do Cardápio */}
      <main className="max-w-lg mx-auto pt-6">
        {mockCategories.map(category => (
          <CategorySection key={category.id} category={category} />
        ))}
      </main>

      {/* Botão de WhatsApp Flutuante */}
      <WhatsAppButton
        whatsapp={mockRestaurant.whatsapp}
        message={mockRestaurant.whatsapp_message}
      />
    </div>
  )
}
