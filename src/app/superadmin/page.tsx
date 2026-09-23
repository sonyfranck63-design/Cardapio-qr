'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Restaurant } from '@/types/database'
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Store,
  ShieldAlert,
  Calendar,
  Layers
} from 'lucide-react'
import toast from 'react-hot-toast'
import { PLAN_PRICE } from '@/lib/plans'

export default function SuperAdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'expired'>('all')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const supabase = createClient()

  const loadRestaurants = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Erro ao carregar restaurantes: ' + error.message)
      } else {
        setRestaurants(data || [])
      }
    } catch (err: any) {
      toast.error('Erro de conexão ao buscar estabelecimentos.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadRestaurants()
  }, [loadRestaurants])

  async function handleSubscriptionAction(restaurantId: string, action: 'extend_30' | 'extend_7' | 'suspend') {
    try {
      setActionLoadingId(restaurantId)
      const res = await fetch(`/api/superadmin/restaurants/${restaurantId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      toast.success(data.message)
      // Atualiza o estado local imediatamente
      if (data.restaurant) {
        setRestaurants(prev =>
          prev.map(r =>
            r.id === restaurantId
              ? {
                  ...r,
                  subscription_status: data.restaurant.subscription_status,
                  subscription_expires_at: data.restaurant.subscription_expires_at,
                }
              : r
          )
        )
      } else {
        await loadRestaurants()
      }
    } catch (err: any) {
      toast.error('Erro ao processar ação.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Cálculos de métricas
  const now = new Date()

  const enrichedRestaurants = restaurants.map(r => {
    const expiresDate = r.subscription_expires_at ? new Date(r.subscription_expires_at) : new Date(0)
    const diffTime = expiresDate.getTime() - now.getTime()
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const isExpired = diffTime <= 0
    const isActive = r.subscription_status === 'active' && !isExpired
    const isTrial = r.subscription_status === 'trial' && !isExpired

    return {
      ...r,
      expiresDate,
      daysRemaining,
      isExpired,
      isActive,
      isTrial,
    }
  })

  const totalCount = enrichedRestaurants.length
  const activeCount = enrichedRestaurants.filter(r => r.isActive).length
  const trialCount = enrichedRestaurants.filter(r => r.isTrial).length
  const expiredCount = enrichedRestaurants.filter(r => r.isExpired).length
  const monthlyRevenue = activeCount * PLAN_PRICE

  // Filtros
  const filteredRestaurants = enrichedRestaurants.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.slug.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (statusFilter === 'active') return r.isActive
    if (statusFilter === 'trial') return r.isTrial
    if (statusFilter === 'expired') return r.isExpired
    return true
  })

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Painel Geral do SaaS
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Visão centralizada de todos os restaurantes parceiros e controle de mensalidades.
          </p>
        </div>

        <button
          onClick={loadRestaurants}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold text-gray-200 border border-white/10 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* MRR */}
        <div className="glass-card p-5 border-l-4 border-l-brand-500 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Faturamento Estimado</span>
            <DollarSign className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            <span className="text-xs font-normal text-gray-400">/mês</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Baseado em {activeCount} {activeCount === 1 ? 'assinante ativo' : 'assinantes ativos'}
          </p>
        </div>

        {/* Total Estabelecimentos */}
        <div className="glass-card p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Cadastrados</span>
            <Store className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalCount}</div>
          <p className="text-[11px] text-gray-400 mt-1">Bares e restaurantes criados</p>
        </div>

        {/* Ativos */}
        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Assinaturas Ativas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
          <p className="text-[11px] text-gray-400 mt-1">Planos pagos e vigentes</p>
        </div>

        {/* Trial */}
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Em Degustação (Trial)</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{trialCount}</div>
          <p className="text-[11px] text-gray-400 mt-1">Período de teste de 7 dias</p>
        </div>

        {/* Vencidos */}
        <div className="glass-card p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Suspensos / Vencidos</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{expiredCount}</div>
          <p className="text-[11px] text-gray-400 mt-1">Necessitam regularização</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou slug..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field pl-10 text-sm py-2"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Ativos ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('trial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'trial'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Trial ({trialCount})
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'expired'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Suspensos ({expiredCount})
          </button>
        </div>
      </div>

      {/* Restaurants Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-400">
          <Store className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-base font-semibold text-white">Nenhum restaurante encontrado</p>
          <p className="text-xs text-gray-500 mt-1">
            {searchTerm ? 'Tente buscar com outro termo.' : 'Ainda não há restaurantes cadastrados com esse filtro.'}
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Estabelecimento</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Validade / Expiração</th>
                  <th className="py-3.5 px-4">Criado em</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Ações Manuais (Master)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRestaurants.map(r => {
                  const isActionLoading = actionLoadingId === r.id

                  return (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name & Slug */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold shrink-0">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-base truncate flex items-center gap-2">
                              {r.name}
                              <Link
                                href={`/${r.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-brand-400 transition-colors"
                                title="Ver Cardápio Público do Cliente"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                            <div className="text-xs text-gray-500 font-mono truncate mt-0.5">
                              /{r.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {r.isActive && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Ativo (Pago)
                          </span>
                        )}
                        {r.isTrial && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Sparkles className="w-3 h-3" />
                            Trial ({r.daysRemaining} {r.daysRemaining === 1 ? 'dia' : 'dias'})
                          </span>
                        )}
                        {r.isExpired && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertCircle className="w-3 h-3" />
                            Suspenso (Vencido)
                          </span>
                        )}
                      </td>

                      {/* Expiration */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>{r.expiresDate.toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {r.isExpired ? (
                            <span className="text-red-400">Venceu há {Math.abs(r.daysRemaining)} dias</span>
                          ) : (
                            <span>Resta {r.daysRemaining} {r.daysRemaining === 1 ? 'dia' : 'dias'}</span>
                          )}
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-400">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* +30 Dias (Renovar Manualmente) */}
                          <button
                            onClick={() => handleSubscriptionAction(r.id, 'extend_30')}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                            title="Ativar ou estender por +30 dias (usado para pagamentos no Pix direto ou Dinheiro)"
                          >
                            {isActionLoading ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <PlusCircle className="w-3 h-3" />
                            )}
                            <span>+30 Dias</span>
                          </button>

                          {/* +7 Dias Trial */}
                          <button
                            onClick={() => handleSubscriptionAction(r.id, 'extend_7')}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                            title="Estender teste grátis por +7 dias"
                          >
                            <span>+7 Dias</span>
                          </button>

                          {/* Suspender */}
                          {!r.isExpired && (
                            <button
                              onClick={() => handleSubscriptionAction(r.id, 'suspend')}
                              disabled={isActionLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                              title="Suspender cardápio imediatamente"
                            >
                              <span>Suspender</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
