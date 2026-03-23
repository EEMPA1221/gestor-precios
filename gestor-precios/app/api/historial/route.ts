import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = 50
  const skip = (page - 1) * pageSize

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ])

  return NextResponse.json({ logs, total, page, pageSize })
}
