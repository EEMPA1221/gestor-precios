import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const list = await prisma.priceList.findUnique({
    where: { id: params.id },
    include: {
      supplier: true,
      uploadedBy: { select: { id: true, name: true, email: true } },
      items: {
        include: { masterProduct: true },
        orderBy: { originalName: 'asc' },
      },
    },
  })

  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(list)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  if (role === 'READONLY') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Operators can't archive or delete
  if (role === 'OPERATOR' && body.status === 'ARCHIVED') {
    return NextResponse.json({ error: 'Sin permiso para archivar' }, { status: 403 })
  }

  const list = await prisma.priceList.update({
    where: { id: params.id },
    data: {
      status: body.status,
      notes: body.notes,
    },
  })

  await logAction(session.user!.id!, 'UPDATE', 'PriceList', list.id, `Actualizó lista: ${list.status}`)
  return NextResponse.json(list)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores pueden eliminar listas' }, { status: 403 })
  }

  await prisma.priceList.delete({ where: { id: params.id } })
  await logAction(session.user!.id!, 'DELETE', 'PriceList', params.id, 'Eliminó lista de precios')
  return NextResponse.json({ ok: true })
}
