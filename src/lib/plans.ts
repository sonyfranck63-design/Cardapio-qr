/**
 * Definições e constantes de planos do SaaS CardápioQR.
 */

export const PLAN_PRICE = 49.90

export const RESERVED_SLUGS = [
  'admin',
  'api',
  'auth',
  'demo',
  'superadmin',
  'login',
  'register',
  'sitemap',
  'robots',
  '_next',
  'app',
  'checkout',
  'termos',
  'privacidade',
  'public',
  'static',
  'dashboard',
] as const

/**
 * Formata um valor numérico em Real Brasileiro (BRL).
 */
export function formatPlanPrice(price: number = PLAN_PRICE): string {
  return price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
