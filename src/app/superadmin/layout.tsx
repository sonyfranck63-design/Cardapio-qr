import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Store, LogOut, Crown } from 'lucide-react'
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
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-stone-950 tracking-tight">CardápioQR</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Master
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">Painel de Gestão e Assinaturas SaaS</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <span className="text-xs text-stone-500 hidden md:inline font-mono bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
              {user.email}
            </span>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 border border-stone-300 transition-colors shadow-2xs"
            >
              <Store className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">Meu Restaurante</span>
            </Link>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 border border-red-200 transition-colors"
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
      <footer className="border-t border-stone-200/80 py-4 text-center text-xs text-stone-500 bg-white/40">
        CardápioQR SaaS Master • Gestão de Assinaturas & Estabelecimentos
      </footer>
    </div>
  )
}
