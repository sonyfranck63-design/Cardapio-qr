'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PublicRestaurant } from '@/types/database'
import { UtensilsCrossed } from 'lucide-react'

interface MenuHeaderProps {
  restaurant: PublicRestaurant
}

export default function MenuHeader({ restaurant }: MenuHeaderProps) {
  const [logoError, setLogoError] = useState(false)
  const hasLogo = Boolean(restaurant.logo_url && !logoError)

  return (
    <header className="bg-gradient-to-b from-orange-500 to-orange-600 text-white">
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center text-center">
        {/* Logo com tratamento de fallback */}
        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center overflow-hidden mb-4 shadow-xl">
          {hasLogo ? (
            <Image
              src={restaurant.logo_url!}
              alt={`Logo ${restaurant.name}`}
              width={80}
              height={80}
              className="object-cover w-full h-full"
              onError={() => setLogoError(true)}
              unoptimized
            />
          ) : (
            <UtensilsCrossed className="w-9 h-9 text-white/80" />
          )}
        </div>

        {/* Name */}
        <h1 className="text-2xl font-bold text-white leading-tight">{restaurant.name}</h1>
        <p className="text-orange-100 text-sm mt-1 opacity-90">Cardápio Digital</p>
      </div>
    </header>
  )
}

