'use client'

import Link from 'next/link'
import { ArrowLeftRight, TrendingUp, ArrowRight } from 'lucide-react'

export default function ComparacionesPage() {
  return (
    <div className="animate-in">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Comparaciones</h1>
        <p style={{ color: 'hsl(220 15% 45%)', fontSize: '0.875rem', marginTop: 2 }}>
          Elegí el tipo de comparación que querés hacer
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', maxWidth: 800 }}>
        <Link href="/comparaciones/proveedores" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            border: '1px solid hsl(220 15% 88%)',
            borderRadius: 14,
            padding: '1.75rem',
            cursor: 'pointer',
            transition: 'box-shadow 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'
            el.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.boxShadow = 'none'
            el.style.transform = 'none'
          }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'hsl(221 89% 94%)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
            }}>
              <ArrowLeftRight size={22} color="hsl(221 89% 45%)" />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Comparar proveedores
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'hsl(220 15% 45%)', lineHeight: 1.6, marginBottom: '1rem' }}>
              Elegí 2 o 3 proveedores y compará sus precios producto a producto. Identificá el más conveniente en cada caso.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'hsl(221 89% 50%)', fontSize: '0.875rem', fontWeight: 500 }}>
              Ir a comparar <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        <Link href="/comparaciones/cambios" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            border: '1px solid hsl(220 15% 88%)',
            borderRadius: 14,
            padding: '1.75rem',
            cursor: 'pointer',
            transition: 'box-shadow 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'
            el.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.boxShadow = 'none'
            el.style.transform = 'none'
          }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'hsl(37 91% 93%)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
            }}>
              <TrendingUp size={22} color="hsl(37 91% 38%)" />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Ver cambios de precios
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'hsl(220 15% 45%)', lineHeight: 1.6, marginBottom: '1rem' }}>
              Comparar una lista nueva contra una anterior del mismo proveedor. Identificá subas, bajas y alertas de aumentos importantes.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'hsl(37 91% 35%)', fontSize: '0.875rem', fontWeight: 500 }}>
              Ver aumentos <ArrowRight size={14} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
