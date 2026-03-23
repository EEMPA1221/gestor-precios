import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logAction } from '@/lib/audit'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  const body = await req.json()
  const { name, email, password, role } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: role ?? 'OPERATOR' },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  })

  await logAction(session.user!.id!, 'CREATE', 'User', user.id, `Creó usuario: ${user.name} (${user.role})`)
  return NextResponse.json(user, { status: 201 })
}
