import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    totalSuppliers,
    totalLists,
    totalProducts,
    unmatchedItems,
    recentLists,
    recentActivity,
  ] = await Promise.all([
    prisma.supplier.count({ where: { active: true } }),
    prisma.priceList.count({ where: { status: { not: 'ARCHIVED' } } }),
    prisma.masterProduct.count(),
    prisma.listItem.count({ where: { matched: false } }),
    prisma.priceList.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { name: true } },
        uploadedBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
  ])

  return NextResponse.json({
    totalSuppliers,
    totalLists,
    totalProducts,
    unmatchedItems,
    recentLists,
    recentActivity,
  })
}
