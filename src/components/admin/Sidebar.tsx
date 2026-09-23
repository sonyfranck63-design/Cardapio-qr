'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  QrCode, LayoutDashboard, Tag, UtensilsCrossed,
  Settings, LogOut, Menu, X, ExternalLink, CreditCard, Crown
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
        // Falha de rede não ativa Super Admin
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-brand flex-shrink-0">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight truncate">{restaurant.name}</p>
            <p className="text-xs text-gray-500 truncate">{restaurant.slug}</p>
          </div>
        </div>
        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">Ver cardápio</span>
        </a>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}

        {isSuperAdmin && (
          <div className="pt-2">
            <Link
              href="/superadmin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all duration-200"
            >
              <Crown className="w-4 h-4 flex-shrink-0 text-amber-400" />
              Super Admin
            </Link>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-white truncate max-w-[160px]">{restaurant.name}</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`
        lg:hidden fixed top-14 left-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 z-40
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar spacer */}
      <div className="lg:hidden h-14" />
    </>
  )
}
