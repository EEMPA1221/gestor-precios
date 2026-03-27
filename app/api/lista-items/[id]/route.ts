import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  if (role === 'READONLY') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { costPrice, originalName } = body

  if (costPrice !== undefined && (isNaN(costPrice) || costPrice <= 0)) {
    return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
  }

  const item = await prisma.listItem.update({
    where: { id: params.id },
    data: {
      ...(costPrice !== undefined && { costPrice }),
      ...(originalName !== undefined && { originalName }),
    },
  })

  await logAction(
    session.user!.id!,
    'UPDATE',
    'ListItem',
    item.id,
    `Editó precio de "${item.originalName}" → $${costPrice}`
  )

  return NextResponse.json(item)
}
