import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    
    const items = parsePdfText(data.text)
    
    return NextResponse.json({ items, rawText: data.text })
  } catch (error) {
    console.error('Error procesando PDF:', error)
    return NextResponse.json({ error: 'Error al procesar el PDF' }, { status: 500 })
  }
}

interface ParsedItem {
  originalName: string
  costPrice: number
  code?: string
  presentation?: string
  ivaRate: 'NONE' | 'TEN_FIVE' | 'TWENTY_ONE'
  isDuplicate?: boolean
}

function parsePdfText(text: string): ParsedItem[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const items: ParsedItem[] = []

  // Precio: número con punto de miles y coma decimal, precedido por $ opcional
  // Ej: $3.544,47 o 3.544,47 o $11.212,34
  const priceRegex = /\$\s*(\d{1,3}(?:\.\d{3})+,\d{2}|\d+,\d{2})/

  for (const line of lines) {
    if (line.length < 3) continue
    // Saltar encabezados
    if (/^(producto|descripcion|precio|codigo|cant|total|6\s*c\/iva)/i.test(line)) continue

    const priceMatch = line.match(priceRegex)
    if (!priceMatch) continue

    // Convertir precio: quitar puntos de miles, reemplazar coma por punto
    const rawPrice = priceMatch[1].replace(/\./g, '').replace(',', '.')
    const price = parseFloat(rawPrice)
    if (isNaN(price) || price <= 0) continue

    // El nombre es todo lo que está antes del precio
    const priceIndex = line.indexOf(priceMatch[0])
    let name = line.substring(0, priceIndex).trim()

    // Limpiar nombre
    name = name.replace(/\s+/g, ' ').trim()
    if (name.length < 2) continue

    // Intentar extraer presentación del nombre (ej: 12X1500CC, 4x5LTS, 6x250cc)
    const presentationRegex = /\b(\d+[Xx]\d+(?:CC|ML|LT|LTS|KG|GR|G|L|U|UN)|\d+(?:CC|ML|LT|LTS|KG|GR|G|L|U|UN))\b/i
    const presentationMatch = name.match(presentationRegex)
    let presentation: string | undefined
    if (presentationMatch) {
      presentation = presentationMatch[0].toUpperCase()
    }

    items.push({
      originalName: name,
      costPrice: price,
      presentation,
      ivaRate: 'NONE',
    })
  }

  // Detectar duplicados
  const seen = new Set<string>()
  return items.map(item => {
    const key = `${item.originalName.toLowerCase()}-${item.costPrice}`
    const isDuplicate = seen.has(key)
    seen.add(key)
    return { ...item, isDuplicate }
  })
}
