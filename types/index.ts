export type UserRole = 'ADMIN' | 'OPERATOR' | 'READONLY'
export type ListStatus = 'PENDING' | 'REVIEWING' | 'ACTIVE' | 'ARCHIVED'
export type IvaRate = 'NONE' | 'TEN_FIVE' | 'TWENTY_ONE'
export type RoundingMode = 'none' | '10' | '50' | '100' | '90' | '99'
export type ComparisonType = 'suppliers' | 'versions'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  createdAt: Date
}

export interface Supplier {
  id: string
  name: string
  contact?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
  active: boolean
  createdAt: Date
  _count?: { priceLists: number }
}

export interface PriceList {
  id: string
  supplierId: string
  uploadedById: string
  listDate: Date
  fileName?: string | null
  fileUrl?: string | null
  status: ListStatus
  notes?: string | null
  createdAt: Date
  supplier?: Supplier
  uploadedBy?: User
  _count?: { items: number }
}

export interface MasterProduct {
  id: string
  internalName: string
  category?: string | null
  brand?: string | null
  unit?: string | null
  code?: string | null
}

export interface ListItem {
  id: string
  listId: string
  masterProductId?: string | null
  originalName: string
  presentation?: string | null
  costPrice: number
  ivaRate: IvaRate
  notes?: string | null
  matched: boolean
  masterProduct?: MasterProduct | null
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  entity: string
  entityId?: string | null
  detail?: string | null
  createdAt: Date
  user?: User
}

// Simulador
export interface SimulatorRow {
  id: string
  name: string
  costPrice: number
  ivaRate: IvaRate
  margins: number[]
  prices: number[]
  priceWithIva: number
  priceRounded: number
}

export interface SimulatorConfig {
  margins: number[]
  ivaRate: IvaRate
  roundingMode: RoundingMode
}

// Comparación
export interface ComparisonRow {
  masterProductId: string
  internalName: string
  category?: string | null
  brand?: string | null
  prices: Record<string, number | null>  // listId → price
  bestPrice: number | null
  bestListId: string | null
  worstPrice: number | null
}

export interface VersionComparisonRow {
  masterProductId: string
  internalName: string
  originalName: string
  oldPrice: number
  newPrice: number
  diff: number
  pctChange: number
  status: 'up' | 'down' | 'same'
}

// Dashboard
export interface DashboardStats {
  totalSuppliers: number
  totalLists: number
  totalProducts: number
  unmatchedItems: number
  recentLists: PriceList[]
  recentActivity: AuditLog[]
}
