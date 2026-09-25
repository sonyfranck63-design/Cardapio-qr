'use client'

import { useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Loader2, UtensilsCrossed, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MenuItem, Category } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import ItemFormModal from './ItemFormModal'
import { useRouter } from 'next/navigation'
import { revalidateMenuAction } from '@/app/actions/revalidate'

interface ItemsManagerProps {
  restaurantId: string
  restaurantSlug?: string
  categories: Category[]
  initialItems: MenuItem[]
}

export default function ItemsManager({ restaurantId, restaurantSlug, categories, initialItems }: ItemsManagerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const getCategoryName = (id: string) =>
    categories.find(c => c.id === id)?.name ?? '—'

  const filteredItems = filterCategory === 'all'
    ? items
    : items.filter(i => i.category_id === filterCategory)

  async function handleToggleActive(item: MenuItem) {
    setTogglingId(item.id)
    const newStatus = !item.is_active
    const { error } = await supabase
      .from('menu_items')
      .update({ is_active: newStatus })
      .eq('id', item.id)

    if (error) {
      toast.error('Erro ao atualizar status')
    } else {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: newStatus } : i))
      toast.success(newStatus ? 'Item ativado' : 'Item desativado')
      // Revalidação sob demanda imediata do cardápio público
      await revalidateMenuAction({ slug: restaurantSlug, restaurantId })
    }
    setTogglingId(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return

    setDeletingId(id)
    const { error } = await supabase.from('menu_items').delete().eq('id', id)

    if (error) {
      toast.error('Erro ao excluir item')
    } else {
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Item excluído')
      // Revalidação sob demanda imediata do cardápio público
      await revalidateMenuAction({ slug: restaurantSlug, restaurantId })
    }
    setDeletingId(null)
    router.refresh()
  }

  async function handleSaved(saved: MenuItem) {
    setItems(prev => {
      const exists = prev.find(i => i.id === saved.id)
      if (exists) return prev.map(i => i.id === saved.id ? saved : i)
      return [saved, ...prev]
    })
    setShowModal(false)
    setEditingItem(null)
    // Revalidação sob demanda imediata do cardápio público
    await revalidateMenuAction({ slug: restaurantSlug, restaurantId })
    router.refresh()
  }

  async function handleMoveItem(item: MenuItem, direction: 'up' | 'down') {
    const categoryItems = items
      .filter(i => i.category_id === item.category_id)
      .sort((a, b) => a.order - b.order)

    const currentIndex = categoryItems.findIndex(i => i.id === item.id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= categoryItems.length) return

    const targetItem = categoryItems[targetIndex]
    const currentOrder = item.order
    const targetOrder = targetItem.order

    setItems(prev =>
      prev.map(i => {
        if (i.id === item.id) return { ...i, order: targetOrder }
        if (i.id === targetItem.id) return { ...i, order: currentOrder }
        return i
      })
    )

    try {
      await Promise.all([
        supabase.from('menu_items').update({ order: targetOrder }).eq('id', item.id),
        supabase.from('menu_items').update({ order: currentOrder }).eq('id', targetItem.id),
      ])
      revalidateMenuAction({ slug: restaurantSlug, restaurantId })
    } catch {
      toast.error('Erro ao reordenar item')
      setItems(items)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        {/* Category filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-1 px-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
              filterCategory === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            Todos ({items.length})
          </button>
          {categories.map(cat => {
            const count = items.filter(i => i.category_id === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                  filterCategory === cat.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>

        <button
          onClick={() => { setEditingItem(null); setShowModal(true) }}
          className="btn-primary !text-white font-bold shrink-0 w-full sm:w-auto justify-center flex items-center gap-2 py-2.5 px-4 shadow-sm"
        >
          <Plus className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />
          <span className="text-white font-bold">Novo prato</span>
        </button>
      </div>

      {/* Items table */}
      <div className="admin-card overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mb-4 text-stone-400">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <p className="text-stone-700 font-semibold">Nenhum prato nesta categoria</p>
            <p className="text-xs text-stone-500 mt-1 mb-5">Adicione itens para que seus clientes possam visualizar.</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-xs"
            >
              <Plus className="w-4 h-4" />
              Adicionar prato
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-200">
            {filteredItems.map(item => {
              const categoryItems = items
                .filter(i => i.category_id === item.category_id)
                .sort((a, b) => a.order - b.order)
              const isFirst = categoryItems[0]?.id === item.id
              const isLast = categoryItems[categoryItems.length - 1]?.id === item.id

              return (
              <div key={item.id} className={`flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-stone-50 transition-colors group ${!item.is_active ? 'opacity-60' : ''}`}>
                {/* Botões de reordenação do item */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveItem(item, 'up')}
                    disabled={isFirst}
                    aria-label={`Mover ${item.name} para cima`}
                    className="p-1 rounded text-stone-400 hover:text-stone-900 hover:bg-stone-200 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveItem(item, 'down')}
                    disabled={isLast}
                    aria-label={`Mover ${item.name} para baixo`}
                    className="p-1 rounded text-stone-400 hover:text-stone-900 hover:bg-stone-200 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Image */}
                <div className="w-12 h-12 bg-stone-100 rounded-xl overflow-hidden shrink-0 border border-stone-200 relative">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      width={48}
                      height={48}
                      sizes="48px"
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <UtensilsCrossed className="w-5 h-5 opacity-60" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-stone-500 font-medium">{getCategoryName(item.category_id)}</span>
                    <span className="text-xs text-stone-300">·</span>
                    <span className="text-xs font-bold text-orange-800 tabular-nums">{formatCurrency(item.price)}</span>
                  </div>
                </div>

                {/* Status badge */}
                <span className={`hidden sm:flex ${item.is_active ? 'badge-active' : 'badge-inactive'}`}>
                  {item.is_active ? 'Ativo' : 'Inativo'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {/* Toggle active */}
                  <button
                    onClick={() => handleToggleActive(item)}
                    disabled={togglingId === item.id}
                    title={item.is_active ? 'Desativar' : 'Ativar'}
                    className={`p-2 rounded-lg transition-colors ${
                      item.is_active
                        ? 'text-stone-400 hover:text-amber-700 hover:bg-amber-50'
                        : 'text-stone-400 hover:text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {togglingId === item.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                    }
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => { setEditingItem(item); setShowModal(true) }}
                    title="Editar"
                    className="p-2 text-stone-400 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    title="Excluir"
                    className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {deletingId === item.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            )
          })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ItemFormModal
          restaurantId={restaurantId}
          categories={categories}
          item={editingItem}
          onClose={() => { setShowModal(false); setEditingItem(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
