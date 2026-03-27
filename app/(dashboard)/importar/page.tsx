'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, AlertCircle, Trash2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Supplier { id: string; name: string }
interface ParsedItem {
  originalName: string
  costPrice: number
  code?: string
  presentation?: string
  ivaRate: 'NONE' | 'TEN_FIVE' | 'TWENTY_ONE'
  isDuplicate?: boolean
  hasError?: boolean
}

export default function ImportarPDFPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [listDate, setListDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [items, setItems] = useState<ParsedItem[]>([])
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'upload' | 'rawtext' | 'preview'>('upload')

  useEffect(() => {
    fetch('/api/proveedores')
      .then(r => r.json())
      .then(setSuppliers)
  }, [])

  async function handleProcess() {
    if (!file || !supplierId || !listDate) {
      setError('Completá todos los campos')
      return
    }
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const isExcel = file.name.endsWith('.xlsx')
      const endpoint = isExcel ? '/api/import-excel' : '/api/import-pdf'
      const res = await fetch(endpoint, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRawText(data.rawText || '')
      setItems(data.items.map((item: ParsedItem) => ({
        ...item,
        hasError: !item.originalName || item.costPrice <= 0
      })))
      if (isExcel) {
        setStep('preview')
      } else {
        setStep('rawtext')
      }
    } catch (e: any) {
      setError(e.message || 'Error al procesar el archivo')
    } finally {
      setLoading(false)
    }
  }

  function updateItem(index: number, field: keyof ParsedItem, value: any) {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value, hasError: !item.originalName || Number(item.costPrice) <= 0 } : item
    ))
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function addItem() {
    setItems(prev => [...prev, { originalName: '', costPrice: 0, ivaRate: 'NONE', hasError: true }])
  }

  async function handleSave() {
    const valid = items.filter(i => !i.hasError && i.originalName && i.costPrice > 0)
    if (valid.length === 0) { setError('No hay items válidos para guardar'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/listas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, listDate, fileName: file?.name, i
