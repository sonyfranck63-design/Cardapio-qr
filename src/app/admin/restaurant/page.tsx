import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RestaurantSettingsForm from '@/components/admin/RestaurantSettingsForm'
import { Settings } from 'lucide-react'

export const metadata = { title: 'Configurações' }

export default async function RestaurantPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!restaurant) redirect('/auth/register')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-500/15 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-sm text-gray-400">Personalize as informações do seu restaurante</p>
        </div>
      </div>

      <RestaurantSettingsForm restaurant={restaurant} />
    </div>
  )
}
