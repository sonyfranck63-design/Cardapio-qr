import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Tag,
  UtensilsCrossed,
  Eye,
  EyeOff,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Lightbulb,
  Palette,
  Phone,
  Printer,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import QRCodeDisplay from '@/components/admin/QRCodeDisplay'
import { getMenuUrl } from '@/lib/utils'
import { formatPlanPrice } from '@/lib/plans'

export const metadata = {
  title: 'Painel do Restaurante — CardápioQR',
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

  // Status da assinatura
  const expiresDate = restaurant.subscription_expires_at ? new Date(restaurant.subscription_expires_at) : new Date()
  const now = new Date()
  const diffTime = expiresDate.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  const isExpired = diffTime <= 0
  const isTrial = restaurant.subscription_status === 'trial' && !isExpired
  const isActive = restaurant.subscription_status === 'active' && !isExpired

  // Checklist de Configuração (Onboarding)
  const steps = [
    {
      id: 'branding',
      title: 'Identidade & Tema',
      description: 'Envie seu logotipo ou imagem de capa e escolha as cores',
      done: Boolean(restaurant.logo_url || restaurant.cover_url),
      href: '/admin/settings',
      icon: Palette,
    },
    {
      id: 'category',
      title: 'Criar Categorias',
      description: 'Crie seções como Bebidas, Porções ou Pratos Principais',
      done: (categoriesCount ?? 0) > 0,
      href: '/admin/categories',
      icon: Tag,
    },
    {
      id: 'items',
      title: 'Cadastrar Pratos & Preços',
      description: 'Adicione seus itens com descrição, preço e fotos',
      done: ((activeItemsCount ?? 0) + (inactiveItemsCount ?? 0)) > 0,
      href: '/admin/items',
      icon: UtensilsCrossed,
    },
    {
      id: 'whatsapp',
      title: 'Configurar Pedidos no WhatsApp',
      description: 'Receba os pedidos dos clientes diretamente no seu número',
      done: Boolean(restaurant.whatsapp),
      href: '/admin/settings',
      icon: Phone,
    },
  ]

  const completedStepsCount = steps.filter(s => s.done).length
  const isSetupComplete = completedStepsCount === steps.length

  return (
    <div className="space-y-8 animate-fade-in text-stone-100">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {restaurant.name}
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            Resumo do cardápio e gestão do estabelecimento.
          </p>
        </div>

        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Abrir Cardápio Público
        </a>
      </div>

      {/* Alerta de Assinatura */}
      {isExpired && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300 text-sm">Assinatura Vencida • Cardápio Temporariamente Suspenso</p>
              <p className="text-xs text-red-200/80 mt-0.5">
                Seus clientes não conseguem visualizar o cardápio pelo QR Code. Regularize sua mensalidade para reativar o acesso.
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
            <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 text-sm">
                Período de Avaliação: {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
              </p>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Você pode utilizar todos os recursos normalmente. Ative sua assinatura para não ter interrupções.
              </p>
            </div>
          </div>
          <Link
            href="/admin/subscription"
            className="text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3.5 py-2 rounded-xl transition-colors shrink-0 text-center"
          >
            Assinar Plano Pro
          </Link>
        </div>
      )}

      {isActive && (
        <div className="p-3.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Assinatura Ativa • Renovação automática em {expiresDate.toLocaleDateString('pt-BR')}</span>
          </div>
          <Link href="/admin/subscription" className="text-stone-400 hover:text-white transition-colors underline">
            Gerenciar
          </Link>
        </div>
      )}

      {/* Checklist de Primeiros Passos (Exibido enquanto a configuração não for 100% concluída) */}
      {!isSetupComplete && (
        <div className="admin-card p-6 border-orange-500/30 bg-orange-950/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Primeiros passos para colocar seu cardápio no ar</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Conclua as etapas abaixo para ter um cardápio completo e atraente para seus clientes.
              </p>
            </div>
            <span className="text-xs font-bold text-orange-400 bg-orange-500/15 px-2.5 py-1 rounded-full border border-orange-500/30">
              {completedStepsCount} de {steps.length} concluídos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                    step.done
                      ? 'border-emerald-500/20 bg-emerald-950/10 opacity-75'
                      : 'border-white/10 bg-white/5 hover:border-orange-500/40 hover:bg-white/10'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-stone-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs sm:text-sm font-semibold ${step.done ? 'text-stone-300 line-through' : 'text-white'}`}>
                      {step.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5 line-clamp-1">
                      {step.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500 shrink-0 self-center" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-orange-500/15 rounded-xl flex items-center justify-center">
              <Tag className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-sm text-stone-400 font-medium">Categorias</p>
          </div>
          <p className="text-3xl font-extrabold text-white">{categoriesCount ?? 0}</p>
          <Link href="/admin/categories" className="text-xs text-orange-400 hover:text-orange-300 transition-colors mt-2 inline-block">
            Gerenciar categorias &rarr;
          </Link>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-emerald-500/15 rounded-xl flex items-center justify-center">
              <Eye className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm text-stone-400 font-medium">Pratos Ativos</p>
          </div>
          <p className="text-3xl font-extrabold text-white">{activeItemsCount ?? 0}</p>
          <Link href="/admin/items" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors mt-2 inline-block">
            Gerenciar pratos &rarr;
          </Link>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-stone-700/30 rounded-xl flex items-center justify-center">
              <EyeOff className="w-4 h-4 text-stone-400" />
            </div>
            <p className="text-sm text-stone-400 font-medium">Pratos Esgotados / Inativos</p>
          </div>
          <p className="text-3xl font-extrabold text-white">{inactiveItemsCount ?? 0}</p>
          <Link href="/admin/items" className="text-xs text-stone-400 hover:text-stone-300 transition-colors mt-2 inline-block">
            Ver itens inativos &rarr;
          </Link>
        </div>
      </div>

      {/* Grid Principal: QR Code & Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code e Plaquinha de Mesa */}
        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">QR Code & Plaquinhas de Mesa</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Exporte em alta resolução ou imprima diretamente o display para as mesas.
              </p>
            </div>
          </div>
          <QRCodeDisplay url={menuUrl} restaurantName={restaurant.name} />
        </div>

        {/* Ações Rápidas & Dica Operacional */}
        <div className="space-y-4">
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              <Link
                href="/admin/items"
                className="flex items-center gap-3.5 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15 transition-colors group"
              >
                <div className="w-9 h-9 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors shrink-0">
                  <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Adicionar Prato ou Bebida</p>
                  <p className="text-xs text-stone-400">Cadastre fotos, descrições e valores</p>
                </div>
              </Link>

              <Link
                href="/admin/categories"
                className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
              >
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-stone-300" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Organizar Categorias</p>
                  <p className="text-xs text-stone-400">Defina a ordem de exibição no cardápio</p>
                </div>
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
              >
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4 text-stone-300" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Ajustar Tema & Identidade</p>
                  <p className="text-xs text-stone-400">Fontes, capa, horários e WhatsApp</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Dica Operacional Profissional */}
          <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-stone-200 mb-1">Dica de Atendimento</p>
              <p className="text-xs text-stone-400 leading-relaxed">
                Pratos sem fotografia são automaticamente apresentados com o design impresso clássico pontilhado de bistrô, mantendo o cardápio sempre sofisticado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
