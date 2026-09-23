import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tag, UtensilsCrossed, Eye, EyeOff, ExternalLink, CreditCard, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import QRCodeDisplay from '@/components/admin/QRCodeDisplay'
import { getMenuUrl } from '@/lib/utils'
import { formatPlanPrice } from '@/lib/plans'

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

  if (!restaurant) redirect('/auth/login')

  const [{ count: categoriesCount }, { count: activeItemsCount }, { count: inactiveItemsCount }] =
    await Promise.all([
      supabase.from('categories').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id),
      supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id).eq('is_active', true),
      supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurant.id).eq('is_active', false),
    ])

  const menuUrl = getMenuUrl(restaurant.slug)

  // Dados da assinatura
  const expiresDate = restaurant.subscription_expires_at ? new Date(restaurant.subscription_expires_at) : new Date()
  const now = new Date()
  const diffTime = expiresDate.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  const isExpired = diffTime <= 0
  const isTrial = restaurant.subscription_status === 'trial' && !isExpired
  const isActive = restaurant.subscription_status === 'active' && !isExpired

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Olá, {restaurant.name}! 👋
        </h1>
        <p className="text-gray-400 mt-1">Aqui está o resumo do seu cardápio e status da sua conta.</p>
      </div>

      {/* Subscription Banner */}
      {isExpired && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300 text-sm">Assinatura Vencida • Cardápio Suspenso</p>
              <p className="text-xs text-red-200/80 mt-0.5">
                Seus clientes não conseguem acessar o cardápio pelo QR Code. Renove sua mensalidade para reativar.
              </p>
            </div>
          </div>
          <Link
            href="/admin/subscription"
            className="btn-primary bg-red-600 hover:bg-red-700 text-xs px-4 py-2.5 font-semibold shrink-0 text-center"
          >
            Pagar Mensalidade ({formatPlanPrice()})
          </Link>
        </div>
      )}

      {isTrial && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 text-sm">
                Período de Testes: {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
              </p>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Aproveite para cadastrar seus itens e testar. Garanta a continuidade assinando o plano mensal.
              </p>
            </div>
          </div>
          <Link
            href="/admin/subscription"
            className="text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3.5 py-2 rounded-xl transition-colors shrink-0 text-center"
          >
            Gerenciar Assinatura
          </Link>
        </div>
      )}

      {isActive && (
        <div className="p-3.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Assinatura Ativa • Próxima renovação em {expiresDate.toLocaleDateString('pt-BR')}</span>
          </div>
          <Link href="/admin/subscription" className="text-gray-400 hover:text-white transition-colors underline">
            Detalhes
          </Link>
        </div>
      )}

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
