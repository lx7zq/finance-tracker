<!-- src/components/transaction/TransactionList.vue -->
<template>
  <v-list lines="two">
    <v-list-item
      v-for="tx in transactions"
      :key="tx.id"
      :subtitle="`${CATEGORY_LABELS[tx.category]} · ${formatDate(tx.date)}`"
    >
      <template #title>
        <span>{{ tx.description }}</span>
      </template>

      <template #prepend>
        <v-avatar
          :color="`${CATEGORY_COLORS[tx.category]}22`"
          :style="{ color: CATEGORY_COLORS[tx.category] }"
          size="38"
          class="mr-1"
        >
          {{ CATEGORY_ICONS[tx.category] }}
        </v-avatar>
      </template>

      <template #append>
        <div class="d-flex align-center ga-2">
          <span
            class="font-weight-semibold num"
            :class="tx.type === 'income' ? 'text-success' : 'text-error'"
          >
            {{ tx.type === 'income' ? '+' : '-' }}
            {{ formatCurrency(tx.amount) }}
          </span>
          <v-btn icon="mdi-pencil" size="small" variant="text" @click="$emit('edit', tx)" />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(tx.id)"
          />
        </div>
      </template>
    </v-list-item>

    <v-list-item v-if="transactions.length === 0">
      <v-list-item-title class="text-center text-medium-emphasis py-8">
        ยังไม่มีรายการในเดือนนี้
      </v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import { useTransactionStore } from '@/stores/transactions'
import type { Transaction } from '@/types'
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '@/types'
import { formatCurrency, formatDate } from '@/utils'

defineProps<{ transactions: Transaction[] }>()
defineEmits<{ edit: [tx: Transaction] }>()

const store = useTransactionStore()

function confirmDelete(id: string) {
  if (confirm('ลบรายการนี้?')) store.deleteTransaction(id)
}
</script>
