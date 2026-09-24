import { CategoryWithItems } from '@/types/database'
import ItemCard from './ItemCard'

interface CategorySectionProps {
  category: CategoryWithItems
  showSoldOut?: boolean
  whatsappNumber?: string | null
}

export default function CategorySection({
  category,
  showSoldOut = false,
  whatsappNumber,
}: CategorySectionProps) {
  const visibleItems = showSoldOut
    ? category.menu_items
    : category.menu_items.filter(item => item.is_active)

  if (visibleItems.length === 0) return null

  return (
    <section id={`cat-${category.id}`} className="mb-8 scroll-mt-20">
      {/* Título da Categoria */}
      <div className="flex items-center gap-3 mb-3.5 px-4">
        <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
          {category.name}
        </h2>
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs text-stone-500 font-medium bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
          {visibleItems.length} {visibleItems.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {/* Grid / Lista de Pratos */}
      <div className="px-4 space-y-2.5">
        {visibleItems.map(item => (
          <ItemCard key={item.id} item={item} whatsappNumber={whatsappNumber} />
        ))}
      </div>
    </section>
  )
}
