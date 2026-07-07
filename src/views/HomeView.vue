<template>
  <v-container>
    <!-- stat cards เดิม -->
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

    <!-- ปุ่มเพิ่ม -->
    <div class="d-flex justify-end mb-4 ga-2">
      <v-btn color="success" prepend-icon="mdi-plus" @click="formRef?.openAdd('income')">
        รายรับ
      </v-btn>
      <v-btn color="error" prepend-icon="mdi-plus" @click="formRef?.openAdd('expense')">
        รายจ่าย
      </v-btn>
    </div>

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

import TransactionForm from '@/components/transaction/TransactionForm.vue'
import TransactionList from '@/components/transaction/TransactionList.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { useCurrentMonth } from '@/composables/useCurrentMonth'
import { useTransactionStore } from '@/stores/transactions'

const store = useTransactionStore()
const { currentMonth } = useCurrentMonth()
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
</script>
