import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tag, UtensilsCrossed, Eye, EyeOff, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import QRCodeDisplay from '@/components/admin/QRCodeDisplay'
import { getMenuUrl } from '@/lib/utils'

export const metadata = {
  title: 'Dashboard',
}

export default async function AdminDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!restaurant) redirect('/auth/register')

  const [{ count: categoriesCount }, { count: activeItemsCount }, { count: inactiveItemsCount }] =
    await Promise.all([
      supabase.from('categories').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id),
      supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id).eq('is_active', true),
      supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id).eq('is_active', false),
    ])

  const menuUrl = getMenuUrl(restaurant.slug)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Olá! 👋
        </h1>
        <p className="text-gray-400 mt-1">Aqui está o resumo do seu cardápio.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-brand-500/15 rounded-xl flex items-center justify-center">
              <Tag className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-sm text-gray-400">Categorias</p>
          </div>
          <p className="text-3xl font-bold text-white">{categoriesCount ?? 0}</p>
          <Link href="/admin/categories" className="text-xs text-brand-400 hover:text-brand-300 transition-colors mt-1 inline-block">
            Gerenciar →
          </Link>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-emerald-500/15 rounded-xl flex items-center justify-center">
              <Eye className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm text-gray-400">Itens ativos</p>
          </div>
          <p className="text-3xl font-bold text-white">{activeItemsCount ?? 0}</p>
          <Link href="/admin/items" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors mt-1 inline-block">
            Gerenciar →
          </Link>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gray-500/15 rounded-xl flex items-center justify-center">
              <EyeOff className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400">Itens inativos</p>
          </div>
          <p className="text-3xl font-bold text-white">{inactiveItemsCount ?? 0}</p>
          <Link href="/admin/items" className="text-xs text-gray-400 hover:text-gray-300 transition-colors mt-1 inline-block">
            Gerenciar →
          </Link>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code */}
        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">QR Code do cardápio</h2>
              <p className="text-sm text-gray-400 mt-0.5">Imprima e coloque nas mesas</p>
            </div>
          </div>
          <QRCodeDisplay url={menuUrl} restaurantName={restaurant.name} />
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="admin-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Ações rápidas</h2>
            <div className="space-y-3">
              <Link
                href="/admin/items"
                className="flex items-center gap-4 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/15 transition-colors group"
              >
                <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center group-hover:bg-brand-500/30 transition-colors">
                  <UtensilsCrossed className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">Adicionar item</p>
                  <p className="text-xs text-gray-400">Prato, bebida, sobremesa...</p>
                </div>
              </Link>

              <Link
                href="/admin/categories"
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors group"
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">Nova categoria</p>
                  <p className="text-xs text-gray-400">Organize seu cardápio</p>
                </div>
              </Link>

              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors group"
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">Ver cardápio público</p>
                  <p className="text-xs text-gray-400">Como o cliente vê</p>
                </div>
              </a>
            </div>
          </div>

          {/* Tip */}
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
            <p className="text-sm font-medium text-brand-300 mb-1">💡 Dica</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Você pode ativar e desativar itens sem excluir. Use isso quando um item estiver em falta.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
