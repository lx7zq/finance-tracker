import { CATEGORY_LABELS, INCOME_CATEGORIES, type Category, type VoiceDraft } from '@/types'

export const GEMINI_MODEL = 'gemini-3.1-flash-lite'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const TIMEOUT_MS = 20_000

export type GeminiErrorCode = 'unauthorized' | 'quota' | 'network' | 'invalid-response' | 'timeout'

export class GeminiParseError extends Error {
  code: GeminiErrorCode

  constructor(message: string, code: GeminiErrorCode) {
    super(message)
    this.code = code
  }
}

export interface GeminiParseInput {
  text?: string
  audio?: { base64: string; mimeType: string }
}

const CATEGORY_ENUM = Object.keys(CATEGORY_LABELS) as Category[]

function buildPrompt(input: GeminiParseInput): string {
  const source = input.text
    ? `ข้อความที่ผู้ใช้พูด/พิมพ์: "${input.text}"`
    : 'โปรดแปลงไฟล์เสียงที่แนบมา (ผู้ใช้พูดภาษาไทย บอกรายการและจำนวนเงิน)'
  return [
    'คุณเป็นผู้ช่วยบันทึกรายการการเงินภาษาไทย แปลงข้อมูลต่อไปนี้เป็นรายการเดียวเท่านั้น',
    '- type: "income" ถ้าเป็นเงินเข้า (เงินเดือน โบนัส รายรับ ขายของ การลงทุน ฯลฯ) ไม่เช่นนั้น "expense"',
    '- amount: จำนวนเงินหน่วยบาท เป็นตัวเลขมากกว่า 0 เท่านั้น',
    `- category: เลือกเฉพาะค่าจากรายการนี้: ${CATEGORY_ENUM.join(', ')}`,
    '  (รายรับใช้: salary, freelance, investment, other_income | รายจ่ายใช้หมวดอื่นที่เหลือ)',
    '- description: ชื่อรายการสั้น ๆ ภาษาไทย ไม่เกิน 60 ตัวอักษร',
    source,
  ].join('\n')
}

export function normalizeGeminiDraft(raw: unknown): VoiceDraft {
  if (typeof raw !== 'object' || raw === null) {
    throw new GeminiParseError('AI ตอบไม่เข้าใจ ลองอีกครั้ง', 'invalid-response')
  }
  const item = raw as Record<string, unknown>
  const amount = Number(item.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new GeminiParseError('AI ตอบไม่เข้าใจ ลองอีกครั้ง', 'invalid-response')
  }
  const category = typeof item.category === 'string' ? item.category : ''
  if (!(CATEGORY_LABELS as Record<string, unknown>)[category]) {
    throw new GeminiParseError('AI ตอบไม่เข้าใจ ลองอีกครั้ง', 'invalid-response')
  }
  const description = typeof item.description === 'string' ? item.description : ''
  // type ชนะจากหมวด — AI ตอบ type ผิดก็แก้ให้ตรง
  const type = INCOME_CATEGORIES.includes(category as Category) ? 'income' : 'expense'
  return { type, amount, category: category as Category, description }
}

function buildResponseSchema() {
  return {
    type: 'OBJECT',
    properties: {
      type: { type: 'STRING', enum: ['income', 'expense'] },
      amount: { type: 'NUMBER' },
      category: { type: 'STRING', enum: CATEGORY_ENUM },
      description: { type: 'STRING' },
    },
    required: ['type', 'amount', 'category', 'description'],
  }
}

function buildBody(input: GeminiParseInput): string {
  const parts: Array<Record<string, unknown>> = [{ text: buildPrompt(input) }]
  if (input.audio) {
    parts.push({ inlineData: { mimeType: input.audio.mimeType, data: input.audio.base64 } })
  }
  return JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: buildResponseSchema(),
      temperature: 0.1,
    },
  })
}

function extractText(data: unknown): string {
  const candidates = (
    data as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> }
  ).candidates
  const parts = candidates?.[0]?.content?.parts ?? []
  return parts
    .map((p) => (typeof p.text === 'string' ? p.text : ''))
    .join('')
    .trim()
}

export async function callGeminiParse(
  input: GeminiParseInput,
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<VoiceDraft> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetchFn(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: buildBody(input),
      signal: controller.signal,
    })
    if (!res.ok) {
      if (res.status === 429) {
        throw new GeminiParseError('โควต้า Gemini หมด ลองพูดใหม่หรือพิมพ์เอง', 'quota')
      }
      if (res.status >= 500) {
        throw new GeminiParseError('เชื่อมต่อ Gemini ไม่ได้ ตรวจอินเทอร์เน็ต', 'network')
      }
      throw new GeminiParseError('API key ไม่ถูกต้อง ไปตั้งค่าใหม่', 'unauthorized')
    }

    let bodyText: string
    try {
      bodyText = extractText(await res.json())
    } catch {
      throw new GeminiParseError('AI ตอบไม่เข้าใจ ลองอีกครั้ง', 'invalid-response')
    }

    try {
      return normalizeGeminiDraft(JSON.parse(bodyText))
    } catch (err) {
      if (err instanceof GeminiParseError) throw err
      throw new GeminiParseError('AI ตอบไม่เข้าใจ ลองอีกครั้ง', 'invalid-response')
    }
  } catch (err) {
    if (err instanceof GeminiParseError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new GeminiParseError('ใช้เวลานานเกิน ลองใหม่', 'timeout')
    }
    throw new GeminiParseError('เชื่อมต่อ Gemini ไม่ได้ ตรวจอินเทอร์เน็ต', 'network')
  } finally {
    clearTimeout(timer)
  }
}
