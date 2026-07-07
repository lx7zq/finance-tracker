<template>
  <v-card rounded="lg" border>
    <v-card-text>
      <div class="text-caption text-medium-emphasis mb-1">{{ label }}</div>
      <div class="text-h5 font-weight-bold" :class="amountColor">
        {{ formatted }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  amount: number
  variant?: 'income' | 'expense' | 'balance'
}>()

const formatted = computed(() =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(props.amount),
)

const amountColor = computed(() => ({
  'text-success': props.variant === 'income',
  'text-error': props.variant === 'expense',
  'text-primary': props.variant === 'balance',
}))
</script>
