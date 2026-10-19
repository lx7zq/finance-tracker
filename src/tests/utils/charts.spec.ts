import { describe, expect, it } from 'vitest'

import { buildCategorySeries, buildMonthlyTrend } from '@/utils/charts'
import type { Transaction } from '@/types'

function tx(date: string, type: 'income' | 'expense', amount: number): Transaction {
  return {
    id: `tx-${date}-${type}`,
    type,
    amount,
    category: type === 'income' ? 'salary' : 'food',
    description: '',
    date,
    createdAt: date,
  }
}

describe('buildCategorySeries', () => {
  it('เรียงจากมากไปน้อย พร้อม label ไทยและสีครบตามจำนวน', () => {
    const result = buildCategorySeries({ food: 300, transport: 100, housing: 500 })

    expect(result.labels).toEqual(['ที่พัก', 'อาหาร', 'การเดินทาง'])
    expect(result.values).toEqual([500, 300, 100])
    expect(result.colors).toHaveLength(3)
    result.colors.forEach((color) => expect(color).toMatch(/^#/))
  })

  it('ค่าว่างหรือ 0 ทั้งหมด → คืน arrays ว่าง', () => {
    expect(buildCategorySeries({})).toEqual({ labels: [], values: [], colors: [] })
    expect(buildCategorySeries({ food: 0 }).values).toEqual([])
  })
})

describe('buildMonthlyTrend', () => {
  const transactions = [
    tx('2026-10-01', 'expense', 100),
    tx('2026-10-05', 'income', 1000),
    tx('2026-09-10', 'expense', 200),
    tx('2026-04-01', 'expense', 999),
  ]

  it('คืน 6 ช่องเรียงเก่า→ใหม่ จบลงที่ endMonth', () => {
    const trend = buildMonthlyTrend(transactions, '2026-10')

    expect(trend).toHaveLength(6)
    expect(trend[0]?.month).toBe('2026-05')
    expect(trend[5]?.month).toBe('2026-10')
  })

  it('นับรายรับ/รายจ่ายถูกต้อง เดือนว่างเป็น 0 และไม่นับรายการนอกช่วง', () => {
    const trend = buildMonthlyTrend(transactions, '2026-10')

    expect(trend[5]).toEqual({ month: '2026-10', income: 1000, expense: 100 })
    expect(trend[4]).toEqual({ month: '2026-09', income: 0, expense: 200 })
    expect(trend[0]).toEqual({ month: '2026-05', income: 0, expense: 0 })
    expect(trend.some((item) => item.month === '2026-04')).toBe(false)
  })
})
