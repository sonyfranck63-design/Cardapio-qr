import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdminUser } from '@/lib/superadmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ isSuperAdmin: false }, { status: 200 })
    }

    const isSuperAdmin = isSuperAdminUser(user)
    return NextResponse.json({ isSuperAdmin }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ isSuperAdmin: false }, { status: 200 })
  }
}
