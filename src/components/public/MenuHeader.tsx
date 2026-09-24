'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PublicRestaurant } from '@/types/database'
import { UtensilsCrossed, MapPin, Clock, Instagram } from 'lucide-react'
import { getContrastColor } from '@/lib/theme'

interface MenuHeaderProps {
  restaurant: PublicRestaurant
}

export default function MenuHeader({ restaurant }: MenuHeaderProps) {
  const [logoError, setLogoError] = useState(false)
  const [coverError, setCoverError] = useState(false)

  const hasLogo = Boolean(restaurant.logo_url && !logoError)
  const hasCover = Boolean(restaurant.cover_url && !coverError)

  const themeBgColor = restaurant.theme_color || '#1c1917'
  const textColor = getContrastColor(themeBgColor)
  const isLightText = textColor === '#ffffff'

  const subtextColor = isLightText ? 'text-white/75' : 'text-stone-700'
  const badgeBg = isLightText ? 'bg-white/15 border-white/20 text-white' : 'bg-stone-900/10 border-stone-900/15 text-stone-900'

  return (
    <header className="relative w-full overflow-hidden" style={{ backgroundColor: themeBgColor, color: textColor }}>
      {/* Imagem de Capa / Banner (se houver) */}
      {hasCover && (
        <div className="relative w-full h-44 sm:h-52 md:h-60 overflow-hidden bg-stone-900">
          <Image
            src={restaurant.cover_url!}
            alt={`Capa de ${restaurant.name}`}
            fill
            className="object-cover"
            priority
            onError={() => setCoverError(true)}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      )}

      {/* Conteúdo do Restaurante */}
      <div className={`max-w-xl mx-auto px-4 ${hasCover ? 'pb-6 pt-0' : 'py-8'} flex flex-col items-center text-center`}>
        {/* Logo */}
        <div
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border-2 ${
            hasCover ? '-mt-10 sm:-mt-12 mb-3 bg-stone-900 border-white/40 z-10' : 'mb-3 bg-white/10 border-white/20'
          }`}
        >
          {hasLogo ? (
            <Image
              src={restaurant.logo_url!}
              alt={`Logo de ${restaurant.name}`}
              width={96}
              height={96}
              className="object-cover w-full h-full"
              onError={() => setLogoError(true)}
              unoptimized
            />
          ) : (
            <UtensilsCrossed className="w-10 h-10 opacity-70" />
          )}
        </div>

        {/* Nome do Restaurante */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight px-2">{restaurant.name}</h1>

        {/* Tagline / Frase */}
        {restaurant.tagline ? (
          <p className={`text-sm sm:text-base mt-1.5 max-w-md ${subtextColor} font-normal`}>
            {restaurant.tagline}
          </p>
        ) : null}

        {/* Informações Complementares (Endereço, Horários, Instagram) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-medium">
          {restaurant.opening_hours && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${badgeBg}`}>
              <Clock className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span>{restaurant.opening_hours}</span>
            </span>
          )}

          {restaurant.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-opacity hover:opacity-80 ${badgeBg}`}
              title="Abrir localização no Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span className="truncate max-w-[200px]">{restaurant.address}</span>
            </a>
          )}

          {restaurant.instagram && (
            <a
              href={`https://instagram.com/${restaurant.instagram.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-opacity hover:opacity-80 ${badgeBg}`}
              title="Abrir perfil no Instagram"
            >
              <Instagram className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span>@{restaurant.instagram.replace(/^@/, '')}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
