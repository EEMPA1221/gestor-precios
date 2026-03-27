import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET() {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Lista de Precios')

  // Encabezados
  sheet.columns = [
    { header: 'Codigo', key: 'codigo', width: 12 },
    { header: 'Producto', key: 'producto', width: 50 },
    { header: 'Presentacion', key: 'presentacion', width: 20 },
    { header: 'Precio', key: 'precio', width: 15 },
    { header: 'IVA', key: 'iva', width: 12 },
  ]

  // Estilo encabezados
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
    cell.alignment = { horizontal: 'center' }
  })

  // Fila de ejemplo
  sheet.addRow({
    codigo: '02266',
    producto: 'ACEITE CAÑUELAS GIRASOL',
    presentacion: '12X1500CC',
    precio: 4525.55,
    iva: 'NONE',
  })

  // Nota en la fila 3
  sheet.getCell('A3').value = '← Reemplazá la fila de ejemplo con tus productos'
  sheet.getCell('A3').font = { italic: true, color: { argb: 'FF888888' } }

  // Nota IVA en la fila 4
  sheet.getCell('A4').value = 'Valores válidos para IVA: NONE | TEN_FIVE | TWENTY_ONE'
  sheet.getCell('A4').font = { italic: true, color: { argb: 'FF888888' } }

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-lista-precios.xlsx"',
    },
  })
}
```

---

### Archivo 2: API para procesar Excel

Abrí este link y creá el archivo:
```
https://github.com/EEMPA1221/gestor-precios/new/main/app/api/import-excel
