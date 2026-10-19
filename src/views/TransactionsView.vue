<!-- src/views/TransactionsView.vue -->
<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 font-weight-bold">รายการทั้งหมด</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="formRef?.openAdd()">
        เพิ่มรายการ
      </v-btn>
    </div>

    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" sm="5">
        <v-text-field
          v-model="search"
          placeholder="ค้นหา..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          density="compact"
        />
      </v-col>
      <v-col cols="6" sm="3">
        <v-select
          v-model="filterType"
          :items="typeOptions"
          item-title="label"
          item-value="value"
          hide-details
          density="compact"
        />
      </v-col>
      <v-col cols="6" sm="4">
        <v-select
          v-model="filterMonth"
          :items="monthOptions"
          item-title="label"
          item-value="value"
          hide-details
          density="compact"
        />
      </v-col>
    </v-row>

    <!-- List -->
    <v-card rounded="lg" border flat>
      <div class="d-flex justify-space-between align-center pa-4 pb-0">
        <span class="text-caption text-medium-emphasis">{{ filtered.length }} รายการ</span>
        <span class="text-caption">
          รวม:
          <strong :class="totalAmount >= 0 ? 'text-success' : 'text-error'">
            {{ formatCurrency(Math.abs(totalAmount)) }}
          </strong>
        </span>
      </div>
      <TransactionList :transactions="filtered" @edit="formRef?.openEdit($event)" />
    </v-card>

    <TransactionForm ref="formRef" />
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import TransactionForm from '@/components/transaction/TransactionForm.vue'
import TransactionList from '@/components/transaction/TransactionList.vue'
import { useTransactionStore } from '@/stores/transactions'
import { formatCurrency, formatMonth, getThisMonth } from '@/utils'

const store = useTransactionStore()
const formRef = ref<InstanceType<typeof TransactionForm> | null>(null)

const search = ref('')
const filterType = ref('')
const filterMonth = ref(getThisMonth())

const typeOptions = [
  { label: 'ทุกประเภท', value: '' },
  { label: 'รายรับ', value: 'income' },
  { label: 'รายจ่าย', value: 'expense' },
]

const monthOptions = computed(() => {
  const months = [...new Set(store.transactions.map((t) => t.date.slice(0, 7)))].sort().reverse()
  return [
    { label: 'ทุกเดือน', value: '' },
    ...months.map((m) => ({ label: formatMonth(m), value: m })),
  ]
})

const filtered = computed(() =>
  store.transactions
    .filter((t) => {
      const matchSearch =
        !search.value || t.description.toLowerCase().includes(search.value.toLowerCase())
      const matchType = !filterType.value || t.type === filterType.value
      const matchMonth = !filterMonth.value || t.date.startsWith(filterMonth.value)
      return matchSearch && matchType && matchMonth
    })
    .sort((a, b) => b.date.localeCompare(a.date)),
)

const totalAmount = computed(() =>
  filtered.value.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0),
)
</script>
