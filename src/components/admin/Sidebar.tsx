'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  QrCode,
  LayoutDashboard,
  Tag,
  UtensilsCrossed,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  CreditCard,
  Crown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Restaurant } from '@/types/database'
import { getMenuUrl } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AdminSidebarProps {
  restaurant: Restaurant
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/categories', label: 'Categorias', icon: Tag },
  { href: '/admin/items', label: 'Itens do Cardápio', icon: UtensilsCrossed },
  { href: '/admin/restaurant', label: 'Configurações', icon: Settings },
  { href: '/admin/subscription', label: 'Minha Assinatura', icon: CreditCard },
]

export default function AdminSidebar({ restaurant }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    async function checkAdmin() {
      try {
        const res = await fetch('/api/auth/is-superadmin')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data?.isSuperAdmin) {
            setIsSuperAdmin(true)
          }
        }
      } catch {
        // Falha de rede silenciosa
      }
    }
    checkAdmin()
    return () => {
      isMounted = false
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/')
    router.refresh()
  }

  const menuUrl = getMenuUrl(restaurant.slug)

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-stone-900">
      {/* Topo / Restaurante */}
      <div className="p-5 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-stone-900 text-sm leading-snug truncate">{restaurant.name}</p>
            <p className="text-[11px] text-stone-400 font-mono truncate">/{restaurant.slug}</p>
          </div>
        </div>
        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:text-orange-800 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span>Ver cardápio ao vivo</span>
        </a>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 p-3.5 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
                ${
                  isActive
                    ? 'bg-orange-50 text-orange-950 font-bold border border-orange-200/90 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100 font-medium'
                }
              `}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-700' : 'text-stone-400'}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {isSuperAdmin && (
          <div className="pt-2">
            <Link
              href="/superadmin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-200/90 hover:bg-amber-100 transition-all duration-150"
            >
              <Crown className="w-4 h-4 shrink-0 text-amber-700" />
              <span>Super Admin</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Rodapé / Sair */}
      <div className="p-3.5 border-t border-stone-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Encerrar sessão</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-stone-200 z-40 shadow-xs">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-stone-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center text-white">
            <QrCode className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-stone-900 truncate max-w-[170px]">{restaurant.name}</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition-colors"
          aria-label="Abrir menu de navegação"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          lg:hidden fixed top-14 left-0 bottom-0 w-64 bg-white border-r border-stone-200 z-50
          transition-transform duration-200 shadow-xl
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Mobile spacer */}
      <div className="lg:hidden h-14" />
    </>
  )
}
