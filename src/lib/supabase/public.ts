import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

let publicClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

/**
 * Cliente Supabase Estático e Anônimo para Rotas Públicas.
 * 
 * NÃO consome cookies nem cabeçalhos dinâmicos do Next.js.
 * Permite que rotas como `/[slug]` executem ISR (Incremental Static Regeneration)
 * e mantenham cache estático eficiente no servidor sem serem forçadas para SSR dinâmico.
 */
export function getPublicSupabaseClient() {
  if (publicClient) return publicClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  publicClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return publicClient
}
