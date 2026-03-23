import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar role={(session.user as any).role} />
      <div style={{
        flex: 1,
        marginLeft: 'var(--sidebar-width)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Header user={session.user!} />
        <main style={{
          flex: 1,
          padding: '1.5rem 2rem',
          maxWidth: 1400,
          width: '100%',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
