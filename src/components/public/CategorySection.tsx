import { CategoryWithItems } from '@/types/database'
import ItemCard from './ItemCard'

interface CategorySectionProps {
  category: CategoryWithItems
}

export default function CategorySection({ category }: CategorySectionProps) {
  const activeItems = category.menu_items.filter(item => item.is_active)

  if (activeItems.length === 0) return null

  return (
    <section id={`cat-${category.id}`} className="mb-8">
      {/* Category title */}
      <div className="flex items-center gap-3 mb-4 px-4">
        <h2 className="text-base font-bold text-gray-800">{category.name}</h2>
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
          {activeItems.length} {activeItems.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {/* Items grid */}
      <div className="px-4 space-y-3">
        {activeItems.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
