<template>
  <v-container>
    <!-- hero band -->
    <v-sheet color="ink" rounded="lg" class="hero hero-pattern pa-5 pa-sm-7 mb-4">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
        <div class="d-flex align-center">
          <v-btn
            icon="mdi-chevron-left"
            size="small"
            variant="text"
            aria-label="เดือนก่อนหน้า"
            @click="prevMonth"
          />
          <h1 class="hero-month font-display">{{ displayMonth }}</h1>
          <v-btn
            icon="mdi-chevron-right"
            size="small"
            variant="text"
            aria-label="เดือนถัดไป"
            @click="nextMonth"
          />
        </div>
        <div class="d-flex ga-2">
          <v-btn color="success" prepend-icon="mdi-plus" @click="formRef?.openAdd('income')">
            รายรับ
          </v-btn>
          <v-btn color="error" prepend-icon="mdi-plus" @click="formRef?.openAdd('expense')">
            รายจ่าย
          </v-btn>
        </div>
      </div>

      <div class="hero-label">คงเหลือสุทธิ</div>
      <div
        class="hero-balance font-display num"
        :class="{
          'is-negative': summary.balance < 0,
          'is-zero': summary.balance === 0,
        }"
      >
        {{ formatCurrency(summary.balance) }}
      </div>

      <div class="d-flex ga-8 mt-4">
        <div>
          <span class="hero-sub-label">รายรับ</span>
          <span class="hero-sub-value num hero-income">
            +{{ formatCurrency(summary.totalIncome) }}
          </span>
        </div>
        <div>
          <span class="hero-sub-label">รายจ่าย</span>
          <span class="hero-sub-value num hero-expense">
            −{{ formatCurrency(summary.totalExpense) }}
          </span>
        </div>
      </div>

      <HeroArt class="hero-art" />
    </v-sheet>

    <!-- กราฟ -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-card rounded="lg" border flat>
          <v-card-title class="pa-4 pb-0">รายจ่ายตามหมวด</v-card-title>
          <v-card-text class="pt-2">
            <CategoryChart :expenses="monthExpenseMap" />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card rounded="lg" border flat>
          <v-card-title class="pa-4 pb-0">แนวโน้ม 6 เดือน</v-card-title>
          <v-card-text class="pt-2">
            <TrendChart :transactions="store.transactions" :end-month="currentMonth" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- รายการ -->
    <v-card rounded="lg" border flat>
      <v-card-title class="pa-4">รายการเดือนนี้</v-card-title>
      <TransactionList :transactions="monthTransactions" @edit="formRef?.openEdit($event)" />
    </v-card>

    <TransactionForm ref="formRef" />
    <VoiceEntrySheet
      ref="voiceRef"
      @manual="formRef?.openAdd('expense')"
      @saved="savedSnackbar = true"
      @open-settings="settingsRef?.open()"
    />
    <SettingsDialog ref="settingsRef" />

    <v-fab
      v-if="voiceSupported"
      icon="mdi-microphone"
      color="#C9A227"
      size="large"
      class="voice-fab"
      aria-label="บันทึกด้วยเสียง"
      @click="voiceRef?.open()"
    />

    <v-snackbar v-model="savedSnackbar" timeout="2500" color="success">
      บันทึกรายการแล้ว
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import SettingsDialog from '@/components/settings/SettingsDialog.vue'
import CategoryChart from '@/components/dashboard/CategoryChart.vue'
import HeroArt from '@/components/dashboard/HeroArt.vue'
import TrendChart from '@/components/dashboard/TrendChart.vue'
import TransactionForm from '@/components/transaction/TransactionForm.vue'
import TransactionList from '@/components/transaction/TransactionList.vue'
import VoiceEntrySheet from '@/components/voice/VoiceEntrySheet.vue'
import { useCurrentMonth } from '@/composables/useCurrentMonth'
import { useTransactionStore } from '@/stores/transactions'
import type { Category } from '@/types'
import { formatCurrency } from '@/utils'
import { isVoiceCaptureSupported } from '@/utils/voice'

const store = useTransactionStore()
const { currentMonth, displayMonth, prevMonth, nextMonth } = useCurrentMonth()
const formRef = ref<InstanceType<typeof TransactionForm> | null>(null)
const voiceRef = ref<InstanceType<typeof VoiceEntrySheet> | null>(null)
const settingsRef = ref<InstanceType<typeof SettingsDialog> | null>(null)
const savedSnackbar = ref(false)
const voiceSupported = isVoiceCaptureSupported()

const monthTransactions = computed(() =>
  store.transactions.filter((t) => t.date.startsWith(currentMonth.value)),
)

const summary = computed(() => {
  const totalIncome = monthTransactions.value
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = monthTransactions.value
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
})

const monthExpenseMap = computed(() => {
  const map: Partial<Record<Category, number>> = {}
  monthTransactions.value
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount
    })
  return map
})
</script>

<style scoped>
.voice-fab {
  position: fixed;
  right: 20px;
  bottom: 24px;
  z-index: 1005;
}
</style>
