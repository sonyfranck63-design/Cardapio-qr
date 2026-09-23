'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MenuItem } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import { UtensilsCrossed } from 'lucide-react'
import ItemDetailModal from './ItemDetailModal'

interface ItemCardProps {
  item: MenuItem
}

export default function ItemCard({ item }: ItemCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const hasValidImage = Boolean(item.image_url && !imageError)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={handleKeyDown}
        aria-label={`Ver detalhes de ${item.name}`}
        className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none select-none text-left"
      >
        {/* Container de Imagem com proporção e fallback profissional */}
        <div className="w-20 h-20 rounded-xl bg-orange-50/80 flex-shrink-0 overflow-hidden border border-orange-100/60 relative flex items-center justify-center">
          {hasValidImage ? (
            <Image
              src={item.image_url!}
              alt={item.name}
              width={80}
              height={80}
              sizes="80px"
              className="object-cover w-full h-full transition-opacity duration-200"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100/60 text-orange-400">
              <UtensilsCrossed className="w-7 h-7 stroke-[1.5]" />
            </div>
          )}
        </div>

        {/* Conteúdo textual */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug break-words">{item.name}</h3>
            {item.description && (
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2 break-words">
                {item.description}
              </p>
            )}
          </div>
          <p className="text-base font-bold text-orange-600 mt-2 tabular-nums">{formatCurrency(item.price)}</p>
        </div>
      </div>

      {/* Modal Acessível com Detalhes Completos */}
      <ItemDetailModal
        item={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
