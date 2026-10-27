import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useSettingsStore } from '@/stores/settings'

describe('useSettingsStore persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('setApiKey ตัดช่องว่างและ persist ลง localStorage', () => {
    const store = useSettingsStore()

    store.setApiKey('  key123  ')

    expect(store.apiKey).toBe('key123')
    expect(JSON.parse(localStorage.getItem('settings') ?? '{}')).toEqual({ apiKey: 'key123' })
  })

  it('โหลด apiKey จาก localStorage ตอนสร้าง store', () => {
    localStorage.setItem('settings', JSON.stringify({ apiKey: 'seeded' }))

    const store = useSettingsStore()

    expect(store.apiKey).toBe('seeded')
  })

  it('ไม่มีข้อมูล → apiKey ว่าง', () => {
    const store = useSettingsStore()

    expect(store.apiKey).toBe('')
  })

  it('localStorage พังหรือ shape ผิด → เริ่มว่าง ไม่โยน error', () => {
    localStorage.setItem('settings', '{broken')

    expect(() => useSettingsStore()).not.toThrow()
    expect(useSettingsStore().apiKey).toBe('')

    localStorage.setItem('settings', '"not-an-object"')
    expect(useSettingsStore().apiKey).toBe('')

    localStorage.setItem('settings', JSON.stringify({ apiKey: 123 }))
    expect(useSettingsStore().apiKey).toBe('')
  })

  it('setApiKey("") ล้างคีย์และ persist ค่าว่าง', () => {
    const store = useSettingsStore()
    store.setApiKey('something')

    store.setApiKey('')

    expect(store.apiKey).toBe('')
    expect(JSON.parse(localStorage.getItem('settings') ?? '{}')).toEqual({ apiKey: '' })
  })
})

describe('effectiveApiKey (env fallback)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('ผู้ใช้ไม่ได้ตั้งคีย์ → ใช้ VITE_GEMINI_API_KEY จาก env โดยตรง', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'env-key')

    const store = useSettingsStore()

    expect(store.effectiveApiKey).toBe('env-key')
    expect(store.hasKey).toBe(true)
    expect(store.apiKey).toBe('')
  })

  it('คีย์ผู้ใช้ชนะ env เสมอ', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'env-key')

    const store = useSettingsStore()
    store.setApiKey('user-key')

    expect(store.effectiveApiKey).toBe('user-key')
  })

  it('ไม่มีทั้งสองแหล่ง → ว่างและ hasKey false', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '')

    const store = useSettingsStore()

    expect(store.effectiveApiKey).toBe('')
    expect(store.hasKey).toBe(false)
  })
})
