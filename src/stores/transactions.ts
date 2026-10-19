import { computed, ref } from 'vue'

import { defineStore } from 'pinia'

import type { Budget, Category, Transaction } from '@/types'

const STORAGE_KEY = 'transactions'
const BUDGET_KEY = 'budgets'

function isValidTransaction(value: unknown): value is Transaction {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.date === 'string' &&
    typeof item.amount === 'number' &&
    (item.type === 'income' || item.type === 'expense')
  )
}

function isValidBudget(value: unknown): value is Budget {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.category === 'string' &&
    typeof item.month === 'string' &&
    typeof item.limit === 'number'
  )
}

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
  function setBudget(category: Category, month: string, limit: number) {
    const existing = budgets.value.find((b) => b.category === category && b.month === month)
    if (existing) {
      existing.limit = limit
    } else {
      budgets.value.push({ category, month, limit })
    }
    saveBudgets()
  }

  function getBudget(category: Category, month: string): number {
    return budgets.value.find((b) => b.category === category && b.month === month)?.limit ?? 0
  }

  function getBudgetsForMonth(month: string) {
    return budgets.value.filter((b) => b.month === month)
  }

  function removeBudget(category: Category, month: string) {
    budgets.value = budgets.value.filter((b) => !(b.category === category && b.month === month))
    saveBudgets()
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
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        transactions.value = Array.isArray(parsed) ? parsed.filter(isValidTransaction) : []
      }
    } catch {
      transactions.value = []
    }

    try {
      const rawBudgets = localStorage.getItem(BUDGET_KEY)
      if (rawBudgets) {
        const parsed: unknown = JSON.parse(rawBudgets)
        budgets.value = Array.isArray(parsed) ? parsed.filter(isValidBudget) : []
      }
    } catch {
      budgets.value = []
    }
  }

  function saveBudgets() {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets.value))
  }

  load()

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
    getBudgetsForMonth,
    removeBudget,
    load,
  }
})
