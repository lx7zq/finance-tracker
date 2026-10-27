<!-- src/components/transaction/TransactionForm.vue -->
<template>
  <v-dialog v-model="isOpen" max-width="480">
    <v-card rounded="lg">
      <v-card-title class="pa-4">
        {{ editingId ? 'แก้ไขรายการ' : 'เพิ่มรายการ' }}
      </v-card-title>

      <v-card-text class="pa-4 pt-0">
        <v-btn-toggle v-model="form.type" mandatory divided class="mb-4 w-100">
          <v-btn value="expense" color="error" class="flex-1-1">รายจ่าย</v-btn>
          <v-btn value="income" color="success" class="flex-1-1">รายรับ</v-btn>
        </v-btn-toggle>

        <v-text-field
          v-model="form.amount"
          label="จำนวนเงิน (฿)"
          type="number"
          :error-messages="errors.amount"
          class="mb-2"
        />

        <v-select
          v-model="form.category"
          label="หมวดหมู่"
          :items="categories"
          item-title="label"
          item-value="value"
          :error-messages="errors.category"
          class="mb-2"
        />

        <v-text-field
          v-model="form.description"
          label="รายละเอียด"
          placeholder="เช่น ข้าวกลางวัน, ค่าเดินทาง"
          class="mb-2"
        />

        <v-text-field v-model="form.date" label="วันที่" type="date" />
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">ยกเลิก</v-btn>
        <v-btn variant="flat" color="primary" @click="submit">
          {{ editingId ? 'บันทึก' : 'เพิ่มรายการ' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { useTransactionForm } from '@/composables/useTransactionForm'
import { useToastStore } from '@/stores/toast'
import { useTransactionStore } from '@/stores/transactions'
import type { Transaction, TransactionType } from '@/types'
import { CATEGORY_LABELS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types'

const store = useTransactionStore()
const toast = useToastStore()
const isOpen = ref(false)
const editingId = ref<string | null>(null)

const {
  form,
  errors,
  submit: submitForm,
} = useTransactionForm((data) => {
  if (editingId.value) {
    store.updateTransaction(editingId.value, data)
    toast.show('แก้ไขรายการแล้ว')
  } else {
    store.addTransaction(data)
    toast.show('เพิ่มรายการแล้ว')
  }
  isOpen.value = false
})

const categories = computed(() => {
  const list = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return list.map((value) => ({ value, label: CATEGORY_LABELS[value] }))
})

function submit() {
  submitForm()
}

function openAdd(type: TransactionType = 'expense') {
  editingId.value = null
  form.type = type
  form.amount = ''
  form.category = ''
  form.description = ''
  isOpen.value = true
}

function openEdit(tx: Transaction) {
  editingId.value = tx.id
  form.type = tx.type
  form.amount = String(tx.amount)
  form.category = tx.category
  form.description = tx.description
  form.date = tx.date
  isOpen.value = true
}

defineExpose({ openAdd, openEdit })
</script>
