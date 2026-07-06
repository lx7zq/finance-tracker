import { reactive } from 'vue'

import dayjs from 'dayjs'

import type { Category, Transaction, TransactionType } from '@/types'

export function useTransactionForm(
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void,
) {
  const form = reactive({
    type: 'expense' as TransactionType,
    amount: '',
    category: '' as Category | '',
    description: '',
    date: dayjs().format('YYYY-MM-DD'),
  })
  const errors = reactive({ amount: '', category: '' })

  function validate() {
    errors.amount = ''
    errors.category = ''

    if (!form.amount || isNaN(+form.amount)) {
      errors.amount = 'กรุณาระบุจำนวนเงิน'
      return false
    }
    if (!form.category) {
      errors.category = 'กรุณาเลือกหมวดหมู่'
      return false
    }
    return true
  }

  function submit() {
    if (!validate()) return
    onSubmit({
      ...form,
      amount: +form.amount,
      category: form.category as Category,
    })
  }
}
