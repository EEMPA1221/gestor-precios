import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { priceLists: true } },
    },
  })

  return NextResponse.json(suppliers)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  if (role === 'READONLY') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, contact, phone, email, notes } = body

  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  const supplier = await prisma.supplier.create({
    data: { name: name.trim(), contact, phone, email, notes },
  })

  await logAction(session.user!.id!, 'CREATE', 'Supplier', supplier.id, `Creó proveedor: ${supplier.name}`)

  return NextResponse.json(supplier, { status: 201 })
}
