<template>
  <div>
    <Doughnut v-if="series.values.length > 0" :data="data" :options="options" />
    <div v-else class="py-8">
      <EmptyLedger text="ยังไม่มีรายจ่ายในเดือนนี้" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'vue-chartjs'

import EmptyLedger from '@/components/ui/EmptyLedger.vue'
import type { Category } from '@/types'
import { buildCategorySeries } from '@/utils/charts'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{ expenses: Partial<Record<Category, number>> }>()

const series = computed(() => buildCategorySeries(props.expenses))

const data = computed(() => ({
  labels: series.value.labels,
  datasets: [
    {
      data: series.value.values,
      backgroundColor: series.value.colors,
      borderWidth: 0,
    },
  ],
}))

const options = {
  cutout: '65%',
  aspectRatio: 1.5,
  plugins: {
    legend: {
      position: 'right' as const,
    },
  },
}
</script>
