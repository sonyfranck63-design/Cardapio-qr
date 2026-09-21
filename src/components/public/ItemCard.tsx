import Image from 'next/image'
import { MenuItem } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import { UtensilsCrossed } from 'lucide-react'

interface ItemCardProps {
  item: MenuItem
}

export default function ItemCard({ item }: ItemCardProps) {
  return (
    <div className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="w-20 h-20 rounded-xl bg-orange-50 flex-shrink-0 overflow-hidden border border-orange-100">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            width={80}
            height={80}
            className="object-cover w-full h-full"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="w-7 h-7 text-orange-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</h3>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        <p className="text-base font-bold text-orange-500 mt-2">{formatCurrency(item.price)}</p>
      </div>
    </div>
  )
}
