'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Restaurant } from '@/types/database'
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  DollarSign,
  Store,
  Calendar,
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
    } catch {
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
    } catch {
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
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight">
            Painel Geral do SaaS
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Visão centralizada de todos os restaurantes parceiros e controle de mensalidades.
          </p>
        </div>

        <button
          onClick={loadRestaurants}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-xs sm:text-sm font-semibold text-stone-800 border border-stone-300 shadow-2xs transition-colors self-start sm:self-auto active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : 'text-stone-500'}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* MRR */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-bold text-stone-500">Faturamento Estimado</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-stone-950 tabular-nums">
              {monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              <span className="text-xs font-semibold text-stone-400 ml-1">/mês</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5">
              Baseado em {activeCount} {activeCount === 1 ? 'assinante ativo' : 'assinantes ativos'}
            </p>
          </div>
        </div>

        {/* Total Estabelecimentos */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-bold text-stone-500">Total Cadastrados</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-stone-950 tabular-nums">{totalCount}</div>
            <p className="text-[11px] text-stone-500 mt-1.5">Bares e restaurantes criados</p>
          </div>
        </div>

        {/* Ativos */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-bold text-stone-500">Assinaturas Ativas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 tabular-nums">{activeCount}</div>
            <p className="text-[11px] text-emerald-800 font-medium mt-1.5">Planos pagos e vigentes</p>
          </div>
        </div>

        {/* Trial */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-bold text-stone-500">Em Degustação (Trial)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 tabular-nums">{trialCount}</div>
            <p className="text-[11px] text-amber-800 font-medium mt-1.5">Período de teste de 7 dias</p>
          </div>
        </div>

        {/* Vencidos */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-bold text-stone-500">Suspensos / Vencidos</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-red-700 tabular-nums">{expiredCount}</div>
            <p className="text-[11px] text-red-800 font-medium mt-1.5">Necessitam regularização</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou slug..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:border-orange-600 focus:bg-white transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-stone-100/90 p-1 rounded-xl w-full md:w-auto overflow-x-auto border border-stone-200/60">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-orange-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950 font-medium'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950 font-medium'
            }`}
          >
            Ativos ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('trial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'trial'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950 font-medium'
            }`}
          >
            Trial ({trialCount})
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'expired'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-950 font-medium'
            }`}
          >
            Suspensos ({expiredCount})
          </button>
        </div>
      </div>

      {/* Restaurants Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-stone-200">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="bg-white p-12 text-center text-stone-500 rounded-2xl border border-stone-200 shadow-2xs">
          <Store className="w-12 h-12 mx-auto mb-3 text-stone-400" />
          <p className="text-base font-bold text-stone-900">Nenhum restaurante encontrado</p>
          <p className="text-xs text-stone-500 mt-1">
            {searchTerm ? 'Tente buscar com outro termo.' : 'Ainda não há restaurantes cadastrados com esse filtro.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs font-bold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Estabelecimento</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Validade / Expiração</th>
                  <th className="py-3.5 px-4">Criado em</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Ações Manuais (Master)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRestaurants.map(r => {
                  const isActionLoading = actionLoadingId === r.id

                  return (
                    <tr key={r.id} className="hover:bg-orange-50/20 transition-colors">
                      {/* Name & Slug */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-900 font-extrabold shrink-0 shadow-2xs">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-stone-950 text-sm sm:text-base truncate flex items-center gap-2">
                              <span>{r.name}</span>
                              <Link
                                href={`/${r.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-stone-400 hover:text-orange-700 transition-colors"
                                title="Ver Cardápio Público do Cliente"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                            <div className="text-xs text-stone-400 font-mono truncate mt-0.5">
                              /{r.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {r.isActive && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Ativo (Pago)
                          </span>
                        )}
                        {r.isTrial && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            Trial ({r.daysRemaining} {r.daysRemaining === 1 ? 'dia' : 'dias'})
                          </span>
                        )}
                        {r.isExpired && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                            Suspenso (Vencido)
                          </span>
                        )}
                      </td>

                      {/* Expiration */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-stone-800 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{r.expiresDate.toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {r.isExpired ? (
                            <span className="text-red-600 font-medium">Venceu há {Math.abs(r.daysRemaining)} dias</span>
                          ) : (
                            <span>Resta {r.daysRemaining} {r.daysRemaining === 1 ? 'dia' : 'dias'}</span>
                          )}
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-stone-600 font-medium">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* +30 Dias (Renovar Manualmente) */}
                          <button
                            onClick={() => handleSubscriptionAction(r.id, 'extend_30')}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-2xs"
                            title="Ativar ou estender por +30 dias (usado para pagamentos no Pix direto ou Dinheiro)"
                          >
                            {isActionLoading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>+30 Dias</span>
                          </button>

                          {/* +7 Dias Trial */}
                          <button
                            onClick={() => handleSubscriptionAction(r.id, 'extend_7')}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-2xs"
                            title="Estender teste grátis por +7 dias"
                          >
                            <span>+7 Dias</span>
                          </button>

                          {/* Suspender */}
                          {!r.isExpired && (
                            <button
                              onClick={() => handleSubscriptionAction(r.id, 'suspend')}
                              disabled={isActionLoading}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-all disabled:opacity-50 active:scale-95"
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
