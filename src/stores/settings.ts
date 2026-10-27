import { computed, ref } from 'vue'

import { defineStore } from 'pinia'

const STORAGE_KEY = 'settings'

export const useSettingsStore = defineStore('settings', () => {
  // คีย์จากไฟล์ตั้งค่า (.env.local → VITE_GEMINI_API_KEY) — ทำให้แอปมี key ในตัวโดยไม่ต้องพิมพ์ในหน้าตั้งค่า
  // อ่านตอนสร้าง store (ไม่ใช่ตอน import) เพื่อให้ env ล่าสุดมีผลทุกครั้ง
  const envFallback = (import.meta.env.VITE_GEMINI_API_KEY ?? '').trim()

  const apiKey = ref('')
  const effectiveApiKey = computed(() => apiKey.value || envFallback)
  const hasKey = computed(() => effectiveApiKey.value !== '')

  function setApiKey(key: string) {
    apiKey.value = key.trim()
    save()
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey: apiKey.value }))
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        const apiKeyValue =
          typeof parsed === 'object' && parsed !== null
            ? (parsed as Record<string, unknown>).apiKey
            : undefined
        if (typeof apiKeyValue === 'string') apiKey.value = apiKeyValue
      }
    } catch {
      apiKey.value = ''
    }
  }

  load()

  return { apiKey, effectiveApiKey, hasKey, setApiKey, load }
})
