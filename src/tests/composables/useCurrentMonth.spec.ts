import { describe, expect, it } from 'vitest'

import { useCurrentMonth } from '@/composables/useCurrentMonth'

describe('useCurrentMonth', () => {
  it('prevMonth ข้ามปี จาก มกราคม ไป ธันวาคม ของปีก่อนหน้า', () => {
    const { currentMonth, prevMonth } = useCurrentMonth()
    currentMonth.value = '2026-01'

    prevMonth()

    expect(currentMonth.value).toBe('2025-12')
  })

  it('nextMonth ข้ามปี จาก ธันวาคม ไป มกราคม ของปีถัดไป', () => {
    const { currentMonth, nextMonth } = useCurrentMonth()
    currentMonth.value = '2026-12'

    nextMonth()

    expect(currentMonth.value).toBe('2027-01')
  })
})
