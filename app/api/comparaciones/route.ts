import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcPctChange } from '@/lib/calculos'

// GET ?lists=id1,id2,id3  → supplier comparison
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const listIds = (searchParams.get('lists') ?? '').split(',').filter(Boolean)

  if (listIds.length < 2) {
    return NextResponse.json({ error: 'Se necesitan al menos 2 listas' }, { status: 400 })
  }

  const lists = await prisma.priceList.findMany({
    where: { id: { in: listIds } },
    include: {
      supplier: { select: { name: true } },
      items: {
        where: { matched: true },
        include: { masterProduct: true },
      },
    },
  })

  const productMap = new Map<string, any>()

  for (const list of lists) {
    for (const item of list.items) {
      if (!item.masterProductId) continue
      if (!productMap.has(item.masterProductId)) {
        productMap.set(item.masterProductId, {
          masterProductId: item.masterProductId,
          internalName: item.masterProduct?.internalName ?? item.originalName,
          category: item.masterProduct?.category ?? null,
          brand: item.masterProduct?.brand ?? null,
          prices: {},
        })
      }
      productMap.get(item.masterProductId).prices[list.id] = Number(item.costPrice)
    }
  }

  const rows = Array.from(productMap.values()).map(row => {
    const priceValues = Object.values(row.prices).filter(Boolean) as number[]
    const bestPrice = priceValues.length ? Math.min(...priceValues) : null
    const worstPrice = priceValues.length ? Math.max(...priceValues) : null
    const bestListId = bestPrice !== null
      ? Object.entries(row.prices).find(([, v]) => v === bestPrice)?.[0] ?? null
      : null
    return { ...row, bestPrice, worstPrice, bestListId }
  })

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, listIds }: { type: 'suppliers' | 'versions'; listIds: string[] } = body

  if (!listIds || listIds.length < 2) {
    return NextResponse.json({ error: 'Se necesitan al menos 2 listas' }, { status: 400 })
  }

  // Fetch all items for selected lists
  const lists = await prisma.priceList.findMany({
    where: { id: { in: listIds } },
    include: {
      supplier: { select: { name: true } },
      items: {
        where: { matched: true },
        include: { masterProduct: true },
      },
    },
  })

  if (type === 'suppliers') {
    // Group by master product, compare across lists
    const productMap = new Map<string, any>()

    for (const list of lists) {
      for (const item of list.items) {
        if (!item.masterProductId) continue
        if (!productMap.has(item.masterProductId)) {
          productMap.set(item.masterProductId, {
            masterProductId: item.masterProductId,
            internalName: item.masterProduct?.internalName ?? item.originalName,
            category: item.masterProduct?.category,
            brand: item.masterProduct?.brand,
            prices: {},
          })
        }
        productMap.get(item.masterProductId).prices[list.id] = Number(item.costPrice)
      }
    }

    const rows = Array.from(productMap.values()).map(row => {
      const priceValues = Object.values(row.prices).filter(Boolean) as number[]
      const bestPrice = priceValues.length ? Math.min(...priceValues) : null
      const worstPrice = priceValues.length ? Math.max(...priceValues) : null
      const bestListId = bestPrice !== null
        ? Object.entries(row.prices).find(([, v]) => v === bestPrice)?.[0] ?? null
        : null

      return { ...row, bestPrice, worstPrice, bestListId }
    })

    return NextResponse.json({
      type: 'suppliers',
      lists: lists.map(l => ({ id: l.id, supplierName: l.supplier?.name, listDate: l.listDate })),
      rows,
    })
  }

  // type === 'versions': compare 2 lists of same supplier
  if (listIds.length !== 2) {
    return NextResponse.json({ error: 'La comparación de versiones necesita exactamente 2 listas' }, { status: 400 })
  }

  const [oldList, newList] = lists.sort(
    (a, b) => new Date(a.listDate).getTime() - new Date(b.listDate).getTime()
  )

  const oldPrices = new Map(
    oldList.items.map(i => [i.masterProductId, { price: Number(i.costPrice), name: i.originalName }])
  )
  const newPrices = new Map(
    newList.items.map(i => [i.masterProductId, { price: Number(i.costPrice), name: i.originalName }])
  )

  const rows: any[] = []
  for (const [mpId, newData] of newPrices) {
    const oldData = oldPrices.get(mpId)
    if (!oldData) continue
    const diff = newData.price - oldData.price
    const pct = calcPctChange(oldData.price, newData.price)
    rows.push({
      masterProductId: mpId,
      internalName: newList.items.find(i => i.masterProductId === mpId)?.masterProduct?.internalName ?? newData.name,
      originalName: newData.name,
      oldPrice: oldData.price,
      newPrice: newData.price,
      diff,
      pctChange: pct,
      status: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
    })
  }

  return NextResponse.json({
    type: 'versions',
    oldList: { id: oldList.id, date: oldList.listDate },
    newList: { id: newList.id, date: newList.listDate },
    supplierName: oldList.supplier?.name,
    rows,
  })
}
