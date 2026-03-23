import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcFinalPrice } from '@/lib/calculos'
import type { IvaRate, RoundingMode } from '@/types'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    itemIds,
    margins = [30, 35, 40, 45],
    ivaOverride,
    roundingMode = 'none',
  }: {
    itemIds: string[]
    margins: number[]
    ivaOverride?: IvaRate
    roundingMode: RoundingMode
  } = body

  if (!itemIds?.length) {
    return NextResponse.json({ error: 'Seleccioná al menos un producto' }, { status: 400 })
  }

  const items = await prisma.listItem.findMany({
    where: { id: { in: itemIds } },
    include: { masterProduct: true },
  })

  const rows = items.map(item => {
    const cost = Number(item.costPrice)
    const iva = ivaOverride ?? item.ivaRate as IvaRate
    const pricesByMargin = margins.map(m => {
      const { withMargin, withIva, rounded } = calcFinalPrice(cost, m, iva, roundingMode)
      return { margin: m, withMargin, withIva, rounded }
    })

    return {
      id: item.id,
      originalName: item.originalName,
      internalName: item.masterProduct?.internalName ?? item.originalName,
      category: item.masterProduct?.category,
      costPrice: cost,
      ivaRate: iva,
      pricesByMargin,
    }
  })

  return NextResponse.json(rows)
}
