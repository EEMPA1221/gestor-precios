import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const supplierId = searchParams.get('supplierId')
  const status = searchParams.get('status')

  const where: any = {}
  if (supplierId) where.supplierId = supplierId
  if (status) where.status = status

  const lists = await prisma.priceList.findMany({
    where,
    orderBy: { listDate: 'desc' },
    include: {
      supplier: { select: { name: true } },
      uploadedBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
  })

  return NextResponse.json(lists)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  if (role === 'READONLY') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { supplierId, listDate, fileName, fileUrl, notes, items } = body

  if (!supplierId || !listDate) {
    return NextResponse.json({ error: 'Proveedor y fecha son requeridos' }, { status: 400 })
  }

  const list = await prisma.priceList.create({
    data: {
      supplierId,
      uploadedById: session.user!.id!,
      listDate: new Date(listDate),
      fileName,
      fileUrl,
      notes,
      status: 'PENDING',
      items: items ? { create: items } : undefined,
    },
    include: {
      supplier: { select: { name: true } },
      _count: { select: { items: true } },
    },
  })

  await logAction(
    session.user!.id!,
    'UPLOAD',
    'PriceList',
    list.id,
    `Subió lista: ${fileName ?? 'sin archivo'} (${(list as any).supplier?.name})`
  )

  return NextResponse.json(list, { status: 201 })
}
