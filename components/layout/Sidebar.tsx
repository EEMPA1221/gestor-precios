'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Truck,
  FileSpreadsheet,
  ArrowLeftRight,
  Calculator,
  History,
  Users,
  Settings,
  TrendingUp,
} from 'lucide-react'
import type { UserRole } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard',        label: 'Dashboard',      icon: <LayoutDashboard size={18} /> },
  { href: '/proveedores',      label: 'Proveedores',    icon: <Truck size={18} /> },
  { href: '/listas',           label: 'Listas de precios', icon: <FileSpreadsheet size={18} /> },
  { href: '/comparaciones',    label: 'Comparaciones',  icon: <ArrowLeftRight size={18} /> },
  { href: '/simulador',        label: 'Simulador',      icon: <Calculator size={18} /> },
 { href: '/historial',        label: 'Historial',      icon: <History size={18} /> },
  { href: '/importar',         label: 'Importar PDF',   icon: <Upload size={18} /> },
  { href: '/usuarios',         label: 'Usuarios',       icon: <Users size={18} />, adminOnly: true },
  { href: '/configuracion',    label: 'Configuración',  icon: <Settings size={18} />, adminOnly: true },
]

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()

  const visible = navItems.filter(item => !item.adminOnly || role === 'ADMIN')

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: 'hsl(222 47% 11%)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            background: 'hsl(221 89% 54%)',
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <TrendingUp size={18} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2 }}>
              Gestor
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>
              de Precios
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem', overflowY: 'auto' }}>
        {visible.map(item => {
          const active = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: active ? 500 : 400,
                color: active ? 'white' : 'rgba(255,255,255,0.55)',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Role badge */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '3px 9px',
          borderRadius: 999,
          fontSize: '0.72rem',
          fontWeight: 500,
          background: role === 'ADMIN'
            ? 'rgba(59,130,246,0.2)'
            : role === 'OPERATOR'
            ? 'rgba(34,197,94,0.15)'
            : 'rgba(255,255,255,0.1)',
          color: role === 'ADMIN'
            ? 'hsl(221 89% 75%)'
            : role === 'OPERATOR'
            ? 'hsl(142 71% 70%)'
            : 'rgba(255,255,255,0.5)',
        }}>
          {role === 'ADMIN' ? 'Administrador' : role === 'OPERATOR' ? 'Operador' : 'Solo lectura'}
        </div>
      </div>
    </aside>
  )
}
