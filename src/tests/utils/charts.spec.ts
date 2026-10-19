import { describe, expect, it } from 'vitest'

import { buildCategorySeries } from '@/utils/charts'

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
