'use client'

import { signOut } from 'next-auth/react'
import { LogOut, ChevronDown, User } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  user: { name?: string | null; email?: string | null }
}

export default function Header({ user }: HeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'white',
      borderBottom: '1px solid hsl(220 15% 88%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            border: '1px solid hsl(220 15% 88%)',
            borderRadius: 9,
            background: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'hsl(220 25% 20%)',
            fontFamily: 'inherit',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(220 15% 97%)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'hsl(221 89% 94%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <User size={15} color="hsl(221 89% 40%)" />
          </div>
          <span style={{ fontWeight: 500 }}>{user.name}</span>
          <ChevronDown size={14} color="hsl(220 10% 55%)" />
        </button>

        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'white',
            border: '1px solid hsl(220 15% 88%)',
            borderRadius: 10,
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            minWidth: 200,
            overflow: 'hidden',
            zIndex: 100,
          }}>
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid hsl(220 15% 92%)',
            }}>
              <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{user.name}</p>
              <p style={{ fontSize: '0.8rem', color: 'hsl(220 10% 55%)', marginTop: 2 }}>{user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'hsl(0 84% 45%)',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(0 84% 97%)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 39 }}
          onClick={() => setOpen(false)}
        />
      )}
    </header>
  )
}
