import { describe, expect, it } from 'vitest'

import { useTransactionForm } from '@/composables/useTransactionForm'
import type { Transaction } from '@/types'

describe('useTransactionForm', () => {
  function setup() {
    let submitted: Omit<Transaction, 'id' | 'createdAt'> | null = null
    const { form, errors, submit } = useTransactionForm((data) => {
      submitted = data
    })
    form.type = 'expense'
    form.category = 'food'
    return { form, errors, submit, getSubmitted: () => submitted }
  }

  it('จำนวนเงิน 0 หรือติดลบ → ไม่ submit พร้อมข้อความ error', () => {
    const { form, errors, submit, getSubmitted } = setup()

    form.amount = '0'
    submit()
    expect(getSubmitted()).toBeNull()
    expect(errors.amount).toBe('กรุณาระบุจำนวนเงินมากกว่า 0')

    form.amount = '-50'
    submit()
    expect(getSubmitted()).toBeNull()
    expect(errors.amount).toBe('กรุณาระบุจำนวนเงินมากกว่า 0')
  })

  it('จำนวนเงินทศนิยมที่มากกว่า 0 → submit ผ่าน', () => {
    const { form, errors, submit, getSubmitted } = setup()

    form.amount = '100.5'
    submit()

    expect(errors.amount).toBe('')
    expect(getSubmitted()?.amount).toBe(100.5)
  })
})
