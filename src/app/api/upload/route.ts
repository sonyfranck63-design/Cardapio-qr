import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerAuthClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // 1. Verifica autenticação do usuário na sessão atual
    const authClient = createServerAuthClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado. Faça login novamente.' }, { status: 401 })
    }

    // 2. Extrai dados do formulário multipart
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const restaurantId = formData.get('restaurantId') as string | null
    const type = (formData.get('type') as string | null) || 'item'

    if (!file || !restaurantId) {
      return NextResponse.json(
        { error: 'Arquivo e ID do restaurante são obrigatórios.' },
        { status: 400 }
      )
    }

    // 3. Validação de tamanho (máximo 5MB)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'O arquivo excede o limite máximo permitido de 5MB.' },
        { status: 400 }
      )
    }

    // 4. Validação de propriedade: o restaurante pertence ao usuário logado?
    const { data: restaurant, error: restError } = await authClient
      .from('restaurants')
      .select('id, user_id')
      .eq('id', restaurantId)
      .single()

    if (restError || !restaurant || restaurant.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Permissão negada. Você não é proprietário deste estabelecimento.' },
        { status: 403 }
      )
    }

    // 5. Inicializa cliente administrativo Supabase (service_role)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[Upload API] Chaves de ambiente do Supabase não configuradas')
      return NextResponse.json(
        { error: 'Serviço de upload indisponível no momento.' },
        { status: 500 }
      )
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // 6. Define o caminho do arquivo com base no tipo
    let filePath: string
    if (type === 'logo') {
      filePath = `${restaurantId}/logo.webp`
    } else if (type === 'cover') {
      filePath = `${restaurantId}/cover.webp`
    } else {
      filePath = `${restaurantId}/items/${Date.now()}.webp`
    }

    // 7. Converte File para Buffer e executa upload seguro
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminClient.storage
      .from('restaurant-assets')
      .upload(filePath, buffer, {
        upsert: true,
        contentType: file.type || 'image/webp',
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('[Upload API] Falha no storage:', uploadError)
      return NextResponse.json(
        { error: `Erro no servidor de armazenamento: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 8. Recupera URL pública
    const { data: { publicUrl } } = adminClient.storage
      .from('restaurant-assets')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      publicUrl,
      path: filePath,
    })
  } catch (error: any) {
    console.error('[Upload API] Exceção não tratada:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro inesperado durante o upload.' },
      { status: 500 }
    )
  }
}
