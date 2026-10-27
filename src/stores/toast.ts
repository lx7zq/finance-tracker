import { ref } from 'vue'

import { defineStore } from 'pinia'

export type ToastColor = 'success' | 'error'

// ข้อความแจ้งผลการกระทำ (เพิ่ม/แก้ไข/ลบ) — แสดงผ่าน AppToaster ที่ mount ครั้งเดียวใน App.vue
export const useToastStore = defineStore('toast', () => {
  const message = ref('')
  const color = ref<ToastColor>('success')
  const visible = ref(false)

  function show(msg: string, c: ToastColor = 'success') {
    message.value = msg
    color.value = c
    visible.value = true
  }

  function dismiss() {
    visible.value = false
  }

  return { message, color, visible, show, dismiss }
})
