'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MenuItem } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import ItemDetailModal from './ItemDetailModal'

interface ItemCardProps {
  item: MenuItem
  whatsappNumber?: string | null
}

export default function ItemCard({ item, whatsappNumber }: ItemCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const hasValidImage = Boolean(item.image_url && !imageError)
  const isSoldOut = !item.is_active

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsModalOpen(true)
    }
  }

  // Se o item NÃO tem foto: estilo clássico impresso de alta gastronomia com linha pontilhada
  if (!hasValidImage) {
    return (
      <>
        <article
          role="button"
          tabIndex={0}
          onClick={() => setIsModalOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label={`Ver detalhes de ${item.name}`}
          className={`group py-3 px-4 rounded-xl transition-colors select-none text-left cursor-pointer border border-stone-200/60 bg-white/80 hover:bg-white hover:border-stone-300 shadow-sm ${
            isSoldOut ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <div className="dotted-leader">
            <h3 className="font-semibold text-stone-900 text-sm sm:text-base leading-snug pr-1">
              {item.name}
            </h3>
            <span className="font-bold text-stone-900 text-sm sm:text-base tabular-nums pl-1 shrink-0">
              {formatCurrency(item.price)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            {item.description ? (
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            ) : (
              <span />
            )}

            {isSoldOut && (
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-semibold tracking-wide">
                Esgotado
              </span>
            )}
          </div>
        </article>

        <ItemDetailModal
          item={item}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          whatsappNumber={whatsappNumber}
        />
      </>
    )
  }

  // Item COM foto: card visual harmonioso com imagem grande e apetitosa
  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={handleKeyDown}
        aria-label={`Ver detalhes de ${item.name}`}
        className={`group flex gap-3.5 p-3 rounded-2xl bg-white border border-stone-200/80 shadow-sm hover:shadow-md hover:border-stone-300 transition-all select-none text-left cursor-pointer ${
          isSoldOut ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        {/* Imagem do Prato */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-stone-100 shrink-0 overflow-hidden border border-stone-200">
          <Image
            src={item.image_url!}
            alt={item.name}
            fill
            sizes="112px"
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              isSoldOut ? 'grayscale' : ''
            }`}
            onError={() => setImageError(true)}
          />
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider text-center">
                Esgotado
              </span>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-stone-900 text-sm sm:text-base leading-snug">
                {item.name}
              </h3>
            </div>
            {item.description && (
              <p className="text-xs text-stone-600 mt-1 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100">
            <span className="text-sm sm:text-base font-bold text-stone-900 tabular-nums">
              {formatCurrency(item.price)}
            </span>
            {isSoldOut ? (
              <span className="text-[11px] font-medium text-red-600">Indisponível</span>
            ) : (
              <span className="text-xs text-stone-400 group-hover:text-stone-700 transition-colors">
                Ver detalhes &rarr;
              </span>
            )}
          </div>
        </div>
      </article>

      <ItemDetailModal
        item={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        whatsappNumber={whatsappNumber}
      />
    </>
  )
}
