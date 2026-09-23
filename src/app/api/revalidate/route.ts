import { NextRequest, NextResponse } from 'next/server'
import { revalidateMenuAction } from '@/app/actions/revalidate'

export const dynamic = 'force-dynamic'

/**
 * Route Handler para revalidação de cache via requisição HTTP POST.
 * Exemplo de corpo JSON:
 * { "slug": "meu-restaurante" } ou { "restaurantId": "uuid" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { slug, restaurantId } = body

    if (!slug && !restaurantId) {
      return NextResponse.json(
        { error: 'Forneça ao menos "slug" ou "restaurantId" para revalidar.' },
        { status: 400 }
      )
    }

    const result = await revalidateMenuAction({ slug, restaurantId })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      revalidated: true,
      data: result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar revalidação.' },
      { status: 500 }
    )
  }
}
