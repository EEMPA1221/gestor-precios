import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const sheet = workbook.worksheets[0]
    const items: any[] = []

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // saltar encabezado

      const codigo = row.getCell(1).value?.toString().trim() || ''
      const producto = row.getCell(2).value?.toString().trim() || ''
      const presentacion = row.getCell(3).value?.toString().trim() || ''
      const precioRaw = row.getCell(4).value
      const ivaRaw = row.getCell(5).value?.toString().trim().toUpperCase() || 'NONE'

      // Saltar filas vacías o de notas
      if (!producto || producto.startsWith('←') || producto.startsWith('Valores')) return

      const precio = typeof precioRaw === 'number'
        ? precioRaw
        : parseFloat(String(precioRaw).replace(/[^0-9.,]/g, '').replace(',', '.'))

      if (isNaN(precio) || precio <= 0) return

      const ivaValido = ['NONE', 'TEN_FIVE', 'TWENTY_ONE'].includes(ivaRaw) ? ivaRaw : 'NONE'

      items.push({
        originalName: producto,
        costPrice: precio,
        code: codigo || undefined,
        presentation: presentacion || undefined,
        ivaRate: ivaValido,
        isDuplicate: false,
        hasError: false,
      })
    })

    // Detectar duplicados
    const seen = new Set<string>()
    const result = items.map(item => {
      const key = `${item.originalName.toLowerCase()}-${item.costPrice}`
      const isDuplicate = seen.has(key)
      seen.add(key)
      return { ...item, isDuplicate }
    })

    return NextResponse.json({ items: result })
  } catch (error) {
    console.error('Error procesando Excel:', error)
    return NextResponse.json({ error: 'Error al procesar el Excel' }, { status: 500 })
  }
}
