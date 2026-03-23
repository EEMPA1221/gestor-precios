import { PrismaClient, Role, ListStatus, IvaRate } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Usuarios
  const adminPass = await bcrypt.hash('admin123', 10)
  const opPass = await bcrypt.hash('op123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@empresa.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@empresa.com',
      password: adminPass,
      role: Role.ADMIN,
    },
  })

  const operador = await prisma.user.upsert({
    where: { email: 'maria@empresa.com' },
    update: {},
    create: {
      name: 'María López',
      email: 'maria@empresa.com',
      password: opPass,
      role: Role.OPERATOR,
    },
  })

  await prisma.user.upsert({
    where: { email: 'juan@empresa.com' },
    update: {},
    create: {
      name: 'Juan Pérez',
      email: 'juan@empresa.com',
      password: await bcrypt.hash('juan123', 10),
      role: Role.READONLY,
    },
  })

  // Proveedores
  const provA = await prisma.supplier.upsert({
    where: { id: 'prov-distribuidora-norte' },
    update: {},
    create: {
      id: 'prov-distribuidora-norte',
      name: 'Distribuidora del Norte',
      contact: 'Carlos Ruiz',
      phone: '011-4567-8901',
      email: 'ventas@distnorte.com',
      active: true,
    },
  })

  const provB = await prisma.supplier.upsert({
    where: { id: 'prov-comercial-sur' },
    update: {},
    create: {
      id: 'prov-comercial-sur',
      name: 'Comercial del Sur',
      contact: 'Ana Gómez',
      phone: '011-3456-7890',
      email: 'compras@comsur.com',
      active: true,
    },
  })

  await prisma.supplier.upsert({
    where: { id: 'prov-mayorista-central' },
    update: {},
    create: {
      id: 'prov-mayorista-central',
      name: 'Mayorista Central SA',
      contact: 'Roberto Díaz',
      phone: '011-2345-6789',
      active: true,
    },
  })

  // Productos maestros
  const productos = [
    { internalName: 'Coca-Cola 2.25L', category: 'Bebidas', brand: 'Coca-Cola', unit: 'unidad' },
    { internalName: 'Coca-Cola 500ml', category: 'Bebidas', brand: 'Coca-Cola', unit: 'unidad' },
    { internalName: 'Pepsi 2.25L', category: 'Bebidas', brand: 'Pepsi', unit: 'unidad' },
    { internalName: 'Agua Mineral 500ml', category: 'Bebidas', brand: 'Villavicencio', unit: 'unidad' },
    { internalName: 'Aceite Girasol 1L', category: 'Aceites', brand: 'Natura', unit: 'unidad' },
    { internalName: 'Harina Común 1kg', category: 'Almacén', brand: 'Pureza', unit: 'kg' },
    { internalName: 'Arroz Largo Fino 1kg', category: 'Almacén', brand: 'La Morenita', unit: 'kg' },
    { internalName: 'Fideos Spaghetti 500g', category: 'Pastas', brand: 'Knorr', unit: 'unidad' },
    { internalName: 'Leche Entera 1L', category: 'Lácteos', brand: 'La Serenísima', unit: 'litro' },
    { internalName: 'Yogur Natural 200g', category: 'Lácteos', brand: 'Ser', unit: 'unidad' },
    { internalName: 'Manteca 200g', category: 'Lácteos', brand: 'La Serenísima', unit: 'unidad' },
    { internalName: 'Queso Cremoso 400g', category: 'Lácteos', brand: 'Mendicrim', unit: 'unidad' },
  ]

  const masterProds: any[] = []
  for (const p of productos) {
    const mp = await prisma.masterProduct.upsert({
      where: { id: `master-${p.internalName.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `master-${p.internalName.toLowerCase().replace(/\s/g, '-')}`,
        ...p,
      },
    })
    masterProds.push(mp)
  }

  // Lista de precios - Proveedor A (mayo 2025)
  const listA1 = await prisma.priceList.create({
    data: {
      supplierId: provA.id,
      uploadedById: operador.id,
      listDate: new Date('2025-05-01'),
      fileName: 'distnorte_mayo2025.xlsx',
      status: ListStatus.ACTIVE,
      notes: 'Lista completa mayo 2025',
      items: {
        create: [
          { originalName: 'Coca Cola 2.25', masterProductId: masterProds[0].id, costPrice: 850, ivaRate: IvaRate.TWENTY_ONE, matched: true },
          { originalName: 'Coca Cola 500ml', masterProductId: masterProds[1].id, costPrice: 320, ivaRate: IvaRate.TWENTY_ONE, matched: true },
          { originalName: 'Pepsi 2.25L', masterProductId: masterProds[2].id, costPrice: 780, ivaRate: IvaRate.TWENTY_ONE, matched: true },
          { originalName: 'Agua Villa 500', masterProductId: masterProds[3].id, costPrice: 180, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Aceite Natura 1L', masterProductId: masterProds[4].id, costPrice: 1250, ivaRate: IvaRate.TEN_FIVE, matched: true },
          { originalName: 'Harina Pureza 1kg', masterProductId: masterProds[5].id, costPrice: 420, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Arroz La Morenita 1kg', masterProductId: masterProds[6].id, costPrice: 590, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Fideos Knorr 500g', masterProductId: masterProds[7].id, costPrice: 480, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Leche La Sere 1L', masterProductId: masterProds[8].id, costPrice: 520, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Yogur Ser 200g', masterProductId: masterProds[9].id, costPrice: 280, ivaRate: IvaRate.NONE, matched: true },
        ],
      },
    },
  })

  // Lista de precios - Proveedor A (junio 2025 - más reciente, con aumentos)
  await prisma.priceList.create({
    data: {
      supplierId: provA.id,
      uploadedById: operador.id,
      listDate: new Date('2025-06-01'),
      fileName: 'distnorte_junio2025.xlsx',
      status: ListStatus.ACTIVE,
      notes: 'Lista junio 2025 - actualización de precios',
      items: {
        create: [
          { originalName: 'Coca Cola 2.25', masterProductId: masterProds[0].id, costPrice: 940, ivaRate: IvaRate.TWENTY_ONE, matched: true },
          { originalName: 'Coca Cola 500ml', masterProductId: masterProds[1].id, costPrice: 355, ivaRate: IvaRate.TWENTY_ONE, matched: true },
          { originalName: 'Pepsi 2.25L', masterProductId: masterProds[2].id, costPrice: 820, ivaRate: IvaRate.TWENTY_ONE, matched: true },
          { originalName: 'Agua Villa 500', masterProductId: masterProds[3].id, costPrice: 180, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Aceite Natura 1L', masterProductId: masterProds[4].id, costPrice: 1420, ivaRate: IvaRate.TEN_FIVE, matched: true },
          { originalName: 'Harina Pureza 1kg', masterProductId: masterProds[5].id, costPrice: 460, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Arroz La Morenita 1kg', masterProductId: masterProds[6].id, costPrice: 620, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Fideos Knorr 500g', masterProductId: masterProds[7].id, costPrice: 510, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Leche La Sere 1L', masterProductId: masterProds[8].id, costPrice: 580, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Yogur Ser 200g', masterProductId: masterProds[9].id, costPrice: 295, ivaRate: IvaRate.NONE, matched: true },
        ],
      },
    },
  })

  // Lista Proveedor B
  await prisma.priceList.create({
    data: {
      supplierId: provB.id,
      uploadedById: admin.id,
      listDate: new Date('2025-06-01'),
      fileName: 'comsur_junio2025.xlsx',
      status: ListStatus.ACTIVE,
      items: {
        create: [
          { originalName: 'Coca-Cola 2250 ml', masterProductId: masterProds[0].id, costPrice: 910, ivaRate: IvaRate.TWENTY_ONE, matched: true },
          { originalName: 'Coca-Cola 500', masterProductId: masterProds[1].id, costPrice: 340, ivaRate: IvaRate.TWENTY_ONE, matched: true },
          { originalName: 'Pepsi 2L', masterProductId: masterProds[2].id, costPrice: 800, ivaRate: IvaRate.TWENTY_ONE, matched: true },
          { originalName: 'Agua 500cc', masterProductId: masterProds[3].id, costPrice: 175, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Aceite 1L', masterProductId: masterProds[4].id, costPrice: 1380, ivaRate: IvaRate.TEN_FIVE, matched: true },
          { originalName: 'Harina 1kg', masterProductId: masterProds[5].id, costPrice: 445, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Arroz 1kg', masterProductId: masterProds[6].id, costPrice: 600, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Fideos 500g', masterProductId: masterProds[7].id, costPrice: 495, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Leche 1L', masterProductId: masterProds[8].id, costPrice: 545, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Yogur 200g', masterProductId: masterProds[9].id, costPrice: 270, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Manteca 200g', masterProductId: masterProds[10].id, costPrice: 720, ivaRate: IvaRate.NONE, matched: true },
          { originalName: 'Queso Cremoso 400g', masterProductId: masterProds[11].id, costPrice: 1850, ivaRate: IvaRate.NONE, matched: true },
        ],
      },
    },
  })

  // Config por defecto
  const configs = [
    { key: 'default_margin', value: '35' },
    { key: 'default_iva', value: 'NONE' },
    { key: 'default_rounding', value: 'none' },
    { key: 'alert_increase_threshold', value: '15' },
    { key: 'categories', value: JSON.stringify(['Bebidas', 'Aceites', 'Almacén', 'Pastas', 'Lácteos', 'Limpieza', 'Fiambres', 'Verdulería']) },
  ]
  for (const c of configs) {
    await prisma.config.upsert({ where: { key: c.key }, update: { value: c.value }, create: c })
  }

  // Audit logs de ejemplo
  await prisma.auditLog.createMany({
    data: [
      { userId: operador.id, action: 'UPLOAD', entity: 'PriceList', detail: 'Subió lista: distnorte_junio2025.xlsx' },
      { userId: admin.id, action: 'CREATE', entity: 'Supplier', detail: 'Creó proveedor: Mayorista Central SA' },
      { userId: operador.id, action: 'MATCH', entity: 'ListItem', detail: 'Asoció "Coca-Cola 2250 ml" → Coca-Cola 2.25L' },
    ],
  })

  console.log('✅ Seed completado')
  console.log('👤 Admin: admin@empresa.com / admin123')
  console.log('👤 Operador: maria@empresa.com / op123')
  console.log('👤 Solo lectura: juan@empresa.com / juan123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
