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
  MoreHorizontal,
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

  // Fechar com ESC quando mobileOpen estiver ativo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false)
      }
    }
    if (mobileOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/')
    router.refresh()
  }

  const menuUrl = getMenuUrl(restaurant.slug)

  const isMoreActive =
    pathname === '/admin/subscription' ||
    pathname.startsWith('/superadmin')

  return (
    <>
      {/* ========================================================
          1. DESKTOP SIDEBAR (Fixo para telas >= lg)
         ======================================================== */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-stone-200 z-40 shadow-xs">
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
          <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150
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
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-200/90 hover:bg-amber-100 transition-all duration-150"
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
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Encerrar sessão</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================
          2. MOBILE TOP BAR (Barra Superior com Menu)
         ======================================================== */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md border-b border-stone-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-stone-900 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm text-stone-900 block truncate max-w-[190px]">
              {restaurant.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir cardápio público"
            className="p-2 rounded-xl text-stone-600 hover:text-orange-700 hover:bg-orange-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200/80 transition-colors text-xs font-semibold"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-4 h-4" />
            <span>Menu</span>
          </button>
        </div>
      </header>

      {/* Espaçador superior para compensar o header fixo no mobile */}
      <div className="lg:hidden h-14" />

      {/* ========================================================
          3. MOBILE DRAWER (Gaveta Lateral Fluida & Centralizada)
         ======================================================== */}
      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 w-[85vw] max-w-[340px] bg-white z-50 flex flex-col shadow-2xl
          transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Cabeçalho Unificado do Drawer */}
        <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-stone-900 text-sm leading-tight truncate">
                {restaurant.name}
              </p>
              <p className="text-[11px] text-stone-400 font-mono truncate">
                /{restaurant.slug}
              </p>
            </div>
          </div>

          {/* Botão de Fechar perfeitamente alinhado dentro do próprio Drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 transition-colors shrink-0"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Link para o cardápio ao vivo */}
        <div className="px-4 py-2.5 bg-orange-50/50 border-b border-orange-100 flex items-center justify-between">
          <span className="text-xs text-orange-950 font-medium">Cardápio do cliente:</span>
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 transition-colors"
          >
            <span>Ver ao vivo</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>

        {/* Lista de Navegação Mobile */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3 pt-2 pb-1">
            Navegação
          </p>

          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm transition-all duration-150
                  ${
                    isActive
                      ? 'bg-orange-50 text-orange-950 font-bold border border-orange-200/90 shadow-2xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100 font-medium'
                  }
                `}
              >
                <item.icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-700' : 'text-stone-400'}`}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-600 shrink-0" />
                )}
              </Link>
            )
          })}

          {isSuperAdmin && (
            <div className="pt-3">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider px-3 pb-1">
                Administração Master
              </p>
              <Link
                href="/superadmin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-amber-950 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all duration-150"
              >
                <Crown className="w-4 h-4 shrink-0 text-amber-700" />
                <span>Painel Super Admin</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Rodapé do Drawer */}
        <div className="p-3 border-t border-stone-200 bg-stone-50/50 space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone-600 hover:text-red-700 hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0 text-stone-400" />
            <span>Encerrar sessão</span>
          </button>
          <p className="text-[10px] text-center text-stone-400">
            CardápioQR • Conectado como {restaurant.name}
          </p>
        </div>
      </aside>

      {/* ========================================================
          4. MOBILE BOTTOM BAR (Navegação Rápida com Dedão)
         ======================================================== */}
      <nav
        aria-label="Navegação rápida inferior"
        className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-t border-stone-200/90 z-40 flex items-center justify-around px-2 shadow-lg"
      >
        {/* 1. Dashboard */}
        <Link
          href="/admin"
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
            pathname === '/admin' ? 'text-orange-700 font-bold' : 'text-stone-500 hover:text-stone-900 font-medium'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${pathname === '/admin' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Início</span>
        </Link>

        {/* 2. Categorias */}
        <Link
          href="/admin/categories"
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
            pathname === '/admin/categories' ? 'text-orange-700 font-bold' : 'text-stone-500 hover:text-stone-900 font-medium'
          }`}
        >
          <Tag className={`w-5 h-5 ${pathname === '/admin/categories' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Categorias</span>
        </Link>

        {/* 3. Cardápio / Itens */}
        <Link
          href="/admin/items"
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
            pathname === '/admin/items' ? 'text-orange-700 font-bold' : 'text-stone-500 hover:text-stone-900 font-medium'
          }`}
        >
          <UtensilsCrossed className={`w-5 h-5 ${pathname === '/admin/items' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Pratos</span>
        </Link>

        {/* 4. Configurações */}
        <Link
          href="/admin/restaurant"
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
            pathname === '/admin/restaurant' ? 'text-orange-700 font-bold' : 'text-stone-500 hover:text-stone-900 font-medium'
          }`}
        >
          <Settings className={`w-5 h-5 ${pathname === '/admin/restaurant' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Ajustes</span>
        </Link>

        {/* 5. Mais Opções (Abre Drawer Completo) */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
            isMoreActive || mobileOpen ? 'text-orange-700 font-bold' : 'text-stone-500 hover:text-stone-900 font-medium'
          }`}
        >
          <MoreHorizontal className={`w-5 h-5 ${isMoreActive || mobileOpen ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Mais</span>
        </button>
      </nav>
    </>
  )
}
