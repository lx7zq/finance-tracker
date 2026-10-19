import { computed, ref } from 'vue'

import { formatMonth, getThisMonth } from '@/utils'

export function useCurrentMonth() {
  const currentMonth = ref(getThisMonth()) // "2025-06"

  function prevMonth() {
    const [y, m] = currentMonth.value.split('-').map(Number)
    const d = new Date(y!, m! - 2, 1)
    currentMonth.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  function nextMonth() {
    const [y, m] = currentMonth.value.split('-').map(Number)
    const d = new Date(y!, m!, 1)
    currentMonth.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  const displayMonth = computed(() => formatMonth(currentMonth.value))

  return { currentMonth, displayMonth, prevMonth, nextMonth }
}
