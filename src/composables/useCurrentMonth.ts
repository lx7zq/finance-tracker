import { computed, ref } from 'vue'

import { formatMonth, getThisMonth } from '@/utils'

export function useCurrentMonth() {
  const currentMonth = ref(getThisMonth()) // "2025-06"

  function prevMonth() {
    /* ลด month ลง 1 */
  }
  function nextMonth() {
    /* เพิ่ม month ขึ้น 1 */
  }

  const label = computed(() => formatMonth(currentMonth.value))

  return { currentMonth, label, prevMonth, nextMonth }
}

// ใน Component:
const { currentMonth, label, prevMonth } = useCurrentMonth()
