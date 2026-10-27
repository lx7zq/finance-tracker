# Voice Entry + Gemini Parse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** บันทึกรายการด้วยเสียงบนมือถือจบในพูดเดียว — FAB ไมค์บนหน้าหลัก → พูด "กาแฟ 45 บาท" → Gemini แปลง+จัดโครง → การ์ดยืนยัน (แก้ได้) → บันทึก

**Architecture:** ต่อยอด Vue 3 SPA เดิม โดยไม่แตะฟอร์มเดิมเลย — FAB ไมค์เปิด bottom sheet ใหม่; เส้นทางเสียง 2 แบบ feature-detect อัตโนมัติ (Chrome: Web Speech API → ข้อความ → Gemini, iOS Safari: MediaRecorder → ไฟล์เสียง → Gemini) เรียก Gemini REST ด้วย `fetch` ตรง (structured output `responseSchema`); ถ้า AI ใช้ไม่ได้ (ไม่มี key / quota / ตอบเพี้ยน) → fallback parser คีย์เวิร์ดไทย; API key อยู่ใน settings store (localStorage)

**Tech Stack:** เหมือนเดิมทุกอย่าง (Vue 3.5 + Vuetify 4 + Pinia + Vitest + bun) + Gemini REST API (`gemini-3.1-flash-lite`) — ไม่เพิ่ม dependency ใด ๆ

**Spec:** อนุมัติใน chat วันที่ 2026-10-27 (ไม่มีไฟล์ spec แยก ตามรูปแบบแผนก่อนหน้า) — ขอบเขตถูกล็อกใน Goal + Global Constraints + การตัดสินใจด้านล่าง แผนนี้**แทนที่** Task 4–5 ของ `2026-10-20-ui-richness-voice-input.md` (ไม่ทำปุ่มไมค์ใน TransactionForm อีกต่อไป — ห้ามแตะ TransactionForm)

## การตัดสินใจที่ล็อกแล้ว

- **ทั้งสองเครื่อง:** Chrome/Android ใช้ Web Speech (`th-TH`) แปลงเสียง→ข้อความฟรี แล้วส่งข้อความให้ Gemini; iPhone/Safari อัดเสียงด้วย MediaRecorder (AAC/mp4) ส่ง base64 เป็น `inlineData` ให้ Gemini แปลง+จัดโครงครั้งเดียว
- **Gemini:** โมเดลคงที่ `gemini-3.1-flash-lite`, endpoint `v1beta:generateContent`, auth ด้วย header `x-goog-api-key`, `responseMimeType: 'application/json'` + `responseSchema` บังคับ `{ type, amount, category, description }`, temperature 0.1, timeout 20s (AbortController)
- **วันที่ = วันนี้เสมอ** (AI ไม่ตัดสินวันที่) — แก้ได้ในการ์ดยืนยัน
- **การ์ดยืนยันก่อนบันทึกทุกรายการ** — แก้ type/amount/category/description/date ได้ตรงการ์ด
- **Fallback ลำดับ:** ไม่มี key → ถ้ามี transcript (Chrome) ใช้ parser คีย์เวิร์ดได้เลย, ถ้าไม่มี transcript (iOS) → error แจ้งให้ตั้ง key; AI fail (401/429/network/invalid) → ถ้ามี transcript ใช้ parser คีย์เวิร์ด, ไม่งั้น error ไทย + ปุ่ม "พิมพ์เอง" เปิดฟอร์มเดิม
- **FAB ไมค์** อยู่ HomeView เดียว มุมขวาล่าง ซ่อนถ้าเบราว์เซอร์ไม่รองรับทั้ง Web Speech และ MediaRecorder
- **API key:** ผู้ใช้ใส่เองผ่าน Settings dialog (เฟืองใน navbar) เก็บ localStorage — ห้าม commit, ห้าม log
- Free tier ของ Gemini ใช้ข้อมูลพัฒนาผลิตภัณฑ์ — บันทึกลับในใจไว้ ไม่เป็นข้อความใน UI

## Global Constraints

- ข้อความ UI ทั้งหมดภาษาไทย
- Style ตาม `.prettierrc.json`: ไม่มี semicolon, single quotes, printWidth 100 — รัน `bun run format` ก่อน commit ทุกครั้ง
- ใช้ path alias `@/` เท่านั้น
- **ห้ามเพิ่ม dependency ใหม่ทุกกรณี** (Gemini ผ่าน REST `fetch`, เสียงใช้ API built-in)
- Structure ตาม pattern เดิม: composable → `src/composables/use*.ts`, pure fn → `src/utils/`, store → `src/stores/`, test → `src/tests/**/*.spec.ts`, component → `src/components/<area>/`
- ทุก task ผ่าน `bun run type-check` ก่อน commit
- **ห้ามเปลี่ยนชื่อ/แตะ:** routes, store actions เดิม, `CATEGORY_LABELS`, `CATEGORY_ICONS`, `CATEGORY_COLORS`, `TransactionForm.vue`, `useTransactionForm.ts`, theme สี ledger
- ห้าม commit หรือ log API key
- jsdom ไม่มี Speech engine / MediaRecorder / getUserMedia — unit test เฉพาะ pure logic + mock ที่ stub เอง; เสียงจริงทดสอบบนเครื่องจริง (Task 7)
- ห้าม mount Vuetify dialog/sheet ใน test — component ผู้ใช้ตรวจภาพเอง (คุมด้วย type-check)

## Review Focus

เงื่อนไขที่ผู้ใช้เจอบ่อยที่สุดแต่ spec ไม่ได้เขียนตรง ๆ — แต่ละข้อมี test กำกับ:

1. **iOS Safari ไม่มี Web Speech** — ต้องเดิน MediaRecorder path และถ้าไม่มี key ต้อง error ไทยแจ้งให้ตั้ง key ไม่ใช่ค้างโหลด → test Task 5
2. **AI ตอบเพี้ยน** (JSON ไม่ครบ / amount ≤ 0 / category นอก enum / amount เป็น string) — `normalizeGeminiDraft` ต้อง coerce หรือ throw เท่านั้น ห้ามปล่อย draft มั่วลง store → test Task 3
3. **401 key ผิด / 429 quota หมด** — ข้อความไทยเฉพาะเรื่อง + phase ต้องออกจาก parsing ไม่ค้าง → test Task 3 + Task 5
4. **ปิด sheet ขณะฟัง/อัด** — ต้อง stop tracks + speech.stop + รีเซ็ต phase ไม่มีไมค์ค้างเปิด → test Task 5
5. **Firefox ไม่รองรับทั้งคู่** — `isVoiceCaptureSupported()` false → FAB ซ่อน ฟอร์มพิมพ์ปกติ → test Task 1

## File Structure

| ไฟล์ | ความรับผิดชอบ |
|---|---|
| `src/types/index.ts` (แก้) | เพิ่ม `VoiceDraft` (ผล parse ก่อนเติมวันที่) |
| `src/utils/voice.ts` (ใหม่) | `parseVoiceEntry` (เลขท้ายประโยค + คีย์เวิร์ด→หมวด), `isVoiceCaptureSupported` |
| `src/utils/gemini.ts` (ใหม่) | `GEMINI_MODEL`, `buildPrompt`, `callGeminiParse` (fetch injectable), `normalizeGeminiDraft`, `GeminiParseError` |
| `src/stores/settings.ts` (ใหม่) | `apiKey` + persist localStorage (pattern เดียวกับ transactions store) |
| `src/composables/useSpeechInput.ts` (ใหม่) | wrapper Web Speech: `supported/listening/interim/errorMessage/start/stop` |
| `src/composables/useVoiceEntry.ts` (ใหม่) | orchestrator: เลือก pipeline, สถานะ, AI→fallback, MediaRecorder lifecycle |
| `src/components/settings/SettingsDialog.vue` (ใหม่) | dialog ใส่/ล้าง API key |
| `src/components/layout/Navbar.vue` (แก้) | เฟืองเปิด SettingsDialog |
| `src/components/voice/VoiceEntrySheet.vue` (ใหม่) | bottom sheet: ไมค์/interim/การ์ดยืนยัน/error + ปุ่มพิมพ์เอง |
| `src/views/HomeView.vue` (แก้) | FAB ไมค์ + mount sheet + snackbar บันทึกแล้ว |
| Tests (ใหม่ 5 ไฟล์) | `voice.spec.ts`, `gemini.spec.ts`, `settings.spec.ts`, `useSpeechInput.spec.ts`, `useVoiceEntry.spec.ts` |

---

### Task 1: ชนิดข้อมูล + parser คีย์เวิร์ด (`VoiceDraft`, `parseVoiceEntry`, `isVoiceCaptureSupported`)

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/utils/voice.ts`
- Test: `src/tests/utils/voice.spec.ts`

**Interfaces:**
- Produces (types/index.ts): `interface VoiceDraft { type: TransactionType; amount: number; category: Category; description: string }`
- Produces (voice.ts):
  - `parseVoiceEntry(text: string): { description: string; amount: number | null; category: Category }` — category ได้จากตารางคีย์เวิร์ด ถ้าไม่เจอ: หมวดรายได้ keyword → หมวดนั้น, ไม่งั้น `other_expense`; type ผู้เรียก derive เองจาก `INCOME_CATEGORIES.includes(category)`
  - `isVoiceCaptureSupported(): boolean` — `'SpeechRecognition' in globalThis || 'webkitSpeechRecognition' in globalThis || (typeof MediaRecorder !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)`

- [ ] **Step 1: เพิ่ม `VoiceDraft` ใน `src/types/index.ts`** (interface 4 ฟิลด์ด้านบน, ต่อท้าย `Budget`)

- [ ] **Step 2: RED — เขียน `src/tests/utils/voice.spec.ts`**

เคส `parseVoiceEntry`:
- `'ข้าวมื้อเที่ยง 120'` → `{ description: 'ข้าวมื้อเที่ยง', amount: 120, category: 'food' }` (คีย์เวิร์ด `มื้อ`)
- `'๑๒๐ บาท'` → `{ description: '', amount: 120, category: 'other_expense' }`
- `'กาแฟ'` → `{ description: 'กาแฟ', amount: null, category: 'food' }`
- `'ตุ๋ม 1,500 บาท'` → `{ description: 'ตุ๋ม', amount: 1500, category: 'other_expense' }`
- `'  '` → `{ description: '', amount: null, category: 'other_expense' }`
- `'ขายของ 250.5'` → `{ description: 'ขายของ', amount: 250.5, category: 'other_income' }`
- `'น้ำมัน 800'` → category `'transport'` (คีย์เวิร์ดตาราง transport ต้องแพ้ก่อน food — ลำดับตารางสำคัญ)
- `'netflix 419'` → category `'entertainment'`
- `'เงินเดือน 15000'` → category `'salary'`

เคส `isVoiceCaptureSupported` (stub ด้วย `vi.stubGlobal` / ลบสิ่งที่ stub): ไม่มีทั้งสาม → `false`; stub `webkitSpeechRecognition` → `true`

- [ ] **Step 3: Run — verify FAIL** (`bun run test:run src/tests/utils/voice.spec.ts` → module ไม่มี)

- [ ] **Step 4: GREEN — implement `src/utils/voice.ts`**

อัลกอริทึมที่กำหนดไว้: แปลงเลขไทย `๐-๙`→`0-9` ก่อน → regex จับท้าย `/([\d,]+(?:\.\d+)?)\s*บาท?\s*$/` → ตัด comma → `Number.parseFloat` → ตัดชิ้นที่จับได้ออกจาก text เหลือ description (trim); ไม่จับได้ → `amount: null`, description = text.trim(); ตาราง `CATEGORY_KEYWORDS: Array<{ category: Category; words: string[] }>` **เรียงลำดับตรวจ substring (case-insensitive, ตัวแรกชนะ)**: `other_income`, `salary`, `freelance`, `investment`, `entertainment` (`หนัง`, `เกม`, `เที่ยว`, `คอนเสิร์ต`, `netflix`, `เน็ตฟลิกซ์`, `สปา`, `นวด`, `ดื่ม`, `เหล้า`, `เบียร์`), `transport` (`แท็กซี่`, `แท็กซิ`, `รถเมล์`, `รถเมล`, `มอเตอร์ไซค์`, `จอดรถ`, `น้ำมัน`, `บีทีเอส`, `bts`, `เอ็มอาร์ที`, `mrt`, `ค่ารถ`, `โดยสาร`, `เดินทาง`, `ทางด่วน`), `food` (`ข้าว`, `กาแฟ`, `ชา`, `อาหาร`, `มื้อ`, `ขนม`, `เค้ก`, `น้ำ`, `บุฟเฟ่ต์`, `หมูกระทะ`, `สุกี้`, `เบเกอรี่`, `ไอศกรีม`), `housing` (`ค่าห้อง`, `ค่าเช่า`, `ค่าไฟ`, `ค่าน้ำ`, `ค่าเน็ต`, `เน็ต`, `โทรศัพท์`, `ค่าซ่อม`), `health` (`ยา`, `หมอ`, `โรงพยาบาล`, `คลินิก`, `ฟัน`, `ฟิตเนส`, `เช็คร่างกาย`, `วัคซีน`), `shopping` (`ช้อป`, `เสื้อ`, `รองเท้า`, `กระเป๋า`, `ซื้อ`, `หวย`, `ล็อตเตอรี่`, `ของฝาก`), `education` (`เรียน`, `คอร์ส`, `หนังสือ`, `สมุด`, `เทอม`) — เหตุผลลำดับ: `netflix/เน็ตฟลิกซ์` ต้องชนะ `เน็ต`, `น้ำมัน` ต้องชนะ `น้ำ`

- [ ] **Step 5: Run — verify PASS** (`bun run test:run src/tests/utils/voice.spec.ts`)

- [ ] **Step 6: `bun run format` + `bun run type-check` ผ่าน → commit `feat/add-voice-keyword-parser`**

---

### Task 2: settings store (API key)

**Files:**
- Create: `src/stores/settings.ts`
- Test: `src/tests/stores/settings.spec.ts`

**Interfaces:**
- Produces: `useSettingsStore` — state `apiKey: string` (default `''`), action `setApiKey(key: string)` (trim ก่อนเก็บ, เก็บ `''` = ล้าง), persist ที่ key `'settings'` เป็น JSON `{ apiKey: string }`; `load()` ที่ store creation — พัง/shape ผิด → เริ่ม `''` ไม่ throw (pattern เดียวกับ transactions store)

- [ ] **Step 1: RED — `src/tests/stores/settings.spec.ts`** (pinia setup แบบ `transactions.spec.ts`)

เคส: `setApiKey('  key123  ')` → state `'key123'` + localStorage `'settings'` มี `{"apiKey":"key123"}`; seed localStorage ก่อนสร้าง store → โหลดได้; localStorage พัง (`'{broken'`) หรือ shape ผิด (`'"str"'`, `{"apiKey":123}`) → `apiKey === ''` ไม่ throw; `setApiKey('')` → ล้าง + persist ว่าง

- [ ] **Step 2: Run — verify FAIL**

- [ ] **Step 3: GREEN — implement `src/stores/settings.ts`** (คัดลอกโครง load/save/guard จาก transactions store)

- [ ] **Step 4: Run — verify PASS**

- [ ] **Step 5: `bun run format` + `bun run type-check` ผ่าน → commit `feat/add-settings-store`**

---

### Task 3: Gemini client (`callGeminiParse`, `normalizeGeminiDraft`)

**Files:**
- Create: `src/utils/gemini.ts`
- Test: `src/tests/utils/gemini.spec.ts`

**Interfaces:**
- Consumes: `VoiceDraft` (Task 1), `Category`/`INCOME_CATEGORIES`/`EXPENSE_CATEGORIES` ที่มีอยู่
- Produces:
  - `const GEMINI_MODEL = 'gemini-3.1-flash-lite'`
  - `class GeminiParseError extends Error { code: 'unauthorized' | 'quota' | 'network' | 'invalid-response' | 'timeout' }` — `message` เป็นข้อความไทยพร้อมแสดงใน UI
  - `interface GeminiParseInput { text?: string; audio?: { base64: string; mimeType: string } }`
  - `function buildPrompt(input: GeminiParseInput): string` — ภาษาไทย: ชี้ว่าต้องแปลงข้อความ/เสียงเป็นรายการการเงิน, จำกัด category เฉพาะ 12 ค่า, หมวดรายได้ vs รายจ่าย, amount เป็นตัวเลข, description สั้นกระชับ
  - `function normalizeGeminiDraft(raw: unknown): VoiceDraft` — coerce: `amount = Number(raw.amount)` ต้อง finite และ > 0, `category` ต้องอยู่ใน 12 หมวด (check กับ `CATEGORY_LABELS`), `type ∈ income|expense`, `description ?? ''` เป็น string; **type ชนะจากหมวด**: ถ้า category ∈ `INCOME_CATEGORIES` → `type = 'income'` ไม่งั้น `'expense'` (เขียนทับ type ที่ AI ตอบมั่วได้); ไม่ผ่าน → throw `GeminiParseError('invalid-response')`
  - `async function callGeminiParse(input: GeminiParseInput, apiKey: string, fetchFn: typeof fetch = fetch): Promise<VoiceDraft>` — สร้าง request body: `contents: [{ parts: [{ text: buildPrompt(input) }, ...(audio ? [{ inlineData: { mimeType, data: base64 } }] : [])] }]`, `generationConfig: { responseMimeType: 'application/json', responseSchema, temperature: 0.1 }` โดย `responseSchema` = OBJECT ที่มี `type` (enum income/expense), `amount` (NUMBER), `category` (enum 12 ค่า), `description` (STRING), required ทั้ง 4; header `x-goog-api-key`; AbortController timeout 20s; อ่านข้อความจาก `candidates[0].content.parts[].text` รวมกัน → `JSON.parse` → `normalizeGeminiDraft`
  - Error mapping: HTTP 400/401/403 → `'unauthorized'` / message `'API key ไม่ถูกต้อง ไปตั้งค่าใหม่'`; 429 → `'quota'` / `'โควต้า Gemini หมด ลองพูดใหม่หรือพิมพ์เอง'`; `fetchFn` throw (รวม AbortError) → `'timeout'` ถ้าเกิดจาก abort ไม่งั้น `'network'` / `'เชื่อมต่อ Gemini ไม่ได้ ตรวจอินเทอร์เน็ต'`; body parse ไม่ได้ / ไม่มี candidates / JSON.parse ไม่ได้ → `'invalid-response'` / `'AI ตอบไม่เข้าใจ ลองอีกครั้ง'`

- [ ] **Step 1: RED — `src/tests/utils/gemini.spec.ts`** (mock `fetchFn` เป็น `vi.fn()` คืน `Response.json(...)`-like object `{ ok, status, json: async () => ... }`)

เคส `normalizeGeminiDraft`: ถูกต้องครบ → draft ตรง; `amount: '45'` → 45; `amount: 0` / `amount: -5` / `amount: NaN` → throw; category `'food2'` → throw; type `'expense'` + category `'salary'` → type ถูกบัณฑิตเป็น `'income'`; description หาย → `''`

เคส `callGeminiParse` (mock fetchFn):
- happy path text: body ที่ส่งมี `text` prompt + ไม่มี `inlineData`, header `x-goog-api-key` = key, `responseMimeType: 'application/json'` และ `responseSchema.properties.category.enum` ครบ 12; response `{ candidates: [{ content: { parts: [{ text: JSON.stringify({ type:'expense', amount:45, category:'food', description:'กาแฟ' }) }] } }] }` → draft ตรง
- happy path audio: body มี `inlineData` mimeType/data ตรงที่ส่ง
- `ok:false, status:429` → throw code `'quota'`
- `ok:false, status:400` → `'unauthorized'`
- response ไม่มี candidates → `'invalid-response'`
- fetchFn throw (reject) → `'network'`
- AbortError (`error.name === 'AbortError'`) → `'timeout'`

- [ ] **Step 2: Run — verify FAIL**

- [ ] **Step 3: GREEN — implement `src/utils/gemini.ts`**

- [ ] **Step 4: Run — verify PASS**

- [ ] **Step 5: `bun run format` + `bun run type-check` ผ่าน → commit `feat/add-gemini-parse-client`**

---

### Task 4: `useSpeechInput` composable (เส้นทาง Chrome)

**Files:**
- Create: `src/composables/useSpeechInput.ts`
- Test: `src/tests/composables/useSpeechInput.spec.ts`

**Interfaces:**
- Produces: `useSpeechInput(handlers: { onFinal: (text: string) => void })` → `{ supported: ComputedRef<boolean>, listening: Ref<boolean>, interim: Ref<string>, errorMessage: Ref<string>, start(): void, stop(): void }`
  - feature-detect `'SpeechRecognition' in globalThis || 'webkitSpeechRecognition' in globalThis` — ไม่รองรับ: `supported` false, `start()` no-op ไม่ throw
  - instance: `lang: 'th-TH'`, `interimResults: true`, `continuous: false`; `onresult`: ไล่ `event.results` จาก `event.resultIndex` — `isFinal` → `onFinal(transcript)` + เคลียร์ `interim`, ไม่งั้นอัปเดต `interim`; `onerror`: map `not-allowed` → `'ไม่ได้รับอนุญาตให้ใช้ไมค์'`, `network` → `'การรับเสียงขัดข้อง ลองใหม่'`, `no-speech` → `'ไม่ได้ยินเสียง'`, อื่น ๆ → `'พูดไม่สำเร็จ ลองใหม่'`; `onend` → `listening = false`
  - `start()`: ถ้าไม่รองรับหรือกำลังฟัง → return; เคลียร์ error แล้ว `rec.start()` (try/catch กลืน error start ซ้ำ), `listening = true`; `stop()`: `rec?.stop()`
  - declare interface `SpeechRecognitionLike` เองในไฟล์ (type ของ window ไม่ครบ); `beforeUnmount` → `stop()` (ทำใน composable เลยด้วย `onScopeDispose`)
- Consumed by: Task 5

- [ ] **Step 1: RED — `src/tests/composables/useSpeechInput.spec.ts`**

เคส (jsdom ไม่มี engine — ทดสอบ feature-detect path เท่านั้น): `vi.stubGlobal` ลบ `SpeechRecognition`/`webkitSpeechRecognition` → `supported === false`, `start()` ไม่ throw, `listening` ยัง false, `errorMessage` ไม่ถูกเซ็ต

- [ ] **Step 2: Run — verify FAIL**

- [ ] **Step 3: GREEN — implement**

- [ ] **Step 4: Run — verify PASS**

- [ ] **Step 5: `bun run format` + `bun run type-check` ผ่าน → commit `feat/add-speech-input-composable`**

---

### Task 5: `useVoiceEntry` orchestrator (สอง pipeline + fallback)

**Files:**
- Create: `src/composables/useVoiceEntry.ts`
- Test: `src/tests/composables/useVoiceEntry.spec.ts`

**Interfaces:**
- Consumes: `parseVoiceEntry`/`isVoiceCaptureSupported` (Task 1), `callGeminiParse`/`GeminiParseError` (Task 3), `useSettingsStore` (Task 2), `useSpeechInput` (Task 4)
- Produces:
  - `type VoiceEntryPhase = 'idle' | 'listening' | 'processing' | 'confirm' | 'error'`
  - `useVoiceEntry()` (ไม่มี argument — การไหลไปฟอร์มพิมพ์เป็นหน้าที่ของ component ผ่าน emit) → `{ supported, phase, interim, draft, errorMessage, hasKey, start(), stopCapture(), cancel(), reset() }`
    - `draft: Ref<VoiceDraft | null>` — การ์ดยืนยันแก้ค่าตรง draft นี้ได้ (component bind v-model)
    - `hasKey` อ่านจาก settings store (component ใช้เปิด dialog ตั้ง key)
    - `start()`: guard ตาม phase (เฉพาะ `idle`/`error`); phase → `listening`; speech path: `speech.start()` กับ `onFinal(text)` → เก็บ transcript แล้ว auto `parse({ text })` เมื่อ speech `onend` (ผ่าน callback ที่ composable จัด); audio path (ไม่มี Web Speech แต่มี MediaRecorder+getUserMedia): `navigator.mediaDevices.getUserMedia({ audio: true })` → เลือก mimeType จาก candidate ที่ `MediaRecorder.isTypeSupported` ผ่าน (`'audio/webm;codecs=opus'`, `'audio/webm'`, `'audio/mp4'`, `''`), เก็บ stream เพื่อ stop tracks ตอนจบ
    - `stopCapture()`: เฉพาะ `listening` — speech: `speech.stop()`; audio: `recorder.stop()` → รวม chunk เป็น Blob → base64 (FileReader `readAsDataURL`, ตัด prefix `data:...;base64,`) → `parse({ audio })`
    - `parse(input: GeminiParseInput)`: phase → `processing`; มี key → `callGeminiParse` → `draft` → phase `confirm`; catch `GeminiParseError`/ไม่มี key → ถ้ามี transcript: `parseVoiceEntry(transcript)` — amount ไม่ null → เติม draft (type derive จาก `INCOME_CATEGORIES`) phase `confirm`, amount null → error `'ไม่เข้าใจยอดเงิน ลองพูดใหม่หรือพิมพ์เอง'`; ไม่มี transcript → error = ข้อความจาก `GeminiParseError.message` (no-key เคส audio: `'ต้องตั้งค่า Gemini API key ก่อนใช้เสียงบนเบราว์เซอร์นี้'`); phase → `error` ทุกทางที่ fail; **ระหว่าง processing ห้าม phase ค้าง** (try/catch/finally ครบ)
    - `cancel()`: หยุดทุกอย่าง (speech.stop + stop tracks + recorder ถ้ามี) แล้ว `reset()`; `reset()`: phase `idle`, draft null, interim '', transcript '', errorMessage ''
    - `supported = isVoiceCaptureSupported()`
- Consumed by: Task 6

- [ ] **Step 1: RED — `src/tests/composables/useVoiceEntry.spec.ts`**

เคส (jsdom default = ไม่มีทั้งสอง engine):
- `supported === false`; `start()` ไม่ throw และ phase ยัง `idle`

stub Web Speech fake class (constructor เก็บ instance ให้ test เรียก `onresult`/`onend` เอง) + pinia settings มี key + mock `callGeminiParse` ด้วย `vi.mock('@/utils/gemini')`:
- speech final `"กาแฟ 45 บาท"` → ระหว่างรอ AI phase `processing`; resolve คืน draft → `confirm`, draft ตรง
- AI throw `GeminiParseError('quota')` ครั้งที่สอง (key ยังมี) → draft มาจาก parser คีย์เวิร์ด (`amount: 45, category: 'food'`) → `confirm`
- ไม่มี key + final `"กาแฟ 45 บาท"` → fallback คีย์เวิร์ด → `confirm` (ไม่เรียก AI)
- ไม่มี key + final `"กาแฟ"` (ไม่มีเลข) → `error` + message `'ไม่เข้าใจยอดเงิน ลองพูดใหม่หรือพิมพ์เอง'`
- `cancel()` ระหว่าง `listening` → phase กลับ `idle`, `interim` เคลียร์

stub MediaRecorder + `navigator.mediaDevices.getUserMedia` (fake stream `getTracks(): [{ stop() }]`) + ไม่มี SpeechRecognition + ไม่มี key:
- `start()` → phase `listening`; `stopCapture()` → phase `error` + message `'ต้องตั้งค่า Gemini API key ก่อนใช้เสียงบนเบราว์เซอร์นี้'` และ fake track ถูก `stop()`

- [ ] **Step 2: Run — verify FAIL**

- [ ] **Step 3: GREEN — implement** (โครงสร้างตาม Interfaces; ระวัง: parse เรียกครั้งเดียวต่อ capture — guard ด้วย flag; `onScopeDispose` → `cancel()`)

- [ ] **Step 4: Run — verify PASS**

- [ ] **Step 5: `bun run format` + `bun run type-check` ผ่าน → commit `feat/add-voice-entry-orchestrator`**

---

### Task 6: Settings dialog + เฟืองใน navbar

**Files:**
- Create: `src/components/settings/SettingsDialog.vue`
- Modify: `src/components/layout/Navbar.vue`

**Interfaces:**
- Produces: `SettingsDialog` — `v-dialog` ภายใน (จัดการ open เอง, `defineExpose({ open })`), ใช้ `useSettingsStore`: `v-text-field` label `'Gemini API Key'` (type password, hint `'เก็บเฉพาะในเบราว์เซอร์นี้'`) bind draft ref, ปุ่ม `'บันทึก'` → `store.setApiKey(draft)` + ปิด, ปุ่ม `'ล้างคีย์'` (แสดงเมื่อมี key) → `setApiKey('')`; ข้อความไทย
- Consumes: Navbar วาง `v-btn icon="mdi-cog-outline"` หลังปุ่มเมนู 3 ตัว → `<SettingsDialog ref>` + `@click="settingsRef?.open()"`

- [ ] **Step 1: สร้าง `SettingsDialog.vue`** (ไม่เขียน test — ตาม convention ไม่ mount dialog; type-check คุม)

- [ ] **Step 2: แก้ Navbar** — เพิ่มปุ่มเฟือง + mount dialog + ref

- [ ] **Step 3: `bun run format` + `bun run type-check` ผ่าน → commit `feat/add-settings-dialog`**

---

### Task 7: VoiceEntrySheet + FAB + เกตเต็ม

**Files:**
- Create: `src/components/voice/VoiceEntrySheet.vue`
- Modify: `src/views/HomeView.vue`

**Interfaces:**
- Consumes: `useVoiceEntry` (Task 5), `useTransactionStore.addTransaction(data: Omit<Transaction,'id'|'createdAt'>)`, `CATEGORY_LABELS`/`INCOME_CATEGORIES`/`EXPENSE_CATEGORIES` (types เดิม), `formatCurrency` (utils เดิม)
- Produces: `VoiceEntrySheet` — `v-bottom-sheet` จัดการ open เอง `defineExpose({ open })`; props ไม่มี; emits `manual` (กด "พิมพ์เอง") และ `saved` (บันทึกสำเร็จ) — ไม่รู้จัก store (คาดว่าผู้เรียกจัดการ)? **ไม่** — ใช้ store ใน sheet โดยตรง (pattern เดียวกับ TransactionForm) และ emit `saved` ให้ HomeView โชว์ snackbar
  - โครง phase-driven กลาง sheet:
    - `idle`: ปุ่มไมค์ใหญ่ (`v-btn icon mdi-microphone` size xlarge) + ข้อความ `'แตะเพื่อพูด'` + ถ้า `!hasKey` แถบเตือนเล็ก `'ต้องตั้งค่า Gemini API key ก่อน (ใช้โหมดคีย์เวิร์ดพื้นฐานได้)'` + ปุ่ม link ไป settings (emit? ไม่ — HomeView มี dialog; sheet emit `open-settings` ให้ HomeView เปิด) — **เพิ่ม emit `open-settings`**
    - `listening`: ปุ่มไมค์สี error (pulse ด้วย CSS class ที่กำหนดในไฟล์) + `'กำลังฟัง… แตะเพื่อหยุด'` + ข้อความ `interim`
    - `processing`: `v-progress-circular` indeterminate + `'กำลังจัดโครงรายการ…'`
    - `confirm`: การ์ดแก้ได้ — `v-btn-toggle` type (รายจ่าย/รายรับ), `v-text-field` amount (type number), `v-select` category (items ตาม type เหมือน TransactionForm), `v-text-field` description, `v-text-field` date (type date, default วันนี้ `dayjs().format('YYYY-MM-DD')`); ปุ่ม `'บันทึก'` → `store.addTransaction({ ...draft, date })` → `reset()` + ปิด + emit `saved`; ปุ่ม `'ยกเลิก'` → `reset()` + ปิด
    - `error`: ข้อความ `errorMessage` + ปุ่ม `'ลองอีกครั้ง'` → `reset()` + เปิดฟังใหม่ (`start()`) + ปุ่ม `'พิมพ์เอง'` → `reset()` + ปิด + emit `manual`
  - watch open→false → `cancel()`
  - การ์ด confirm แก้ type ต้องรีเซ็ต category ให้เข้ากลุ่มใหม่ถ้าลำดับเกวียน (ถ้าเปลี่ยน type และ category อยู่ผิดกลุ่ม → set เป็นตัวแรกของกลุ่ม)
- HomeView: FAB `v-fab icon="mdi-microphone" position="bottom-right" size="large" color="brass-token"` `v-if="voiceSupported"` (จาก `isVoiceCaptureSupported()`), mount sheet, `@manual="formRef?.openAdd('expense')"`, `@saved` → snackbar `'บันทึกรายการแล้ว'` (v-snackbar ใน HomeView), `@open-settings` → เปิด SettingsDialog (mount dialog ใน HomeView ด้วย เพราะ navbar เปิดไม่ได้จาก sheet — ใช้ dialog ตัวเดียวกันแชร์ไม่ได้ต่าง component ก็ mount ซ้ำได้ key state อยู่ที่ store)

- [ ] **Step 1: สร้าง `VoiceEntrySheet.vue`** (ไม่ mount test — type-check + ตรวจภาพ)

- [ ] **Step 2: แก้ HomeView** — FAB + sheet + snackbar + SettingsDialog

- [ ] **Step 3: เกตเต็ม**

```bash
bun run format && bun run test:run && bun run type-check && bun run build
```

Expected: tests ผ่านทั้งหมด (เดิม + 5 ไฟล์ใหม่), type-check ว่าง, build สำเร็จ

- [ ] **Step 4: ตรวจ dev server** boot + curl `/` `/transactions` `/budget` ตอบ 200

- [ ] **Step 5: commit `feat/add-voice-entry-sheet-and-fab` + push `origin dev`**

- [ ] **Step 6: คู่มือทดสอบเครื่องจริงให้ผู้ใช้:**
  1. ตั้ง key: กดเฟือง → วาง API key (สร้างที่ aistudio.google.com) → บันทึก
  2. Android Chrome: กด FAB ไมค์ → พูด "กาแฟ 45 บาท" → เห็นข้อความวิ่ง → การ์ดยืนยัน → บันทึก
  3. iPhone Safari: กด FAB → พูด → แตะหยุด → รอ AI → การ์ดยืนยัน
  4. ลองแบบไม่มี key (ล้างคีย์ก่อน): Chrome ยัง parse คีย์เวิร์ดได้; iOS แจ้งตั้ง key
  5. Firefox: FAB ไม่โผล่ ฟอร์มพิมพ์ปกติ

## หมายเหตุให้ implementer

- jsdom ไม่มี engine จริง — ห้ามเขียน test ที่ต้องการ SpeechRecognition/MediaRecorder จริง; stub เองทุกกรณี
- `webkitSpeechRecognition` ไม่มีใน TypeScript lib — declare interface เอง
- Gemini endpoint + schema คงที่ตาม Task 3 — ห้าม hardcode key ลงโค้ด
- ถ้า Gemini outage จริง — fallback คีย์เวิร์ด + ฟอร์มพิมพ์คือทางรอดหลัก ต้องใช้ได้เสมอ
- แผนเดิม `2026-10-20-ui-richness-voice-input.md` Task 4–5 ยกเลิกแทนที่ด้วยแผนนี้ — อย่าไป implement ปุ่มไมค์ใน TransactionForm ซ้ำ
