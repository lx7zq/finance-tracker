import { computed, ref } from 'vue'

import { defineStore } from 'pinia'

import type { Transaction } from '@/types'

export const useTransactionStore = defineStore('transactions', () => {
  // State
  const transactions = ref<Transaction[]>([])

  // Actions
  function addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
    transactions.value.push({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    })
    save() // บันทึกลง localStorage
  }

  // Getters (computed)
  const totalIncome = computed(() =>
    transactions.value.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
  )

  // Persistence
  function save() {
    localStorage.setItem('transactions', JSON.stringify(transactions.value))
  }
  function load() {
    const raw = localStorage.getItem('transactions')
    if (raw) transactions.value = JSON.parse(raw)
  }

  return { transactions, totalIncome, addTransaction, load }
})
