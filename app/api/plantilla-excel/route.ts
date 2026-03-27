import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET() {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Lista de Precios')

  sheet.columns = [
    { header: 'Codigo', key: 'codigo', width: 12 },
    { header: 'Producto', key: 'producto', width: 50 },
    { header: 'Presentacion', key: 'presentacion', width: 20 },
    { header: 'Precio', key: 'precio', width: 15 },
    { header: 'IVA', key: 'iva', width: 12 },
  ]

  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
    cell.alignment = { horizontal: 'center' }
  })

  sheet.addRow({
    codigo: '02266',
    producto: 'ACEITE CAÑUELAS GIRASOL',
    presentacion: '12X1500CC',
    precio: 4525.55,
    iva: 'NONE',
  })

  sheet.getCell('A3').value = 'Reemplazá la fila de ejemplo con tus
