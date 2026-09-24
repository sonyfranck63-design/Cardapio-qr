/**
 * Utilitário de normalização de e-mails para prevenção de abuso de contas de teste (trial).
 *
 * Regras:
 * 1. Converte todo o e-mail para minúsculas e remove espaços nas pontas.
 * 2. Em provedores como Gmail / Googlemail:
 *    - Remove pontos do nome de usuário (ex: 'joao.silva' -> 'joaosilva')
 *    - Remove aliases com '+' (ex: 'joao.silva+restaurante@gmail.com' -> 'joaosilva@gmail.com')
 * 3. Em outros provedores:
 *    - Remove aliases com '+' (ex: 'contato+promo@empresa.com' -> 'contato@empresa.com')
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return ''

  const trimmed = email.trim().toLowerCase()
  const atIndex = trimmed.lastIndexOf('@')

  if (atIndex === -1) return trimmed

  let localPart = trimmed.slice(0, atIndex)
  let domain = trimmed.slice(atIndex + 1)

  // Normaliza o domínio do Google
  if (domain === 'googlemail.com') {
    domain = 'gmail.com'
  }

  // Remove alias '+' em qualquer provedor
  const plusIndex = localPart.indexOf('+')
  if (plusIndex !== -1) {
    localPart = localPart.slice(0, plusIndex)
  }

  // Se for Gmail, remove todos os pontos do nome de usuário
  if (domain === 'gmail.com') {
    localPart = localPart.replace(/\./g, '')
  }

  return `${localPart}@${domain}`
}
