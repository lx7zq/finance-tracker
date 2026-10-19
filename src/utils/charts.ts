import dayjs from 'dayjs'

import type { Category, Transaction } from '@/types'
import { CATEGORY_LABELS } from '@/types'

export const CHART_COLORS: string[] = [
  '#1E5C42', // forest
  '#C9A227', // brass
  '#B3453D', // brick
  '#4A7C59', // sage
  '#8B6F47', // clay
  '#5B7B7A', // slate teal
  '#A67C52', // tan
  '#3D5A4C', // pine
  '#7D6B58', // stone
  '#2F4F43', // deep green
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

export interface MonthlyTrendItem {
  month: string
  income: number
  expense: number
}

export function buildMonthlyTrend(
  transactions: Transaction[],
  endMonth: string,
  months = 6,
): MonthlyTrendItem[] {
  const end = dayjs(`${endMonth}-01`)

  const items: MonthlyTrendItem[] = []
  for (let i = months - 1; i >= 0; i--) {
    items.push({ month: end.subtract(i, 'month').format('YYYY-MM'), income: 0, expense: 0 })
  }

  const byMonth = new Map(items.map((item) => [item.month, item]))
  for (const transaction of transactions) {
    const item = byMonth.get(transaction.date.slice(0, 7))
    if (!item) continue
    if (transaction.type === 'income') {
      item.income += transaction.amount
    } else {
      item.expense += transaction.amount
    }
  }

  return items
}
