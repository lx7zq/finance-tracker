<!-- src/views/BudgetView.vue -->
<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 font-weight-bold">งบประมาณ</h1>
      <v-chip>{{ displayMonth }}</v-chip>
    </div>

    <!-- รายการงบที่ตั้งไว้แล้ว -->
    <v-row v-if="monthBudgets.length > 0">
      <v-col v-for="b in monthBudgets" :key="b.category" cols="12" sm="6" md="4">
        <v-card rounded="lg" border flat>
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="d-flex align-center ga-2">
                <span>{{ CATEGORY_ICONS[b.category] }}</span>
                <span class="font-weight-medium">{{ CATEGORY_LABELS[b.category] }}</span>
              </div>
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="text"
                @click="store.removeBudget(b.category, currentMonth)"
              />
            </div>

            <div class="d-flex justify-space-between mb-2">
              <span class="text-caption text-medium-emphasis"
                >งบ {{ formatCurrency(b.limit) }}</span
              >
              <span class="text-error text-caption font-weight-bold">
                ใช้ไป {{ formatCurrency(spent[b.category] ?? 0) }}
              </span>
            </div>

            <v-progress-linear
              :model-value="getPercent(b)"
              :color="getColor(b)"
              rounded
              height="6"
              class="mb-1"
            />
            <div class="d-flex justify-space-between">
              <span class="text-caption text-medium-emphasis">
                {{ getPercent(b) }}% ใช้ไปแล้ว
              </span>
              <span class="text-caption" :class="`text-${getColor(b)}`">
                เหลือ {{ formatCurrency(Math.max(0, b.limit - (spent[b.category] ?? 0))) }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- การ์ดปุ่ม + สำหรับเพิ่มงบใหม่ -->
      <v-col v-if="availableCategories.length > 0" cols="12" sm="6" md="4">
        <v-card
          rounded="lg"
          border
          flat
          height="100%"
          class="d-flex align-center justify-center"
          style="min-height: 160px; cursor: pointer"
          @click="openAddDialog"
        >
          <div class="text-center">
            <v-icon icon="mdi-plus" size="32" color="primary" />
            <div class="text-caption text-medium-emphasis mt-1">เพิ่มงบใหม่</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ยังไม่มีงบเลย -->
    <v-card v-else rounded="lg" border flat class="d-flex align-center justify-center pa-8">
      <div class="text-center">
        <v-icon icon="mdi-wallet-outline" size="40" color="grey" class="mb-2" />
        <div class="text-body-2 text-medium-emphasis mb-4">ยังไม่มีงบที่ตั้งไว้ในเดือนนี้</div>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog"> ตั้งงบใหม่ </v-btn>
      </div>
    </v-card>

    <!-- Dialog เพิ่มงบ -->
    <v-dialog v-model="showDialog" max-width="400">
      <v-card rounded="lg">
        <v-card-title>ตั้งงบใหม่</v-card-title>
        <v-card-text>
          <v-select
            v-model="newCategory"
            :items="availableCategories"
            :item-title="(c: Category) => `${CATEGORY_ICONS[c]} ${CATEGORY_LABELS[c]}`"
            label="เลือกหมวด"
            density="comfortable"
            class="mb-2"
          />
          <v-text-field
            v-model="newAmount"
            label="จำนวนเงิน (฿)"
            type="number"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">ยกเลิก</v-btn>
          <v-btn color="primary" :disabled="!canAdd" @click="handleAdd">เพิ่ม</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { useCurrentMonth } from '@/composables/useCurrentMonth'
import { useTransactionStore } from '@/stores/transactions'
import type { Budget, Category } from '@/types'
import { CATEGORY_ICONS, CATEGORY_LABELS, EXPENSE_CATEGORIES } from '@/types'
import { formatCurrency } from '@/utils'

const store = useTransactionStore()
const { currentMonth, displayMonth } = useCurrentMonth()

const showDialog = ref(false)
const newCategory = ref<Category | null>(null)
const newAmount = ref('')

const monthBudgets = computed(() => store.getBudgetsForMonth(currentMonth.value))

const availableCategories = computed(() =>
  EXPENSE_CATEGORIES.filter((c) => !monthBudgets.value.some((b) => b.category === c)),
)

const canAdd = computed(() => {
  const amount = parseFloat(newAmount.value)
  return newCategory.value !== null && !isNaN(amount) && amount > 0
})

function openAddDialog() {
  newCategory.value = null
  newAmount.value = ''
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
}

function handleAdd() {
  if (!canAdd.value || !newCategory.value) return
  const amount = parseFloat(newAmount.value)
  store.setBudget(newCategory.value, currentMonth.value, amount)
  closeDialog()
}

const spent = computed(() =>
  store.transactions
    .filter((t) => t.date.startsWith(currentMonth.value) && t.type === 'expense')
    .reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount
        return acc
      },
      {} as Partial<Record<Category, number>>,
    ),
)

function getPercent(b: Budget): number {
  if (!b.limit) return 0
  return Math.min(100, Math.round(((spent.value[b.category] ?? 0) / b.limit) * 100))
}

function getColor(b: Budget): string {
  const p = getPercent(b)
  if (p >= 100) return 'error'
  if (p >= 80) return 'warning'
  return 'success'
}
</script>
