<template>
  <v-bottom-sheet v-model="isOpen">
    <v-card rounded="t-xl" class="pa-5 pa-sm-7 pb-7">
      <!-- idle -->
      <div v-if="phase === 'idle'" class="text-center py-4">
        <v-btn
          icon="mdi-microphone"
          size="x-large"
          color="#C9A227"
          aria-label="เริ่มพูด"
          @click="start"
        />
        <p class="mt-4 text-body-1">แตะเพื่อพูด เช่น &ldquo;กาแฟ 45 บาท&rdquo;</p>
        <v-alert
          v-if="!hasKey"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-5 text-left"
        >
          <span>ยังไม่ได้ตั้งค่า Gemini API key — ใช้โหมดคีย์เวิร์ดพื้นฐานได้</span>
          <v-btn variant="text" size="small" color="primary" @click="emit('open-settings')">
            ตั้งค่า
          </v-btn>
        </v-alert>
      </div>

      <!-- listening -->
      <div v-else-if="phase === 'listening'" class="text-center py-4">
        <v-btn
          icon="mdi-microphone"
          size="x-large"
          color="error"
          class="mic-listening"
          aria-label="หยุดพูด"
          @click="stopCapture"
        />
        <p class="mt-4 text-body-1">กำลังฟัง… แตะเพื่อหยุด</p>
        <p v-if="interim" class="mt-2 text-body-2 text-medium-emphasis" data-testid="interim">
          {{ interim }}
        </p>
      </div>

      <!-- processing -->
      <div v-else-if="phase === 'processing'" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="mt-4 text-body-1">กำลังจัดโครงรายการ…</p>
      </div>

      <!-- confirm -->
      <div v-else-if="phase === 'confirm'">
        <div class="d-flex align-center mb-4">
          <v-icon icon="mdi-check-circle" color="success" class="mr-2" />
          <span class="text-body-1 font-weight-medium">ตรวจรายการก่อนบันทึก</span>
        </div>

        <v-btn-toggle v-model="card.type" mandatory divided class="mb-4 w-100">
          <v-btn value="expense" color="error" class="flex-1-1">รายจ่าย</v-btn>
          <v-btn value="income" color="success" class="flex-1-1">รายรับ</v-btn>
        </v-btn-toggle>

        <v-text-field
          v-model.number="card.amount"
          label="จำนวนเงิน (฿)"
          type="number"
          class="mb-2"
        />

        <v-select
          v-model="card.category"
          label="หมวดหมู่"
          :items="categoryItems"
          item-title="label"
          item-value="value"
          class="mb-2"
        />

        <v-text-field v-model="card.description" label="รายละเอียด" class="mb-2" />

        <v-text-field v-model="card.date" label="วันที่" type="date" class="mb-4" />

        <div class="d-flex ga-2">
          <v-btn variant="text" class="flex-1-1" @click="closeReset">ยกเลิก</v-btn>
          <v-btn
            variant="flat"
            color="primary"
            class="flex-1-1"
            :disabled="!(card.amount > 0)"
            @click="save"
          >
            บันทึก
          </v-btn>
        </div>
      </div>

      <!-- error -->
      <div v-else-if="phase === 'error'" class="text-center py-4">
        <v-icon icon="mdi-alert-circle" color="error" size="40" />
        <p class="mt-3 text-body-1">{{ errorMessage }}</p>
        <div class="d-flex ga-2 mt-5">
          <v-btn variant="outlined" class="flex-1-1" @click="retry">ลองอีกครั้ง</v-btn>
          <v-btn variant="flat" color="primary" class="flex-1-1" @click="openManualForm">
            พิมพ์เอง
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import dayjs from 'dayjs'

import { useVoiceEntry } from '@/composables/useVoiceEntry'
import { useTransactionStore } from '@/stores/transactions'
import {
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Category,
  type TransactionType,
} from '@/types'

const emit = defineEmits<{
  manual: []
  saved: []
  'open-settings': []
}>()

const store = useTransactionStore()
const isOpen = ref(false)

const { phase, interim, draft, errorMessage, hasKey, start, stopCapture, cancel, reset } =
  useVoiceEntry()

const card = reactive({
  type: 'expense' as TransactionType,
  amount: 0,
  category: 'other_expense' as Category,
  description: '',
  date: dayjs().format('YYYY-MM-DD'),
})

const categoryItems = computed(() => {
  const list = card.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return list.map((value) => ({ value, label: CATEGORY_LABELS[value] }))
})

watch(
  () => card.type,
  (type) => {
    const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    if (!list.includes(card.category)) {
      const first = list[0]
      if (first) card.category = first
    }
  },
)

watch(phase, (value) => {
  if (value === 'confirm' && draft.value) {
    card.type = draft.value.type
    card.amount = draft.value.amount
    card.category = draft.value.category
    card.description = draft.value.description
    card.date = dayjs().format('YYYY-MM-DD')
  }
})

watch(isOpen, (open) => {
  if (!open) cancel()
})

function open() {
  isOpen.value = true
}

function closeReset() {
  isOpen.value = false
  reset()
}

function retry() {
  reset()
  void start()
}

function openManualForm() {
  isOpen.value = false
  reset()
  emit('manual')
}

function save() {
  if (!draft.value || !(card.amount > 0)) return
  store.addTransaction({
    type: card.type,
    amount: card.amount,
    category: card.category,
    description: card.description.trim(),
    date: card.date,
  })
  isOpen.value = false
  reset()
  emit('saved')
}

defineExpose({ open })
</script>

<style scoped>
.mic-listening {
  animation: mic-pulse 1.2s ease-in-out infinite;
}

@keyframes mic-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(179, 69, 61, 0.35);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 0 0 14px rgba(179, 69, 61, 0);
  }
}
</style>
