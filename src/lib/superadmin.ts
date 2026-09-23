import { User } from '@supabase/supabase-js'

/**
 * Valida com segurança se um determinado e-mail ou usuário pertence à lista de Super Administradores.
 * NÃO utiliza e-mails hardcoded de fallback.
 * Depende exclusivamente da variável de ambiente de servidor `SUPERADMIN_EMAILS`.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const adminEmailsEnv = process.env.SUPERADMIN_EMAILS
  if (!adminEmailsEnv || !adminEmailsEnv.trim()) {
    return false
  }

  const allowedEmails = adminEmailsEnv
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  return allowedEmails.includes(email.trim().toLowerCase())
}

export function isSuperAdminUser(user?: User | null): boolean {
  if (!user || !user.email) return false
  return isSuperAdminEmail(user.email)
}
