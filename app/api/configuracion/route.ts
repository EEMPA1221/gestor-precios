import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configs = await prisma.config.findMany()
  const result: Record<string, string> = {}
  for (const c of configs) result[c.key] = c.value
  return NextResponse.json(result)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  const body = await req.json()
  for (const [key, value] of Object.entries(body)) {
    await prisma.config.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  }

  await logAction(session.user!.id!, 'UPDATE', 'Config', undefined, 'Actualizó configuración del sistema')
  return NextResponse.json({ ok: true })
}
