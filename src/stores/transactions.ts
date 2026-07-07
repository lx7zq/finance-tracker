import { computed, ref } from 'vue'

import { defineStore } from 'pinia'

import type { Budget, Category, Transaction } from '@/types'

const STORAGE_KEY = 'transactions'
const BUDGET_KEY = 'budgets'

export const useTransactionStore = defineStore('transactions', () => {
  // State
  const transactions = ref<Transaction[]>([])
  const budgets = ref<Budget[]>([])

  // Actions - Transactions
  function addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
    transactions.value.push({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    })
    save()
  }

  function updateTransaction(id: string, data: Partial<Transaction>) {
    const idx = transactions.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      transactions.value[idx] = { ...transactions.value[idx], ...data } as Transaction
      save()
    }
  }
  function deleteTransaction(id: string) {
    transactions.value = transactions.value.filter((t) => t.id !== id)
    save()
  }

  function getTransactionsByMonth(month: string) {
    return transactions.value.filter((t) => t.date.startsWith(month))
  }

  // Actions - Budgets
  function setBudget(category: Category, limit: number) {
    const existing = budgets.value.find((b) => b.category === category)
    if (existing) {
      existing.limit = limit
    } else {
      budgets.value.push({ category, limit })
    }
    saveBudgets()
  }

  function getBudget(category: Category): number {
    return budgets.value.find((b) => b.category === category)?.limit ?? 0
  }

  // Getters (computed)
  const totalIncome = computed(() =>
    transactions.value.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
  )

  const totalExpense = computed(() =>
    transactions.value.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
  )

  const balance = computed(() => totalIncome.value - totalExpense.value)

  const expensesByCategory = computed(() => {
    const map: Partial<Record<Category, number>> = {}
    transactions.value
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + t.amount
      })
    return map
  })

  // Persistence
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions.value))
  }

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      transactions.value = JSON.parse(raw) as Transaction[]
    }

    const rawBudgets = localStorage.getItem(BUDGET_KEY)
    if (rawBudgets) {
      budgets.value = JSON.parse(rawBudgets) as Budget[]
    }
  }

  function saveBudgets() {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets.value))
  }

  return {
    transactions,
    budgets,
    totalIncome,
    totalExpense,
    balance,
    expensesByCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByMonth,
    setBudget,
    getBudget,
    load,
  }
})
