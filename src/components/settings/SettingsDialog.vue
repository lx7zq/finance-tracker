<template>
  <v-dialog v-model="isOpen" max-width="420">
    <v-card rounded="lg">
      <v-card-title class="pa-4">ตั้งค่า</v-card-title>

      <v-card-text class="pa-4 pt-0">
        <v-text-field
          v-model="draftKey"
          label="Gemini API Key"
          type="password"
          hint="ใช้สำหรับ parse รายการจากเสียง เก็บเฉพาะในเบราว์เซอร์นี้"
          persistent-hint
        />
        <div v-if="store.hasKey" class="text-caption mt-3 text-medium-emphasis">
          {{
            store.apiKey
              ? 'มีคีย์บันทึกอยู่แล้ว ระบบเสียงใช้ AI parse ได้ปกติ'
              : 'แอปมีคีย์จากไฟล์ตั้งค่า (.env.local) อยู่แล้ว — ใส่คีย์ที่นี่ทับได้'
          }}
        </div>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-btn v-if="store.apiKey" variant="text" color="error" @click="clearKey"> ล้างคีย์ </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">ยกเลิก</v-btn>
        <v-btn variant="flat" color="primary" @click="saveKey">บันทึก</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { useSettingsStore } from '@/stores/settings'

const store = useSettingsStore()
const isOpen = ref(false)
const draftKey = ref('')

function open() {
  draftKey.value = store.apiKey
  isOpen.value = true
}

function saveKey() {
  store.setApiKey(draftKey.value)
  isOpen.value = false
}

function clearKey() {
  store.setApiKey('')
  draftKey.value = ''
  isOpen.value = false
}

defineExpose({ open })
</script>
