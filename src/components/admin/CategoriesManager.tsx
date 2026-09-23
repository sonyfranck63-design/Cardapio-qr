'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Loader2, Tag, GripVertical, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types/database'
import { useRouter } from 'next/navigation'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Máximo 50 caracteres'),
})
type CategoryForm = z.infer<typeof categorySchema>

interface CategoriesManagerProps {
  restaurantId: string
  initialCategories: Category[]
}

export default function CategoriesManager({ restaurantId, initialCategories }: CategoriesManagerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  })

  async function handleAdd(data: CategoryForm) {
    const { data: created, error } = await supabase
      .from('categories')
      .insert({
        restaurant_id: restaurantId,
        name: data.name,
        order: categories.length,
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao criar categoria')
      return
    }

    setCategories(prev => [...prev, created])
    reset()
    toast.success('Categoria criada!')
    router.refresh()
  }

  async function handleEdit(id: string) {
    if (!editName.trim()) return

    const { error } = await supabase
      .from('categories')
      .update({ name: editName.trim() })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao editar categoria')
      return
    }

    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c))
    setEditingId(null)
    toast.success('Categoria atualizada!')
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)

    // Verificar se há itens nessa categoria
    const { count } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if ((count ?? 0) > 0) {
      toast.error('Remova os itens desta categoria antes de excluí-la')
      setDeletingId(null)
      return
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (error) {
      toast.error('Erro ao excluir categoria')
      setDeletingId(null)
      return
    }

    setCategories(prev => prev.filter(c => c.id !== id))
    toast.success('Categoria excluída')
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="admin-card p-6">
        <h2 className="text-base font-semibold text-white mb-4">Nova categoria</h2>
        <form onSubmit={handleSubmit(handleAdd)} className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Ex: Bebidas, Pratos, Sobremesas..."
              className="input-field"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-shrink-0">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </button>
        </form>
      </div>

      {/* List */}
      <div className="admin-card overflow-hidden">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <Tag className="w-7 h-7 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">Nenhuma categoria ainda</p>
            <p className="text-sm text-gray-600 mt-1">Crie sua primeira categoria acima</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {categories.map((cat, idx) => (
              <li key={cat.id} className="flex items-center gap-3 px-5 py-4 hover:bg-white/2 transition-colors group">
                <GripVertical className="w-4 h-4 text-gray-700 group-hover:text-gray-500 flex-shrink-0 cursor-grab" />

                <div className="w-7 h-7 bg-brand-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-brand-400">{idx + 1}</span>
                </div>

                {editingId === cat.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleEdit(cat.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="input-field py-1.5 text-sm flex-1"
                      autoFocus
                    />
                    <button onClick={() => handleEdit(cat.id)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-500 hover:bg-white/5 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-200">{cat.name}</span>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingId(cat.id); setEditName(cat.name) }}
                        className="p-2 text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deletingId === cat.id}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        {deletingId === cat.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
