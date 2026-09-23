import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ShieldCheck, Store, LogOut, ArrowLeft, Crown } from 'lucide-react'

import { isSuperAdminUser } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  if (!isSuperAdminUser(user)) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">CardápioQR</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Master
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">Painel de Gestão e Assinaturas SaaS</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-xs text-gray-400 hidden md:inline font-mono">
              {user.email}
            </span>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white border border-white/10 transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-brand-400" />
              <span className="hidden sm:inline">Meu Restaurante</span>
            </Link>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 border border-red-500/20 transition-colors"
                title="Sair da Conta"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 text-center text-xs text-gray-500">
        CardápioQR SaaS Master Panel • Gestão de Assinaturas & Estabelecimentos
      </footer>
    </div>
  )
}
