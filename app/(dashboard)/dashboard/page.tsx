import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Truck, FileSpreadsheet, Package, AlertTriangle,
  ArrowLeftRight, Calculator, TrendingUp, TrendingDown,
  Clock, ChevronRight,
} from 'lucide-react'
import { formatPrice } from '@/lib/calculos'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  REVIEWING: 'En revisión',
  ACTIVE: 'Activa',
  ARCHIVED: 'Archivada',
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'badge badge-warning',
  REVIEWING: 'badge badge-info',
  ACTIVE: 'badge badge-success',
  ARCHIVED: 'badge badge-neutral',
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [
    totalSuppliers,
    totalLists,
    totalProducts,
    unmatchedItems,
    recentLists,
    recentActivity,
  ] = await Promise.all([
    prisma.supplier.count({ where: { active: true } }),
    prisma.priceList.count({ where: { status: { not: 'ARCHIVED' } } }),
    prisma.masterProduct.count(),
    prisma.listItem.count({ where: { matched: false } }),
    prisma.priceList.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { name: true } },
        uploadedBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
  ])

  const stats = [
    {
      label: 'Proveedores activos',
      value: totalSuppliers,
      icon: <Truck size={20} />,
      color: 'hsl(221 89% 54%)',
      bg: 'hsl(221 89% 96%)',
      href: '/proveedores',
    },
    {
      label: 'Listas cargadas',
      value: totalLists,
      icon: <FileSpreadsheet size={20} />,
      color: 'hsl(142 71% 40%)',
      bg: 'hsl(142 71% 95%)',
      href: '/listas',
    },
    {
      label: 'Productos unificados',
      value: totalProducts,
      icon: <Package size={20} />,
      color: 'hsl(262 80% 55%)',
      bg: 'hsl(262 80% 96%)',
      href: '/listas',
    },
    {
      label: 'Sin coincidencia',
      value: unmatchedItems,
      icon: <AlertTriangle size={20} />,
      color: unmatchedItems > 0 ? 'hsl(37 91% 45%)' : 'hsl(142 71% 40%)',
      bg: unmatchedItems > 0 ? 'hsl(37 91% 95%)' : 'hsl(142 71% 95%)',
      href: '/listas',
    },
  ]

  const quickActions = [
    { label: 'Nueva lista', icon: <FileSpreadsheet size={16} />, href: '/listas/nueva', desc: 'Subir lista de proveedor' },
    { label: 'Comparar proveedores', icon: <ArrowLeftRight size={16} />, href: '/comparaciones/proveedores', desc: 'Ver comparativa de precios' },
    { label: 'Simulador', icon: <Calculator size={16} />, href: '/simulador', desc: 'Calcular precios de venta' },
  ]

  return (
    <div className="animate-in">
      {/* Greeting */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'hsl(220 25% 10%)' }}>
          Buen día, {(session.user as any).name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'hsl(220 15% 45%)', marginTop: 4, fontSize: '0.9rem' }}>
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              border: '1px solid hsl(220 15% 88%)',
              borderRadius: 12,
              padding: '1.25rem',
              transition: 'box-shadow 0.15s, transform 0.15s',
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9,
                  background: stat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                }}>
                  {stat.icon}
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(220 25% 10%)', lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'hsl(220 15% 50%)', marginTop: 6 }}>
                {stat.label}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{
        background: 'white',
        border: '1px solid hsl(220 15% 88%)',
        borderRadius: 12,
        padding: '1.25rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(220 25% 15%)' }}>
          Accesos rápidos
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {quickActions.map(action => (
            <Link key={action.label} href={action.href} style={{ textDecoration: 'none', flex: '1 1 180px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                border: '1px solid hsl(220 15% 88%)',
                borderRadius: 9,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: 'hsl(220 15% 98%)',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'hsl(221 89% 54%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  {action.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(220 25% 15%)' }}>
                    {action.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(220 10% 55%)' }}>
                    {action.desc}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two columns: Recent lists + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Recent lists */}
        <div style={{
          background: 'white',
          border: '1px solid hsl(220 15% 88%)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid hsl(220 15% 92%)',
          }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'hsl(220 25% 15%)' }}>
              Listas recientes
            </h2>
            <Link href="/listas" style={{
              fontSize: '0.8rem',
              color: 'hsl(221 89% 50%)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}>
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
          <div>
            {recentLists.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'hsl(220 10% 60%)', fontSize: '0.875rem' }}>
                No hay listas cargadas aún
              </p>
            ) : (
              recentLists.map((list, i) => (
                <Link key={list.id} href={`/listas/${list.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 1.25rem',
                    borderBottom: i < recentLists.length - 1 ? '1px solid hsl(220 15% 94%)' : 'none',
                    transition: 'background 0.1s',
                    cursor: 'pointer',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(220 25% 15%)' }}>
                        {(list as any).supplier?.name}
                      </div>
                      <div style={{ fontSize: '0.77rem', color: 'hsl(220 10% 55%)', marginTop: 2 }}>
                        {format(new Date(list.listDate), 'dd/MM/yyyy')} · {(list as any)._count?.items ?? 0} productos · {(list as any).uploadedBy?.name}
                      </div>
                    </div>
                    <span className={STATUS_CLASS[list.status] || 'badge badge-neutral'}>
                      {STATUS_LABELS[list.status] ?? list.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Activity log */}
        <div style={{
          background: 'white',
          border: '1px solid hsl(220 15% 88%)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid hsl(220 15% 92%)',
          }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'hsl(220 25% 15%)' }}>
              Actividad reciente
            </h2>
            <Link href="/historial" style={{
              fontSize: '0.8rem',
              color: 'hsl(221 89% 50%)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}>
              Ver todo <ChevronRight size={14} />
            </Link>
          </div>
          <div>
            {recentActivity.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'hsl(220 10% 60%)', fontSize: '0.875rem' }}>
                Sin actividad registrada
              </p>
            ) : (
              recentActivity.map((log, i) => (
                <div key={log.id} style={{
                  display: 'flex',
                  gap: 10,
                  padding: '11px 1.25rem',
                  borderBottom: i < recentActivity.length - 1 ? '1px solid hsl(220 15% 94%)' : 'none',
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'hsl(220 15% 93%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    <Clock size={13} color="hsl(220 10% 50%)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.82rem', color: 'hsl(220 25% 15%)', lineHeight: 1.4 }}>
                      <strong>{(log as any).user?.name}</strong> · {log.detail}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(220 10% 60%)', marginTop: 2 }}>
                      {format(new Date(log.createdAt), "dd/MM/yyyy 'a las' HH:mm")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
