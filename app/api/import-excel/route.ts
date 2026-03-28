import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

// Extrae el valor de texto de una celda independientemente del formato
function getCellText(value: any): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  // Rich text: { richText: [{ text: '...' }, ...] }
  if (typeof value === 'object' && value.richText) {
    return value.richText.map((r: any) => r.text ?? '').join('').trim()
  }
  // Formula result
  if (typeof value === 'object' && value.result !== undefined) {
    return getCellText(value.result)
  }
  return String(value).trim()
}

function getCellNumber(value: any): number {
  if (value === null || value === undefined) return NaN
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value.result !== undefined) return getCellNumber(value.result)
  const str = getCellText(value).replace(/[^0-9.,]/g, '').replace(',', '.')
  return parseFloat(str)
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (role === 'READONLY') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    const supplierId = formData.get('supplierId') as string
    const listDate = formData.get('listDate') as string

    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    if (!supplierId) return NextResponse.json({ error: 'Proveedor requerido' }, { status: 400 })
    if (!listDate) return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })

    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } })
    if (!supplier) return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const sheet = workbook.worksheets[0]
    const items: any[] = []
    const errores: string[] = []

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // saltar encabezado

      const producto = getCellText(row.getCell(2).value)
      const presentacion = getCellText(row.getCell(3).value)
      const ivaRaw = getCellText(row.getCell(5).value).toUpperCase()

      // Saltar filas vacías o de notas
      if (!producto || producto.startsWith('←') || producto.startsWith('Reemplaz')) return

      const precio = getCellNumber(row.getCell(4).value)

      if (isNaN(precio) || precio <= 0) {
        errores.push(`Fila ${rowNumber}: precio inválido para "${producto}"`)
        return
      }

      const ivaValido = ['NONE', 'TEN_FIVE', 'TWENTY_ONE'].includes(ivaRaw) ? ivaRaw : 'NONE'

      items.push({
        originalName: producto,
        costPrice: precio,
        presentation: presentacion || undefined,
        ivaRate: ivaValido,
        matched: false,
      })
    })

    if (items.length === 0) {
      return NextResponse.json({ error: 'No se encontraron productos válidos en el archivo' }, { status: 400 })
    }

    // Deduplicar por nombre normalizado
    const seen = new Set<string>()
    const itemsUnicos = items.filter(item => {
      const key = item.originalName.toLowerCase().trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Crear lista con todos los items en una sola transacción
    const lista = await prisma.priceList.create({
      data: {
        supplierId,
        uploadedById: session.user!.id!,
        listDate: new Date(listDate),
        fileName: file.name,
        status: 'PENDING',
        items: {
          create: itemsUnicos.map(item => ({
            originalName: item.originalName,
            costPrice: item.costPrice,
            presentation: item.presentation,
            ivaRate: item.ivaRate,
            matched: false,
          })),
        },
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
      lista.id,
      `Importó Excel: ${file.name} (${supplier.name}) - ${itemsUnicos.length} productos`
    )

    return NextResponse.json({
      success: true,
      listId: lista.id,
      proveedor: supplier.name,
      productosImportados: itemsUnicos.length,
      errores,
      duplicadosOmitidos: items.length - itemsUnicos.length,
    }, { status: 201 })

  } catch (error) {
    console.error('Error procesando Excel:', error)
    return NextResponse.json({ error: 'Error al procesar el Excel' }, { status: 500 })
  }
    }
