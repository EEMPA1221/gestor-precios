import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: {
      priceLists: {
        orderBy: { listDate: 'desc' },
        include: {
          uploadedBy: { select: { name: true } },
          _count: { select: { items: true } },
        },
      },
    },
  })

  if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(supplier)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  if (role === 'READONLY') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const supplier = await prisma.supplier.update({
    where: { id: params.id },
    data: {
      name: body.name,
      contact: body.contact,
      phone: body.phone,
      email: body.email,
      notes: body.notes,
      active: body.active,
    },
  })

  await logAction(session.user!.id!, 'UPDATE', 'Supplier', supplier.id, `Editó proveedor: ${supplier.name}`)
  return NextResponse.json(supplier)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  const supplier = await prisma.supplier.delete({ where: { id: params.id } })
  await logAction(session.user!.id!, 'DELETE', 'Supplier', params.id, `Eliminó proveedor: ${supplier.name}`)
  return NextResponse.json({ ok: true })
}
