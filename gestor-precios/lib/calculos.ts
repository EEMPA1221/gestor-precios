import type { IvaRate, RoundingMode } from '@/types'

export const IVA_VALUES: Record<IvaRate, number> = {
  NONE: 0,
  TEN_FIVE: 0.105,
  TWENTY_ONE: 0.21,
}

export const IVA_LABELS: Record<IvaRate, string> = {
  NONE: 'Sin IVA',
  TEN_FIVE: 'IVA 10.5%',
  TWENTY_ONE: 'IVA 21%',
}

export const ROUNDING_LABELS: Record<RoundingMode, string> = {
  none: 'Sin redondeo',
  '10': 'Múltiplo de 10',
  '50': 'Múltiplo de 50',
  '100': 'Múltiplo de 100',
  '90': 'Terminar en 90',
  '99': 'Terminar en 99',
}

/**
 * Calcula precio con margen
 * precio = costo × (1 + margen)
 */
export function applyMargin(cost: number, marginPct: number): number {
  return cost * (1 + marginPct / 100)
}

/**
 * Calcula precio con IVA
 * precio = base × (1 + iva)
 */
export function applyIva(base: number, ivaRate: IvaRate): number {
  return base * (1 + IVA_VALUES[ivaRate])
}

/**
 * Calcula precio final: costo → margen → IVA → redondeo
 */
export function calcFinalPrice(
  cost: number,
  marginPct: number,
  ivaRate: IvaRate,
  roundingMode: RoundingMode
): {
  withMargin: number
  withIva: number
  rounded: number
} {
  const withMargin = applyMargin(cost, marginPct)
  const withIva = applyIva(withMargin, ivaRate)
  const rounded = roundPrice(withIva, roundingMode)
  return { withMargin, withIva, rounded }
}

/**
 * Redondeo comercial
 */
export function roundPrice(value: number, mode: RoundingMode): number {
  if (mode === 'none') return Math.round(value * 100) / 100

  if (mode === '10') return Math.ceil(value / 10) * 10
  if (mode === '50') return Math.ceil(value / 50) * 50
  if (mode === '100') return Math.ceil(value / 100) * 100

  if (mode === '90') {
    const base = Math.ceil(value / 100) * 100
    return value <= base - 10 ? base - 10 : base + 90
  }

  if (mode === '99') {
    const base = Math.ceil(value / 100) * 100
    return value <= base - 1 ? base - 1 : base + 99
  }

  return value
}

/**
 * Calcula variación porcentual entre dos precios
 */
export function calcPctChange(oldPrice: number, newPrice: number): number {
  if (oldPrice === 0) return 0
  return ((newPrice - oldPrice) / oldPrice) * 100
}

/**
 * Formatea precio en pesos argentinos
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formatea porcentaje
 */
export function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}
