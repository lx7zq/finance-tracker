<template>
  <v-container>
    <!-- หัวเดือน + ปุ่มเพิ่ม -->
    <div class="d-flex align-center justify-space-between mb-4 ga-2">
      <div class="d-flex align-center ga-1">
        <v-btn
          icon="mdi-chevron-left"
          size="small"
          variant="text"
          aria-label="เดือนก่อนหน้า"
          @click="prevMonth"
        />
        <h1 class="text-h6 font-weight-bold">{{ displayMonth }}</h1>
        <v-btn
          icon="mdi-chevron-right"
          size="small"
          variant="text"
          aria-label="เดือนถัดไป"
          @click="nextMonth"
        />
      </div>
      <div class="d-flex ga-2">
        <v-btn color="success" prepend-icon="mdi-plus" @click="formRef?.openAdd('income')">
          รายรับ
        </v-btn>
        <v-btn color="error" prepend-icon="mdi-plus" @click="formRef?.openAdd('expense')">
          รายจ่าย
        </v-btn>
      </div>
    </div>

    <!-- stat cards -->
    <v-row class="mb-4">
      <v-col cols="12" sm="4">
        <StatCard label="รายรับ" :amount="summary.totalIncome" variant="income" />
      </v-col>
      <v-col cols="12" sm="4">
        <StatCard label="รายจ่าย" :amount="summary.totalExpense" variant="expense" />
      </v-col>
      <v-col cols="12" sm="4">
        <StatCard label="คงเหลือ" :amount="summary.balance" variant="balance" />
      </v-col>
    </v-row>

    <!-- กราฟสัดส่วนรายจ่ายตามหมวด -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-card rounded="lg" border flat>
          <v-card-title class="pa-4 pb-0">รายจ่ายตามหมวด</v-card-title>
          <v-card-text class="pt-2">
            <CategoryChart :expenses="monthExpenseMap" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- รายการ -->
    <v-card rounded="lg" border flat>
      <v-card-title class="pa-4">รายการเดือนนี้</v-card-title>
      <TransactionList :transactions="monthTransactions" @edit="formRef?.openEdit($event)" />
    </v-card>

    <TransactionForm ref="formRef" />
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import CategoryChart from '@/components/dashboard/CategoryChart.vue'
import TransactionForm from '@/components/transaction/TransactionForm.vue'
import TransactionList from '@/components/transaction/TransactionList.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { useCurrentMonth } from '@/composables/useCurrentMonth'
import { useTransactionStore } from '@/stores/transactions'
import type { Category } from '@/types'

const store = useTransactionStore()
const { currentMonth, displayMonth, prevMonth, nextMonth } = useCurrentMonth()
const formRef = ref<InstanceType<typeof TransactionForm> | null>(null)

const monthTransactions = computed(() =>
  store.transactions.filter((t) => t.date.startsWith(currentMonth.value)),
)

const summary = computed(() => {
  const totalIncome = monthTransactions.value
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = monthTransactions.value
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
})

const monthExpenseMap = computed(() => {
  const map: Partial<Record<Category, number>> = {}
  monthTransactions.value
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount
    })
  return map
})
</script>
