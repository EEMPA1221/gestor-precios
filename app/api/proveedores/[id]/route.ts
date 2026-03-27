import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: {
      priceLists: {
        orderBy: { listDate: 'desc' },
        include: {
          _count: { select: { items: true } },
        },
      },
      _count: { select: { priceLists: true } },
    },
  })

  if (!supplier) {
    return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 })
  }

  return NextResponse.json(supplier)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  if (role === 'READONLY') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, contact, phone, email, notes, active } = body

  const supplier = await prisma.supplier.update({
    where: { id: params.id },
    data: { name, contact, phone, email, notes, active },
  })

  return NextResponse.json(supplier)
}
