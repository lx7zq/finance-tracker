import { ref } from 'vue'

import { defineStore } from 'pinia'

const STORAGE_KEY = 'settings'

export const useSettingsStore = defineStore('settings', () => {
  const apiKey = ref('')

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

  return { apiKey, setApiKey, load }
})
