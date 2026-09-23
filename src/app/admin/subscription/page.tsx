'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Restaurant } from '@/types/database'
import { CreditCard, CheckCircle2, AlertCircle, Clock, Sparkles, ShieldCheck, Zap, ExternalLink, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SubscriptionPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    async function loadRestaurant() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user && isMounted) {
        const { data } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (isMounted) setRestaurant(data)
      }
      if (isMounted) setLoading(false)
    }

    loadRestaurant()

    return () => {
      isMounted = false
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
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
    try {
      setProcessingPayment(true)
      const res = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
      })
      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      toast.error('Erro ao conectar com o serviço de pagamentos.')
    } finally {
      setProcessingPayment(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-brand-500" />
          Minha Assinatura & Mensalidade
        </h1>
        <p className="text-gray-400 mt-1">
          Gerencie o plano do seu restaurante e mantenha seu cardápio online e ativo via QR Code.
        </p>
      </div>

      {/* Status Card */}
      <div className={`glass-card p-6 sm:p-8 border-l-4 ${
        isActive
          ? 'border-l-emerald-500'
          : isTrial
          ? 'border-l-amber-500'
          : 'border-l-red-500'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                Status da Conta:
              </span>
              {isActive && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Assinatura Ativa
                </span>
              )}
              {isTrial && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Período de Testes ({daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'})
                </span>
              )}
              {isExpired && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Assinatura Vencida (Cardápio Suspenso)
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-white">
              {restaurant.name}
            </h2>
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              {isExpired ? (
                <span className="text-red-400 font-medium">
                  Venceu em: {expiresDate.toLocaleDateString('pt-BR')} às {expiresDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <span>
                  Próxima renovação: <strong className="text-white">{expiresDate.toLocaleDateString('pt-BR')}</strong> (em {daysRemaining} dias)
                </span>
              )}
            </p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={processingPayment}
            className="btn-primary py-3 px-6 text-sm sm:text-base font-semibold shadow-brand flex items-center justify-center gap-2"
          >
            {processingPayment ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isActive ? 'Antecipar Renovação' : 'Assinar Agora (R$ 49,90/mês)'}
          </button>
        </div>

        {isExpired && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong>Atenção: Seu cardápio digital via QR Code está temporariamente suspenso.</strong>
              <p className="mt-1 text-red-200/80 text-xs">
                Clientes que escanearem a placa nas mesas verão uma mensagem informando que o cardápio está indisponível. Regularize a mensalidade para reativar instantaneamente.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plan Details & Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white">Plano Pro CardápioQR</h3>
            <span className="text-2xl font-extrabold text-brand-400">R$ 49,90<span className="text-sm font-normal text-gray-400">/mês</span></span>
          </div>
          <p className="text-sm text-gray-400">
            Tudo o que seu estabelecimento precisa para vender mais e automatizar o atendimento.
          </p>

          <ul className="space-y-3 pt-2 text-sm text-gray-300">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cardápio online disponível 24h</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>QR Code exclusivo para download e impressão</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Categorias e itens ilimitados com fotos e preços</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Botão WhatsApp integrado para envio do pedido</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sem cobrança de comissões por pedido</span>
            </li>
          </ul>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-white font-semibold text-lg mb-2">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              Pagamento 100% Seguro
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Processado pelo <strong>Mercado Pago</strong> com confirmação imediata via <strong>PIX</strong> ou Cartão de Crédito.
            </p>

            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
              <div className="text-xs text-gray-400">
                <strong>Chave / ID do Estabelecimento:</strong>
              </div>
              <div className="text-xs font-mono bg-black/40 px-2.5 py-1.5 rounded text-gray-300 truncate">
                {restaurant.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
