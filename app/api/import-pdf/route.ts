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
  
  const priceRegex = /\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/
  const codeRegex = /^([A-Z0-9]{3,10})\s/

  for (const line of lines) {
    if (line.length < 3) continue
    if (/^(producto|descripcion|precio|codigo|cant|total)/i.test(line)) continue

    const priceMatch = line.match(priceRegex)
    if (!priceMatch) continue

    const rawPrice = priceMatch[1].replace(/\./g, '').replace(',', '.')
    const price = parseFloat(rawPrice)
    if (isNaN(price) || price <= 0) continue

    const priceIndex = line.indexOf(priceMatch[0])
    let name = line.substring(0, priceIndex).trim()
    
    let code: string | undefined
    const codeMatch = name.match(codeRegex)
    if (codeMatch) {
      code = codeMatch[1]
      name = name.substring(code.length).trim()
    }

    name = name.replace(/\s+/g, ' ').trim()
    if (name.length < 2) continue

    items.push({
      originalName: name,
      costPrice: price,
      code,
      ivaRate: 'NONE',
    })
  }

  const seen = new Set<string>()
  return items.map(item => {
    const key = `${item.originalName.toLowerCase()}-${item.costPrice}`
    const isDuplicate = seen.has(key)
    seen.add(key)
    return { ...item, isDuplicate }
  })
                        }
