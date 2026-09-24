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
      href: '/admin/restaurant',
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
      href: '/admin/restaurant',
      icon: Phone,
    },
  ]

  const completedStepsCount = steps.filter(s => s.done).length
  const isSetupComplete = completedStepsCount === steps.length

  return (
    <div className="space-y-8 animate-fade-in text-stone-900 font-sans">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight">
            {restaurant.name}
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Resumo do cardápio e gestão do estabelecimento.
          </p>
        </div>

        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-semibold transition-colors shadow-2xs self-start sm:self-auto"
        >
          <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
          <span>Abrir Cardápio Público</span>
        </a>
      </div>

      {/* Alerta de Assinatura */}
      {isExpired && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 text-sm">Assinatura Vencida • Cardápio Temporariamente Suspenso</p>
              <p className="text-xs text-red-700 mt-0.5">
                Seus clientes não conseguem visualizar o cardápio pelo QR Code. Regularize sua mensalidade para reativar o acesso.
              </p>
            </div>
          </div>
          <Link
            href="/admin/subscription"
            className="btn-primary bg-red-700 hover:bg-red-800 text-xs px-4 py-2 font-semibold shrink-0 text-center"
          >
            Pagar Mensalidade ({formatPlanPrice()})
          </Link>
        </div>
      )}

      {isTrial && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-950 text-sm">
                Período de Avaliação: {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Você pode utilizar todos os recursos normalmente. Ative sua assinatura para garantir a continuidade.
              </p>
            </div>
          </div>
          <Link
            href="/admin/subscription"
            className="inline-flex items-center justify-center text-xs font-bold text-amber-950 bg-amber-200/80 hover:bg-amber-300 border border-amber-300 px-4 py-2 rounded-xl transition-colors shrink-0 text-center"
          >
            Assinar Plano Pro
          </Link>
        </div>
      )}

      {isActive && (
        <div className="p-3.5 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Assinatura Ativa • Renovação automática em {expiresDate.toLocaleDateString('pt-BR')}</span>
          </div>
          <Link href="/admin/subscription" className="text-emerald-800 hover:text-emerald-950 font-medium transition-colors underline">
            Gerenciar
          </Link>
        </div>
      )}

      {/* Checklist de Primeiros Passos */}
      {!isSetupComplete && (
        <div className="admin-card p-6 border-orange-200 bg-orange-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">Primeiros passos para colocar seu cardápio no ar</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Conclua as etapas abaixo para ter um cardápio completo e atraente para seus clientes.
              </p>
            </div>
            <span className="text-xs font-bold text-orange-900 bg-orange-100 border border-orange-200 px-3 py-1 rounded-full self-start sm:self-auto">
              {completedStepsCount} de {steps.length} concluídos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {steps.map((step) => {
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                    step.done
                      ? 'border-emerald-200 bg-emerald-50/60 opacity-80'
                      : 'border-stone-200 bg-white hover:border-orange-300 hover:shadow-xs'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs sm:text-sm font-semibold ${step.done ? 'text-stone-500 line-through' : 'text-stone-900'}`}>
                      {step.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 line-clamp-1">
                      {step.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 shrink-0 self-center" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-orange-100 text-orange-800 rounded-xl flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <p className="text-xs uppercase tracking-wider font-semibold text-stone-500">Categorias</p>
          </div>
          <p className="text-3xl font-extrabold text-stone-950 tabular-nums">{categoriesCount ?? 0}</p>
          <Link href="/admin/categories" className="text-xs font-semibold text-orange-700 hover:text-orange-800 transition-colors mt-2 inline-block">
            Gerenciar categorias &rarr;
          </Link>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
              <Eye className="w-4 h-4" />
            </div>
            <p className="text-xs uppercase tracking-wider font-semibold text-stone-500">Pratos Ativos</p>
          </div>
          <p className="text-3xl font-extrabold text-stone-950 tabular-nums">{activeItemsCount ?? 0}</p>
          <Link href="/admin/items" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors mt-2 inline-block">
            Gerenciar pratos &rarr;
          </Link>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-stone-100 text-stone-700 rounded-xl flex items-center justify-center font-bold">
              <EyeOff className="w-4 h-4" />
            </div>
            <p className="text-xs uppercase tracking-wider font-semibold text-stone-500">Esgotados / Inativos</p>
          </div>
          <p className="text-3xl font-extrabold text-stone-950 tabular-nums">{inactiveItemsCount ?? 0}</p>
          <Link href="/admin/items" className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors mt-2 inline-block">
            Ver itens inativos &rarr;
          </Link>
        </div>
      </div>

      {/* Grid Principal: QR Code & Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code e Plaquinha de Mesa */}
        <div className="admin-card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">QR Code & Plaquinhas de Mesa</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Exporte em alta resolução ou imprima diretamente o display para as mesas.
            </p>
          </div>
          <QRCodeDisplay url={menuUrl} restaurantName={restaurant.name} />
        </div>

        {/* Ações Rápidas & Dica Operacional */}
        <div className="space-y-4">
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold text-stone-900 mb-4 tracking-tight">Ações Rápidas</h2>
            <div className="space-y-3">
              <Link
                href="/admin/items"
                className="flex items-center gap-3.5 p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 hover:bg-orange-100/70 transition-colors group"
              >
                <div className="w-9 h-9 bg-orange-100 text-orange-800 rounded-lg flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-sm">Adicionar Prato ou Bebida</p>
                  <p className="text-xs text-stone-500">Cadastre fotos, descrições e valores</p>
                </div>
              </Link>

              <Link
                href="/admin/categories"
                className="flex items-center gap-3.5 p-3.5 rounded-xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors group"
              >
                <div className="w-9 h-9 bg-white border border-stone-200 rounded-lg flex items-center justify-center shrink-0 text-stone-700">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-sm">Organizar Categorias</p>
                  <p className="text-xs text-stone-500">Defina a ordem de exibição no cardápio</p>
                </div>
              </Link>

              <Link
                href="/admin/restaurant"
                className="flex items-center gap-3.5 p-3.5 rounded-xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors group"
              >
                <div className="w-9 h-9 bg-white border border-stone-200 rounded-lg flex items-center justify-center shrink-0 text-stone-700">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-sm">Ajustar Tema & Identidade</p>
                  <p className="text-xs text-stone-500">Fontes, capa, horários e WhatsApp</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Dica Operacional */}
          <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/80 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center shrink-0 font-bold">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-950 mb-0.5">Dica de Cardápio</p>
              <p className="text-xs text-stone-600 leading-relaxed">
                Pratos sem fotografia são automaticamente apresentados com o design impresso clássico pontilhado de bistrô, mantendo o cardápio sempre harmonioso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
