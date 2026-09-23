'use client'

import { useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Loader2, UtensilsCrossed, Eye, EyeOff } from 'lucide-react'
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
      revalidateMenuAction({ slug: restaurantSlug, restaurantId })
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
      revalidateMenuAction({ slug: restaurantSlug, restaurantId })
    }
    setDeletingId(null)
    router.refresh()
  }

  function handleSaved(saved: MenuItem) {
    setItems(prev => {
      const exists = prev.find(i => i.id === saved.id)
      if (exists) return prev.map(i => i.id === saved.id ? saved : i)
      return [saved, ...prev]
    })
    setShowModal(false)
    setEditingItem(null)
    // Revalidação sob demanda imediata do cardápio público
    revalidateMenuAction({ slug: restaurantSlug, restaurantId })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filterCategory === 'all'
                ? 'bg-brand-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filterCategory === cat.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>

        <button
          onClick={() => { setEditingItem(null); setShowModal(true) }}
          className="btn-primary flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo item
        </button>
      </div>

      {/* Items table */}
      <div className="admin-card overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-7 h-7 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">Nenhum item ainda</p>
            <p className="text-sm text-gray-600 mt-1 mb-5">Adicione o primeiro item ao seu cardápio</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Adicionar item
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredItems.map(item => (
              <div key={item.id} className={`flex items-center gap-4 px-4 py-3 hover:bg-white/2 transition-colors group ${!item.is_active ? 'opacity-60' : ''}`}>
                {/* Image */}
                <div className="w-12 h-12 bg-white/5 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{getCategoryName(item.category_id)}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs font-semibold text-brand-400">{formatCurrency(item.price)}</span>
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
                        ? 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10'
                        : 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10'
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
                    className="p-2 text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    title="Excluir"
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    {deletingId === item.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            ))}
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
