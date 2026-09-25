'use client'

import { useEffect, useState, useRef } from 'react'
import { CategoryWithItems } from '@/types/database'
import { getContrastColor } from '@/lib/theme'

interface CategoryNavProps {
  categories: CategoryWithItems[]
  themeColor?: string | null
}

export default function CategoryNav({ categories, themeColor }: CategoryNavProps) {
  const [activeId, setActiveId] = useState<string>(categories[0]?.id || '')
  const navRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<Map<string, HTMLButtonElement>>(new Map())

  const activeBg = themeColor || '#ea580c'
  const activeTextColor = getContrastColor(activeBg)

  useEffect(() => {
    if (categories.length <= 1) return

    const observerCallback: IntersectionObserverCallback = (entries) => {
      // Procura a entrada que mais intersecciona a linha superior da tela
      const visibleEntries = entries.filter((entry) => entry.isIntersecting)
      if (visibleEntries.length > 0) {
        // Pega a primeira seção visível do topo
        const targetId = visibleEntries[0].target.id.replace('cat-', '')
        if (targetId) {
          setActiveId(targetId)
        }
      }
    }

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '-15% 0px -65% 0px',
      threshold: 0,
    })

    categories.forEach((cat) => {
      const element = document.getElementById(`cat-${cat.id}`)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [categories])

  // Rola horizontalmente a barra de navegação para manter o botão ativo visível (sem afetar a rolagem vertical da página)
  useEffect(() => {
    if (!activeId) return
    const button = buttonsRef.current.get(activeId)
    const navContainer = navRef.current
    if (button && navContainer) {
      const containerRect = navContainer.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()

      if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
        const offsetLeft = button.offsetLeft
        const targetScrollLeft = offsetLeft - navContainer.clientWidth / 2 + button.clientWidth / 2

        navContainer.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth',
        })
      }
    }
  }, [activeId])

  if (categories.length <= 1) return null

  function scrollToCategory(id: string) {
    setActiveId(id)
    const element = document.getElementById(`cat-${id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-lg mx-auto px-4">
        <div
          ref={navRef}
          className="flex gap-2 overflow-x-auto py-3 scrollbar-none no-scrollbar"
        >
          {categories.map((cat) => {
            const isActive = activeId === cat.id
            return (
              <button
                key={cat.id}
                ref={(el) => {
                  if (el) buttonsRef.current.set(cat.id, el)
                  else buttonsRef.current.delete(cat.id)
                }}
                onClick={() => scrollToCategory(cat.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:outline-none ${
                  isActive
                    ? 'shadow-xs'
                    : 'bg-stone-100 text-stone-700 [@media(hover:hover)]:hover:bg-stone-200 [@media(hover:hover)]:hover:text-stone-950 active:bg-stone-200'
                }`}
                style={isActive ? { backgroundColor: activeBg, color: activeTextColor } : undefined}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

