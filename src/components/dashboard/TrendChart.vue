<template>
  <div>
    <Bar v-if="hasData" :data="data" :options="options" />
    <div v-else class="py-8">
      <EmptyLedger text="ยังไม่มีข้อมูลในช่วง 6 เดือน" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
import { Bar } from 'vue-chartjs'

import EmptyLedger from '@/components/ui/EmptyLedger.vue'
import { formatMonth } from '@/utils'
import type { Transaction } from '@/types'
import { buildMonthlyTrend } from '@/utils/charts'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps<{ transactions: Transaction[]; endMonth: string }>()

const trend = computed(() => buildMonthlyTrend(props.transactions, props.endMonth))

const hasData = computed(() => trend.value.some((item) => item.income > 0 || item.expense > 0))

const data = computed(() => ({
  labels: trend.value.map((item) => formatMonth(item.month)),
  datasets: [
    {
      label: 'รายรับ',
      data: trend.value.map((item) => item.income),
      backgroundColor: '#2F7D5C',
    },
    {
      label: 'รายจ่าย',
      data: trend.value.map((item) => item.expense),
      backgroundColor: '#B3453D',
    },
  ],
}))

const options = {
  aspectRatio: 1.5,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
  },
}
</script>
