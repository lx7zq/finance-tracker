import type { Category } from '@/types'
import { CATEGORY_LABELS } from '@/types'

export const CHART_COLORS: string[] = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#e879f9', // fuchsia
  '#14b8a6', // teal
  '#fb923c', // orange
  '#84cc16', // lime
  '#3b82f6', // blue
]

export interface CategorySeries {
  labels: string[]
  values: number[]
  colors: string[]
}

export function buildCategorySeries(expenses: Partial<Record<Category, number>>): CategorySeries {
  const entries = Object.entries(expenses)
    .map(([category, value]) => ({ category: category as Category, value: value ?? 0 }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)

  return {
    labels: entries.map((entry) => CATEGORY_LABELS[entry.category] ?? entry.category),
    values: entries.map((entry) => entry.value),
    colors: entries.map((_, index) => CHART_COLORS[index % CHART_COLORS.length] ?? '#94a3b8'),
  }
}
