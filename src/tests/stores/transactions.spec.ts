import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useTransactionStore } from '@/stores/transactions'
import type { Transaction } from '@/types'

const seedTransaction: Transaction = {
  id: 't1',
  type: 'expense',
  amount: 150,
  category: 'food',
  description: 'ข้าวกลางวัน',
  date: '2026-10-01',
  createdAt: '2026-10-01T00:00:00.000Z',
}

describe('useTransactionStore persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('โหลด transactions และ budgets จาก localStorage ตอนสร้าง store', () => {
    localStorage.setItem('transactions', JSON.stringify([seedTransaction]))
    localStorage.setItem(
      'budgets',
      JSON.stringify([{ category: 'food', month: '2026-10', limit: 5000 }]),
    )

    const store = useTransactionStore()

    expect(store.transactions).toHaveLength(1)
    expect(store.transactions[0]?.description).toBe('ข้าวกลางวัน')
    expect(store.budgets[0]?.limit).toBe(5000)
  })

  it('ไม่มีข้อมูลใน localStorage → เริ่มว่าง', () => {
    const store = useTransactionStore()

    expect(store.transactions).toEqual([])
    expect(store.budgets).toEqual([])
  })

  it('localStorage พังหรือไม่ใช่ array → เริ่มว่าง ไม่โยน error', () => {
    localStorage.setItem('transactions', '{not valid json')
    localStorage.setItem('budgets', '"not-an-array"')

    expect(() => useTransactionStore()).not.toThrow()

    const store = useTransactionStore()
    expect(store.transactions).toEqual([])
    expect(store.budgets).toEqual([])
  })

  it('transactions พัง แต่ budgets ยังใช้ได้ → เก็บ budgets ไว้', () => {
    localStorage.setItem('transactions', '{broken')
    localStorage.setItem(
      'budgets',
      JSON.stringify([{ category: 'food', month: '2026-10', limit: 3000 }]),
    )

    const store = useTransactionStore()

    expect(store.transactions).toEqual([])
    expect(store.budgets[0]?.limit).toBe(3000)
  })

  it('array ที่ JSON ถูกแต่ shape ผิด → เก็บเฉพาะรายการที่ใช้ได้ ไม่ crash ตอนโหลด', () => {
    localStorage.setItem(
      'transactions',
      JSON.stringify([1, { amount: 100 }, { ...seedTransaction, amount: 75 }]),
    )
    localStorage.setItem(
      'budgets',
      JSON.stringify([{ category: 'food' }, { category: 'food', month: '2026-10', limit: 1000 }]),
    )

    const store = useTransactionStore()

    expect(store.transactions).toHaveLength(1)
    expect(store.transactions[0]?.date).toBe('2026-10-01')
    expect(store.transactions[0]?.amount).toBe(75)
    expect(store.budgets).toHaveLength(1)
    expect(store.budgets[0]?.limit).toBe(1000)
  })
})
