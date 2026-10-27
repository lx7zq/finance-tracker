import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useToastStore } from '@/stores/toast'

describe('useToastStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('เริ่มต้นซ่อนอยู่และไม่มีข้อความ', () => {
    const toast = useToastStore()

    expect(toast.visible).toBe(false)
    expect(toast.message).toBe('')
    expect(toast.color).toBe('success')
  })

  it('show แสดงข้อความพร้อมสีที่กำหนด', () => {
    const toast = useToastStore()

    toast.show('ลบรายการแล้ว', 'error')

    expect(toast.visible).toBe(true)
    expect(toast.message).toBe('ลบรายการแล้ว')
    expect(toast.color).toBe('error')
  })

  it('show ครั้งถัดไปทับข้อความเดิม', () => {
    const toast = useToastStore()
    toast.show('เพิ่มรายการแล้ว')
    toast.show('ตั้งงบแล้ว', 'error')

    expect(toast.message).toBe('ตั้งงบแล้ว')
    expect(toast.color).toBe('error')
    expect(toast.visible).toBe(true)
  })

  it('dismiss ซ่อน snackbar แต่คงข้อความไว้', () => {
    const toast = useToastStore()
    toast.show('เพิ่มรายการแล้ว')

    toast.dismiss()

    expect(toast.visible).toBe(false)
    expect(toast.message).toBe('เพิ่มรายการแล้ว')
  })
})
