import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Validação rigorosa contra vulnerabilidades de Open Redirect.
 * Permite somente rotas relativas internas seguras.
 */
function getSafeNextPath(path: string | null): string {
  if (!path) return '/admin'
  
  // Deve começar com '/', não pode ter '//', '/\', '@' ou barras invertidas
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.startsWith('/\\') ||
    path.includes('@') ||
    path.includes('\\')
  ) {
    return '/admin'
  }

  return path
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Se houver erro ou ausência de código, redireciona para login com mensagem
  return NextResponse.redirect(`${origin}/auth/login?error=email-verification-failed`)
}
