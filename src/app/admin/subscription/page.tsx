'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Restaurant } from '@/types/database'
import { CreditCard, CheckCircle2, AlertCircle, Clock, ShieldCheck, Zap, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPlanPrice } from '@/lib/plans'

function SubscriptionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('payment')

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [pollingActive, setPollingActive] = useState(false)
  const supabase = createClient()

  const loadRestaurant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setRestaurant(data)
        return data
      }
    }
    return null
  }, [supabase])

  // Carga inicial
  useEffect(() => {
    let isMounted = true
    loadRestaurant().then(() => {
      if (isMounted) setLoading(false)
    })
    return () => {
      isMounted = false
    }
  }, [loadRestaurant])

  // Polling quando retorna do Mercado Pago com payment=success
  useEffect(() => {
    if (paymentStatus !== 'success') return

    setPollingActive(true)
    let attempts = 0
    const maxAttempts = 10 // 10 tentativas x 3s = 30s

    const interval = setInterval(async () => {
      attempts += 1
      const updated = await loadRestaurant()

      if (updated && updated.subscription_status === 'active') {
        clearInterval(interval)
        setPollingActive(false)
        toast.success('Pagamento confirmado e assinatura renovada com sucesso!')
        router.replace('/admin/subscription')
      } else if (attempts >= maxAttempts) {
        clearInterval(interval)
        setPollingActive(false)
        toast('Pagamento recebido. A confirmação bancária pode levar alguns instantes.', {
          icon: 'ℹ️',
        })
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [paymentStatus, loadRestaurant, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-orange-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!restaurant) {
    return null
  }

  const expiresDate = restaurant.subscription_expires_at
    ? new Date(restaurant.subscription_expires_at)
    : new Date()
  const now = new Date()
  const diffTime = expiresDate.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  const isExpired = diffTime <= 0
  const isTrial = restaurant.subscription_status === 'trial' && !isExpired
  const isActive = restaurant.subscription_status === 'active' && !isExpired

  async function handleCheckout() {
    setProcessingPayment(true)
    try {
      const res = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        toast.error(data.error || 'Erro ao iniciar pagamento')
        return
      }

      window.location.href = data.url
    } catch {
      toast.error('Erro de conexão ao iniciar pagamento')
    } finally {
      setProcessingPayment(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans text-stone-900">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight flex items-center gap-2.5">
          <CreditCard className="w-6 h-6 text-orange-700" />
          Minha Assinatura
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Gerencie o plano do seu restaurante e acompanhe a validade do seu cardápio online.
        </p>
      </div>

      {/* Banners de Feedback do Pagamento */}
      {paymentStatus === 'success' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-950 animate-slide-up">
          {pollingActive ? (
            <RefreshCw className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold text-sm">
              {pollingActive
                ? 'Pagamento recebido! Confirmando ativação com o gateway...'
                : 'Pagamento processado com sucesso!'}
            </p>
            <p className="text-xs text-emerald-800 mt-0.5">
              {pollingActive
                ? 'Aguarde alguns segundos enquanto sincronizamos os dados do Mercado Pago automaticamente.'
                : 'Sua assinatura mensal foi renovada e o cardápio está totalmente ativo.'}
            </p>
          </div>
        </div>
      )}

      {paymentStatus === 'pending' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-950 animate-slide-up">
          <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Pagamento em processamento ou pendente</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Se você pagou via PIX ou boleto, a liberação ocorre assim que a instituição bancária concluir a compensação.
            </p>
          </div>
        </div>
      )}

      {paymentStatus === 'failure' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-950 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">O pagamento não foi concluído</p>
            <p className="text-xs text-red-800 mt-0.5">
              A transação foi recusada pela operadora ou cancelada. Nenhuma cobrança foi efetuada. Tente novamente abaixo.
            </p>
          </div>
        </div>
      )}

      {/* Main Status Card */}
      <div className="admin-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Status atual:</span>
              {isActive && <span className="badge-active text-xs">Ativo • Mensal</span>}
              {isTrial && <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-900 border border-amber-200">Período de Teste Grátis</span>}
              {isExpired && <span className="badge-inactive text-xs text-red-700 bg-red-50 border-red-200">Expirado / Suspenso</span>}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-950">
              {isActive && 'Sua assinatura está ativa'}
              {isTrial && `${daysRemaining} ${daysRemaining === 1 ? 'dia restante' : 'dias restantes'} de teste`}
              {isExpired && 'Assinatura vencida'}
            </h2>

            <p className="text-sm text-stone-600">
              {isExpired ? (
                <span className="text-red-700 font-semibold">
                  Venceu em {expiresDate.toLocaleDateString('pt-BR')}. Regularize para reativar seu cardápio imediatamente.
                </span>
              ) : isTrial ? (
                <span>
                  Seu período de teste encerra em <strong className="text-stone-900">{expiresDate.toLocaleDateString('pt-BR')}</strong>.
                </span>
              ) : (
                <span>
                  Próxima renovação: <strong className="text-stone-900">{expiresDate.toLocaleDateString('pt-BR')}</strong> (em {daysRemaining} dias)
                </span>
              )}
            </p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={processingPayment}
            className="btn-primary py-3 px-6 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 shrink-0"
          >
            {processingPayment ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isActive ? 'Antecipar Renovação' : `Assinar Agora (${formatPlanPrice()}/mês)`}
          </button>
        </div>

        {isExpired && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <strong>Atenção: Seu cardápio digital via QR Code está temporariamente suspenso.</strong>
              <p className="mt-1 text-red-800 text-xs">
                Clientes que escanearem a placa nas mesas verão uma mensagem informando que o cardápio está temporariamente indisponível. Regularize a mensalidade para reativar instantaneamente.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detalhes do Plano */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-4">
            <h3 className="font-bold text-lg text-stone-950">Plano Pro CardápioQR</h3>
            <span className="text-2xl font-extrabold text-stone-950">{formatPlanPrice()}<span className="text-xs font-normal text-stone-500">/mês</span></span>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Tudo o que seu estabelecimento precisa para apresentar pratos com sofisticação e receber pedidos no WhatsApp.
          </p>

          <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-stone-700">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cardápio online disponível 24h sem limite de acessos</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>QR Code exclusivo para download em SVG e PNG de alta resolução</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Categorias e pratos ilimitados com fotos e descrições</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Envio de pedidos direto no WhatsApp do seu atendimento</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero taxas ou comissões sobre as suas vendas</span>
            </li>
          </ul>
        </div>

        <div className="admin-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-stone-900 font-bold text-base mb-2">
              <ShieldCheck className="w-5 h-5 text-orange-700" />
              Pagamento 100% Seguro
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Processado com segurança pelo <strong>Mercado Pago</strong> com confirmação imediata via <strong>PIX</strong> ou Cartão de Crédito.
            </p>

            <div className="mt-5 p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
              <div className="text-xs text-stone-500 font-semibold">
                ID do Estabelecimento:
              </div>
              <div className="text-xs font-mono bg-white px-2.5 py-1.5 rounded border border-stone-200 text-stone-800 truncate">
                {restaurant.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-orange-700 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  )
}
