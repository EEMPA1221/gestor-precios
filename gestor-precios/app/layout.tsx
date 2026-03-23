import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Gestor de Precios',
  description: 'Gestión de listas de precios y comparación de proveedores',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
