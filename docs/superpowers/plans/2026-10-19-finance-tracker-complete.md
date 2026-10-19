# Finance Tracker Complete — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ทำให้ Finance tracker ใช้งานได้จริง: ข้อมูลอยู่รอดหลังรีเฟรช (localStorage โหลดตอนเปิดแอป) + กราฟ dashboard (สัดส่วนรายจ่ายต่อหมวด, แนวโน้ม 6 เดือน) + เลื่อนเดือนในหน้า Dashboard + ปิดช่องโหว่ validation

**Architecture:** Vue 3 SPA เดิม (Vuetify 4 + Pinia + vue-router) — แก้จุดบกพร่องใน store/composable ที่มีอยู่แล้ว, คำนวณข้อมูลกราฟเป็น pure function ใน `src/utils/charts.ts` (unit-test ได้โดยไม่ต้อง mount component), component กราฟเป็น wrapper ของ vue-chartjs ที่รับ prop อย่างเดียว

**Tech Stack:** Vue 3.5 + TypeScript (strict) + Vite 8 + Vuetify 4.1 + Pinia 3 + chart.js 4.5 + vue-chartjs 5.3 + dayjs + Vitest (เพิ่มใหม่) + jsdom, package manager = bun, format = Prettier (`semi: false`, `singleQuote: true`, `printWidth: 100`)

**Spec:** ไม่มีไฟล์ spec — ผู้ใช้ opt-out ช่วง brainstorming ("เริ่มเลย") ขอบเขตจึงถูกล็อกไว้ใน Goal + Global Constraints ของแผนนี้เอง

## Global Constraints

- ข้อความ UI ทั้งหมดภาษาไทย (ยกเว้น label ที่มาจาก `CATEGORY_LABELS` ซึ่งไทยอยู่แล้ว)
- Style ตาม `.prettierrc.json` ของโปรเจกต์: ไม่มี semicolon, single quotes, printWidth 100 — รัน `bun run format` ก่อน commit ทุกครั้ง
- ใช้ path alias `@/` เท่านั้น (ห้าม import แบบ relative ข้าม directory)
- ห้ามเพิ่ม dependency ใหม่นอก `vitest` + `jsdom` (chart.js/vue-chartjs/dayjs มีใน package.json แล้ว)
- โครงสร้างไฟล์ตาม pattern เดิม: store → `src/stores/`, composable → `src/composables/use*.ts`, test → `src/tests/**/*.spec.ts`, component → `src/components/<area>/`
- ทุก task ต้องผ่าน `bun run type-check` (`vue-tsc --build`) ก่อน commit
- Routes, store action names, และ `types/index.ts` ที่มีอยู่ห้ามเปลี่ยนชื่อ (โค้ดเดิม call อยู่)

## Review Focus

เงื่อนไขที่ spec ไม่ได้เขียนตรงๆ แต่คนใช้เจอบ่อยที่สุด — แต่ละข้อมี test กำกับใน task ที่เป็นเจ้าของ:

1. **localStorage เสีย (JSON พัง / เก็บค่าที่ไม่ใช่ array)** — แอปต้องเปิดได้และเริ่มด้วยข้อมูลว่าง ไม่ใช่ crash → test ใน Task 2
2. **จำนวนเงิน = 0, ติดลบ, ไม่ใช่ตัวเลข** — form ต้องไม่ submit และขึ้นข้อความไทย → test ใน Task 3
3. **เลื่อนเดือนข้ามปี** (`2026-01` → prev → `2025-12`) — ต้องคำนวณถูก → test ใน Task 4
4. **ข้อมูลกราฟ 6 เดือน** (เดือนที่ไม่มีรายการ, รายการนอกช่วง 6 เดือน, เดือนซ้ำ) — trend ต้องครบ 6 ช่องและนับถูก → test ใน Task 6
5. **ไม่มีรายจ่ายเลย** (กราฟหมวดว่าง) — `buildCategorySeries` คืนค่าว่าง ไม่ crash; component ต้องมี empty state → test ใน Task 5 + guard ใน component

หมายเหตุ: ไม่มี task ไหน mount กราฟใน test (chart.js ต้องใช้ canvas ซึ่ง jsdom ไม่รองรับ) — ทดสอบเฉพาะ pure function แล้วให้ `type-check` + ตรวจภาพจริงคุม component

## File Structure

| ไฟล์ | ความรับผิดชอบ |
|---|---|
| `src/stores/transactions.ts` (แก้) | เรียก `load()` ตอนสร้าง store + ทนต่อ localStorage พัง |
| `src/tests/stores/transactions.spec.ts` (ใหม่) | พิสูจน์ persistence + corrupted data |
| `vite.config.ts` (แก้) | เพิ่มบล็อก `test` ของ Vitest |
| `package.json` (แก้) | สคริปต์ `test` / `test:run` + devDeps |
| `src/composables/useTransactionForm.ts` (แก้) | validation จำนวนเงิน > 0 |
| `src/tests/composables/useTransactionForm.spec.ts` (ใหม่) | พิสูจน์ validation |
| `src/composables/useCurrentMonth.ts` (แก้) | ลบโค้ดตายท้ายไฟล์ |
| `src/tests/composables/useCurrentMonth.spec.ts` (ใหม่) | พิสูจน์ prev/next ข้ามปี |
| `src/views/HomeView.vue` (แก้) | หัวเดือน (prev/next) + ใส่กราฟ 2 ใบ |
| `src/utils/charts.ts` (ใหม่) | pure functions: `buildCategorySeries`, `buildMonthlyTrend` |
| `src/tests/utils/charts.spec.ts` (ใหม่) | พิสูจน์ทั้ง 2 function |
| `src/components/dashboard/CategoryChart.vue` (ใหม่) | Doughnut รายจ่ายตามหมวด |
| `src/components/dashboard/TrendChart.vue` (ใหม่) | Bar แนวโน้ม 6 เดือน |
| `src/components/ui/StatCard.vue` (แก้) | ใช้ `formatCurrency` ร่วม (ลบโค้ดซ้ำ) |

---

### Task 1: Commit WIP เดิม + ตั้ง Vitest + แก้ store ไม่ยอมโหลด localStorage

**Files:**
- Modify: `package.json` (scripts + devDeps)
- Modify: `vite.config.ts`
- Create: `src/tests/stores/transactions.spec.ts`
- Modify: `src/stores/transactions.ts` (เพิ่มแถวเรียก `load()`)

**Interfaces:**
- Consumes: `Transaction`, `Budget` จาก `@/types`; `load()` ที่มีอยู่แล้วใน store
- Produces: `useTransactionStore()` ที่คืน state ที่โหลดจาก localStorage แล้วทันทีที่สร้าง; คำสั่ง `bun run test:run` ที่ใช้ได้จริง (task ถัดๆ ไปต้องใช้)

- [ ] **Step 1: Commit WIP ที่ค้างอยู่**

```bash
git add -A && git commit -m "feat/add-transactions-and-budget-views"
```

Expected: commit สำเร็จ (ไฟล์ `BudgetView.vue`, `TransactionsView.vue`, store, router, types, composable ที่แก้ค้างอยู่)

- [ ] **Step 2: ติดตั้ง vitest + jsdom**

Run: `bun add -d vitest jsdom`
Expected: ติดตั้งสำเร็จ, `bun.lock` อัปเดต (ถ้ามี warning เรื่อง peer/vite ให้ดูว่า `bunx vitest run` ยังรันได้ — vitest อาจลง vite เวอร์ชันของตัวเองใน nested node_modules ซึ่งไม่เป็นปัญหา)

- [ ] **Step 3: เพิ่มสคริปต์ test ใน `package.json`**

เพิ่ม 2 บรรทัดใน `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: ตั้งค่า Vitest ใน `vite.config.ts`**

เปลี่ยน import เป็น `import { defineConfig } from 'vitest/config'` (แทน `'vite'`) แล้วเพิ่มบล็อก:
```ts
test: {
  environment: 'jsdom',
},
```
ไม่ต้องใช้ `globals` — test จะ import `describe/it/expect` จาก `'vitest'` ตรงๆ (เลี่ยงการแก้ tsconfig)

- [ ] **Step 5: เขียน test ที่ต้อง fail ก่อน — `src/tests/stores/transactions.spec.ts`**

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useTransactionStore } from '@/stores/transactions'
import type { Transaction } from '@/types'

const seedTransaction: Transaction = {
  id: 't1',
  type: 'expense',
  amount: 150,
  category: 'food',
  description: 'ข้าวกลางวัน',
  date: '2026-10-01',
  createdAt: '2026-10-01T00:00:00.000Z',
}

describe('useTransactionStore persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('โหลด transactions และ budgets จาก localStorage ตอนสร้าง store', () => {
    localStorage.setItem('transactions', JSON.stringify([seedTransaction]))
    localStorage.setItem('budgets', JSON.stringify([{ category: 'food', month: '2026-10', limit: 5000 }]))

    const store = useTransactionStore()

    expect(store.transactions).toHaveLength(1)
    expect(store.transactions[0]?.description).toBe('ข้าวกลางวัน')
    expect(store.budgets[0]?.limit).toBe(5000)
  })

  it('ไม่มีข้อมูลใน localStorage → เริ่มว่าง', () => {
    const store = useTransactionStore()

    expect(store.transactions).toEqual([])
    expect(store.budgets).toEqual([])
  })
})
```

- [ ] **Step 6: รัน test ให้เห็น FAIL**

Run: `bun run test:run`
Expected: test แรก FAIL (`toHaveLength(1)` ได้ `0` เพราะ `load()` ไม่เคยถูกเรียก), test ที่สอง PASS

- [ ] **Step 7: เรียก `load()` ตอนสร้าง store**

ใน `src/stores/transactions.ts` เพิ่มคำเรียก `load()` หนึ่งแถว **ก่อน** `return {` บรรทัดสุดท้าย (function declaration ถูก hoist อยู่แล้ว เรียกก่อนนิยามได้)

- [ ] **Step 8: รัน test ให้เห็น PASS**

Run: `bun run test:run`
Expected: PASS ทั้ง 2 tests

- [ ] **Step 9: type-check + format + commit**

Run: `bun run format && bun run type-check && bun run test:run`
Expected: ทั้งสามผ่าน

```bash
git add -A && git commit -m "feat/add-vitest-and-store-persistence-load"
```

---

### Task 2: Store ทนต่อ localStorage พัง

**Files:**
- Test: `src/tests/stores/transactions.spec.ts` (เพิ่ม case)
- Modify: `src/stores/transactions.ts:91-101` (ฟังก์ชัน `load`)

**Interfaces:**
- Consumes: `load()` จาก Task 1
- Produces: พฤติกรรม `load()` — ข้อมูลพังต่อ track (transactions/budgets) ถูกล้างเฉพาะ track นั้น ไม่กระทบอีก track

- [ ] **Step 1: เขียน test ที่ต้อง fail ก่อน — เพิ่มใน describe block เดิม**

```ts
  it('localStorage พังหรือไม่ใช่ array → เริ่มว่าง ไม่โยน error', () => {
    localStorage.setItem('transactions', '{not valid json')
    localStorage.setItem('budgets', '"not-an-array"')

    expect(() => useTransactionStore()).not.toThrow()

    const store = useTransactionStore()
    expect(store.transactions).toEqual([])
    expect(store.budgets).toEqual([])
  })

it('transactions พัง แต่ budgets ยังใช้ได้ → เก็บ budgets ไว้', () => {
  localStorage.setItem('transactions', '{broken')
  localStorage.setItem('budgets', JSON.stringify([{ category: 'food', month: '2026-10', limit: 3000 }]))

  const store = useTransactionStore()

  expect(store.transactions).toEqual([])
  expect(store.budgets[0]?.limit).toBe(3000)
})
```

- [ ] **Step 2: รัน test ให้เห็น FAIL**

Run: `bun run test:run`
Expected: 2 tests ใหม่ FAIL ด้วย `SyntaxError` จาก `JSON.parse`

- [ ] **Step 3: ห่อการ parse ของแต่ละ track แยกกันใน `load()`**

ใน `src/stores/transactions.ts` แก้ `load()` ให้:
- wrap `JSON.parse` ของ transactions และ budgets คนละ `try/catch`
- ใน `catch` ของแต่ละฝั่ง: ตั้ง ref ของฝั่งนั้นเป็น `[]`
- เพิ่มเงื่อนไข `Array.isArray(...)` ก่อน assign (กัน JSON ที่ถูกต้องแต่ไม่ใช่ array)

- [ ] **Step 4: รัน test ให้เห็น PASS**

Run: `bun run test:run`
Expected: PASS ทุก test (รวม 4 tests)

- [ ] **Step 5: type-check + commit**

Run: `bun run format && bun run type-check && bun run test:run`

```bash
git add -A && git commit -m "fix/handle-corrupted-localstorage-in-store"
```

---

### Task 3: validation จำนวนเงิน > 0

**Files:**
- Test: `src/tests/composables/useTransactionForm.spec.ts` (ใหม่)
- Modify: `src/composables/useTransactionForm.ts:16-26` (ฟังก์ชัน `validate`)

**Interfaces:**
- Consumes: `useTransactionForm(onSubmit)` ที่มีอยู่ — `form`, `errors`, `submit`
- Produces: `errors.amount = 'กรุณาระบุจำนวนเงินมากกว่า 0'` เมื่อ amount ≤ 0 หรือไม่ใช่ตัวเลข (ข้อความนี้ถูก pin โดย test)

- [ ] **Step 1: เขียน test ที่ต้อง fail ก่อน — `src/tests/composables/useTransactionForm.spec.ts`**

```ts
import { describe, expect, it } from 'vitest'

import { useTransactionForm } from '@/composables/useTransactionForm'
import type { Transaction } from '@/types'

describe('useTransactionForm', () => {
  function setup() {
    let submitted: Omit<Transaction, 'id' | 'createdAt'> | null = null
    const { form, errors, submit } = useTransactionForm((data) => {
      submitted = data
    })
    form.type = 'expense'
    form.category = 'food'
    return { form, errors, submit, getSubmitted: () => submitted }
  }

  it('จำนวนเงิน 0 หรือติดลบ → ไม่ submit พร้อมข้อความ error', () => {
    const { form, errors, submit, getSubmitted } = setup()

    form.amount = '0'
    submit()
    expect(getSubmitted()).toBeNull()
    expect(errors.amount).toBe('กรุณาระบุจำนวนเงินมากกว่า 0')

    form.amount = '-50'
    submit()
    expect(getSubmitted()).toBeNull()
    expect(errors.amount).toBe('กรุณาระบุจำนวนเงินมากกว่า 0')
  })

  it('จำนวนเงินทศนิยมที่มากกว่า 0 → submit ผ่าน', () => {
    const { form, errors, submit, getSubmitted } = setup()

    form.amount = '100.5'
    submit()

    expect(errors.amount).toBe('')
    expect(getSubmitted()?.amount).toBe(100.5)
  })
})
```

- [ ] **Step 2: รัน test ให้เห็น FAIL**

Run: `bun run test:run`
Expected: test แรก FAIL (`'0'` และ `'-50'` ผ่าน validation ปัจจุบัน), test ที่สอง PASS

- [ ] **Step 3: แก้ `validate()` ใน `useTransactionForm.ts`**

เปลี่ยนการตรวจ amount เป็น: parse `Number(form.amount)` ครั้งเดียว, ปฏิเสธเมื่อ `!form.amount` หรือ `Number.isNaN(value)` หรือ `value <= 0` โดยตั้ง `errors.amount = 'กรุณาระบุจำนวนเงินมากกว่า 0'` (คงข้อความ `errors.category = 'กรุณาเลือกหมวดหมู่'` เดิมไว้)

- [ ] **Step 4: รัน test ให้เห็น PASS**

Run: `bun run test:run`
Expected: PASS ทุก test

- [ ] **Step 5: type-check + commit**

Run: `bun run format && bun run type-check && bun run test:run`

```bash
git add -A && git commit -m "feat/reject-zero-and-negative-amount-in-transaction-form"
```

---

### Task 4: ล้าง composable เดือน + เพิ่ม nav เดือนใน Dashboard

**Files:**
- Test: `src/tests/composables/useCurrentMonth.spec.ts` (ใหม่)
- Modify: `src/composables/useCurrentMonth.ts:25` (ลบบรรทัด call ระดับ module ท้ายไฟล์)
- Modify: `src/views/HomeView.vue` (หัวเรื่องเดือน + ปุ่ม prev/next)

**Interfaces:**
- Consumes: `useCurrentMonth()` → `{ currentMonth, displayMonth, prevMonth, nextMonth }`
- Produces: HomeView ที่ list/summary/กราฟทั้งหมดสะท้อน `currentMonth.value` (ตอนนี้ list กับ summary ผูกอยู่แล้ว — nav จะเปลี่ยนค่าเดียวกัน)

- [ ] **Step 1: เขียน test ที่ต้อง fail ก่อน — `src/tests/composables/useCurrentMonth.spec.ts`**

```ts
import { describe, expect, it } from 'vitest'

import { useCurrentMonth } from '@/composables/useCurrentMonth'

describe('useCurrentMonth', () => {
  it('prevMonth ข้ามปี จาก มกราคม ไป ธันวาคม ของปีก่อนหน้า', () => {
    const { currentMonth, prevMonth } = useCurrentMonth()
    currentMonth.value = '2026-01'

    prevMonth()

    expect(currentMonth.value).toBe('2025-12')
  })

  it('nextMonth ข้ามปี จาก ธันวาคม ไป มกราคม ของปีถัดไป', () => {
    const { currentMonth, nextMonth } = useCurrentMonth()
    currentMonth.value = '2026-12'

    nextMonth()

    expect(currentMonth.value).toBe('2027-01')
  })
})
```

- [ ] **Step 2: รัน test ให้เห็นสถานะปัจจุบัน**

Run: `bun run test:run`
Expected: 2 tests ใหม่ PASS อยู่แล้ว (logic ตัวเลขใน composable ถูก) — ถ้า PASS ให้ถือว่าเป็น regression guard แล้วไปต่อ; ที่ต้องแก้จริงคือโค้ดตายใน Step 3

- [ ] **Step 3: ลบโค้ดระดับ module ท้าย `useCurrentMonth.ts`**

ลบบรรทัด `const { currentMonth, displayMonth, prevMonth } = useCurrentMonth()` ที่อยู่นอก function (ไฟล์นี้มี side effect เรียก composable ตอน import — เป็นของเหลือจาก dev)

- [ ] **Step 4: เพิ่มหัวเดือน + ปุ่ม prev/next ใน `HomeView.vue`**

เพิ่ม div หัวเรื่องระบนสุดของ `<v-container>` (แทนที่ layout ปุ่มเดิม) ประกอบด้วย:
- ซ้าย: `v-btn icon="mdi-chevron-left" size="small" variant="text"` → `@click="prevMonth"`, ตามด้วย `h1.text-h6.font-weight-bold` แสดง `displayMonth`, ตามด้วย `v-btn icon="mdi-chevron-right"` → `@click="nextMonth"`
- ขวา: ปุ่ม "รายรับ"/"รายจ่าย" เดิมที่ `formRef?.openAdd(...)`

ดึง `displayMonth, prevMonth, nextMonth` เพิ่มจาก `useCurrentMonth()` (ตัวเดียวกับ `currentMonth` ที่ใช้อยู่แล้ว — ต้อง destructure จาก call เดียว ห้ามเรียก composable สองครั้ง เพราะ ref คนละตัวกันจะคนละ state)

- [ ] **Step 5: รัน test + type-check + ตรวจภาพ**

Run: `bun run test:run && bun run type-check`
Expected: PASS ทั้งคู่

Run: `bun run dev` แล้วเปิด `/` กดปุ่มลูกศร — เดือนในหัวเรื่อง, รายการ, ยอด 3 การ์ด เปลี่ยนตามกัน

- [ ] **Step 6: Commit**

Run: `bun run format && bun run type-check`

```bash
git add -A && git commit -m "feat/add-month-navigation-to-dashboard-and-cleanup-composable"
```

---

### Task 5: กราฟสัดส่วนรายจ่ายตามหมวด (Doughnut)

**Files:**
- Test: `src/tests/utils/charts.spec.ts` (ใหม่)
- Create: `src/utils/charts.ts`
- Create: `src/components/dashboard/CategoryChart.vue`
- Modify: `src/views/HomeView.vue` (ใส่กราฟ)

**Interfaces:**
- Consumes: `store.expensesByCategory` (มีอยู่แล้ว, `Partial<Record<Category, number>>`), `CATEGORY_LABELS` จาก `@/types`
- Produces:
  - `buildCategorySeries(expenses: Partial<Record<Category, number>>): { labels: string[]; values: number[]; colors: string[] }` — เรียงจากมากไปน้อย, ตัดค่า ≤ 0, ไม่มี key ซ้ำ (map บังคับอยู่แล้ว)
  - `CHART_COLORS: string[]` — palette อย่างน้อย 8 สี
  - `<CategoryChart :expenses="Partial<Record<Category, number>>" />` — มี empty state ของตัวเอง

- [ ] **Step 1: เขียน test ที่ต้อง fail ก่อน — `src/tests/utils/charts.spec.ts`**

```ts
import { describe, expect, it } from 'vitest'

import { buildCategorySeries } from '@/utils/charts'

describe('buildCategorySeries', () => {
  it('เรียงจากมากไปน้อย พร้อม label ไทยและสีครบตามจำนวน', () => {
    const result = buildCategorySeries({ food: 300, transport: 100, housing: 500 })

    expect(result.labels).toEqual(['ที่พัก', 'อาหาร', 'การเดินทาง'])
    expect(result.values).toEqual([500, 300, 100])
    expect(result.colors).toHaveLength(3)
    result.colors.forEach((color) => expect(color).toMatch(/^#/))
  })

  it('ค่าว่างหรือ 0 ทั้งหมด → คืน arrays ว่าง', () => {
    expect(buildCategorySeries({})).toEqual({ labels: [], values: [], colors: [] })
    expect(buildCategorySeries({ food: 0 }).values).toEqual([])
  })
})
```

- [ ] **Step 2: รัน test ให้เห็น FAIL**

Run: `bun run test:run`
Expected: FAIL ด้วย `Cannot find module '@/utils/charts'`

- [ ] **Step 3: สร้าง `src/utils/charts.ts`**

- `CHART_COLORS`: palette 8+ สีที่ตัดกับพื้น Vuetify (เช่น emerald/amber/rose/sky/violet/fuchsia/teal/orange)
- `buildCategorySeries`: `Object.entries` → map `{ category: as Category, value }` → filter `value > 0` → sort `desc` ตาม value → สร้าง `labels` จาก `CATEGORY_LABELS[category]`, `values`, `colors` ด้วย `CHART_COLORS[i % CHART_COLORS.length]`

- [ ] **Step 4: รัน test ให้เห็น PASS**

Run: `bun run test:run`
Expected: PASS ทุก test

- [ ] **Step 5: สร้าง component `src/components/dashboard/CategoryChart.vue`**

- Props: `defineProps<{ expenses: Partial<Record<Category, number>> }>`
- register chart.js: `ChartJS.register(ArcElement, Tooltip, Legend)`
- computed `series = buildCategorySeries(props.expenses)`; ถ้า `values.length === 0` → แสดง `<div>` ข้อความ "ยังไม่มีรายจ่ายในเดือนนี้" แทน chart
- data: `{ labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] }`; options: `cutout: '65%'`, `plugins.legend.position: 'right'`
- ห้ามใส่ fixed height ใน component (ให้ parent กำหนดผ่าน card)

- [ ] **Step 6: ใส่กราฟใน `HomeView.vue`**

เพิ่ม `v-row` ใต้ stat cards: `v-col cols="12" md="6"` ครอบ `v-card rounded="lg" border flat` หัวข้อ "รายจ่ายตามหมวด", ข้างใน `<CategoryChart :expenses="monthExpenseMap" />`
- `monthExpenseMap` = computed ใหม่ใน HomeView: reduce `monthTransactions` ที่ `type === 'expense'` เป็น `Partial<Record<Category, number>>` (ผูกกับเดือนที่เลือกเหมือน list — ห้ามใช้ `store.expensesByCategory` ที่นับทุกเดือน)

- [ ] **Step 7: type-check + ตรวจภาพ + commit**

Run: `bun run format && bun run type-check && bun run test:run`
Expected: ผ่านทั้งหมด

Run: `bun run dev` → เปิด `/` เพิ่มรายจ่ายเดือนนี้ 1-2 รายการ → กราฟโผล่/อัปเดต, ไม่มีรายจ่าย → ข้อความ empty state

```bash
git add -A && git commit -m "feat/add-expense-by-category-doughnut-chart"
```

---

### Task 6: กราฟแนวโน้ม 6 เดือน (Bar)

**Files:**
- Test: `src/tests/utils/charts.spec.ts` (เพิ่ม case)
- Modify: `src/utils/charts.ts` (เพิ่ม `buildMonthlyTrend`)
- Create: `src/components/dashboard/TrendChart.vue`
- Modify: `src/views/HomeView.vue` (ใส่กราฟ)

**Interfaces:**
- Consumes: `Transaction` จาก `@/types`, `monthTransactions`/`currentMonth` ที่ HomeView มีอยู่แล้ว
- Produces:
  - `buildMonthlyTrend(transactions: Transaction[], endMonth: string, months?: number): { month: string; income: number; expense: number }[]` — คืนเรียงเก่า→ใหม่ จำนวน `months` (default 6) ช่อง นับจาก `endMonth` ย้อนหลัง, เดือนที่ไม่มีรายการคือ 0, รายการนอกช่วงไม่นับ
  - `<TrendChart :transactions="Transaction[]" :end-month="string" />` — มี empty state เมื่อทั้ง 6 เดือนยอดรวมเป็น 0

- [ ] **Step 1: เขียน test ที่ต้อง fail ก่อน — เพิ่ม describe `buildMonthlyTrend` ใน `src/tests/utils/charts.spec.ts`**

```ts
import { buildMonthlyTrend } from '@/utils/charts'
import type { Transaction } from '@/types'

function tx(date: string, type: 'income' | 'expense', amount: number): Transaction {
  return {
    id: `tx-${date}-${type}`,
    type,
    amount,
    category: type === 'income' ? 'salary' : 'food',
    description: '',
    date,
    createdAt: date,
  }
}

describe('buildMonthlyTrend', () => {
  const transactions = [
    tx('2026-10-01', 'expense', 100),
    tx('2026-10-05', 'income', 1000),
    tx('2026-09-10', 'expense', 200),
    tx('2026-04-01', 'expense', 999),
  ]

  it('คืน 6 ช่องเรียงเก่า→ใหม่ จบลงที่ endMonth', () => {
    const trend = buildMonthlyTrend(transactions, '2026-10')

    expect(trend).toHaveLength(6)
    expect(trend[0]?.month).toBe('2026-05')
    expect(trend[5]?.month).toBe('2026-10')
  })

  it('นับรายรับ/รายจ่ายถูกต้อง เดือนว่างเป็น 0 และไม่นับรายการนอกช่วง', () => {
    const trend = buildMonthlyTrend(transactions, '2026-10')

    expect(trend[5]).toEqual({ month: '2026-10', income: 1000, expense: 100 })
    expect(trend[4]).toEqual({ month: '2026-09', income: 0, expense: 200 })
    expect(trend[0]).toEqual({ month: '2026-05', income: 0, expense: 0 })
    expect(trend.some((item) => item.month === '2026-04')).toBe(false)
  })
})
```

- [ ] **Step 2: รัน test ให้เห็น FAIL**

Run: `bun run test:run`
Expected: FAIL — `buildMonthlyTrend is not a function` / export ไม่มี

- [ ] **Step 3: เพิ่ม `buildMonthlyTrend` ใน `src/utils/charts.ts`**

ใช้ dayjs: สร้าง array ของ `months` เดือน โดยเดือนสุดท้าย = `endMonth` (`dayjs(`${endMonth}-01`)`), แต่ละช่อง `subtract(i, 'month').format('YYYY-MM')` (i จาก `months-1` ถึง 0 เพื่อเรียงเก่า→ใหม่), แล้ว reduce `transactions` ที่ `date.startsWith(month)` เข้า map `income`/`expense` (parse ด้วย `dayjs` หรือ `t.date.slice(0, 7)` ก็ได้ — คงแบบเดียวทั้งฟังก์ชัน), parameter `months = 6`

- [ ] **Step 4: รัน test ให้เห็น PASS**

Run: `bun run test:run`
Expected: PASS ทุก test

- [ ] **Step 5: สร้าง component `src/components/dashboard/TrendChart.vue`**

- Props: `defineProps<{ transactions: Transaction[]; endMonth: string }>()`
- register: `ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)`
- computed data: `labels` = `trend.map(t => formatMonth(t.month))`, datasets 2 ชุด — "รายรับ" (`backgroundColor: '#10b981'`) และ "รายจ่าย" (`'#ef4444'`)
- options: `plugins.legend.position: 'bottom'`, scales ไม่ต้องซ้อน (grouped default)
- ถ้า `trend` ยอดรวมทั้งหมดเป็น 0 → แสดง `<div>` "ยังไม่มีข้อมูลในช่วง 6 เดือน" แทน chart

- [ ] **Step 6: ใส่กราฟใน `HomeView.vue`**

`v-col cols="12" md="6"` ข้างกับ card กราฟหมวด (Task 5) — หัวข้อ "แนวโน้ม 6 เดือน", `<TrendChart :transactions="store.transactions" :end-month="currentMonth" />` (ใช้ transactions ทั้งหมด เพราะ function กรองเอง; `end-month` ผูก `currentMonth` เพื่อให้ nav เดือนเลื่อนกราฟด้วย)

- [ ] **Step 7: type-check + ตรวจภาพ + commit**

Run: `bun run format && bun run type-check && bun run test:run`
Expected: ผ่านทั้งหมด

Run: `bun run dev` → `/` กราฟ 2 ใบเรียงกัน, เลื่อนเดือน → กราฟแนวโน้มเปลี่ยนตาม, ข้อมูลเดือนที่ไม่มีรายการแสดง 0

```bash
git add -A && git commit -m "feat/add-six-month-trend-bar-chart"
```

---

### Task 7: ลบโค้ดซ้ำ + รันเกตทั้งโปรเจกต์

**Files:**
- Modify: `src/components/ui/StatCard.vue:22-27`
- Verify ทั้งโปรเจกต์

**Interfaces:**
- Consumes: `formatCurrency` จาก `@/utils`
- Produces: ไม่มี interface ใหม่ — output ของ StatCard ต้องเหมือนเดิมทุกตัวอักษร

- [ ] **Step 1: StatCard ใช้ `formatCurrency` ร่วม**

แทนที่ computed `formatted` ที่สร้าง `Intl.NumberFormat` ใหม่ในไฟล์ ด้วย `import { formatCurrency } from '@/utils'` แล้วเรียก `formatCurrency(props.amount)` (ค่าที่คืนเหมือนกันเป๊ะ — `th-TH`/`THB`/`minimumFractionDigits: 0`)

- [ ] **Step 2: รันเกตทั้งโปรเจกต์**

Run: `bun run format && bun run test:run && bun run type-check && bun run build`
Expected: ทั้ง 4 คำสั่งผ่าน — `test:run` ทุก test PASS, `type-check` ไม่มี error, `build` ได้ dist

- [ ] **Step 3: ตรวจภาพรอบสุดท้าย**

Run: `bun run dev`
Expected: ทั้ง 3 หน้า (`/`, `/transactions`, `/budget`) เปิดได้, เพิ่ม/แก้ไข/ลบ รายการทำงาน, รีเฟรชแล้วข้อมูลอยู่, กราฟ 2 ใบแสดงถูกต้อง, nav เดือนเปลี่ยนทุกส่วนบน `/`

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor/use-shared-formatcurrency-in-statcard"
```
