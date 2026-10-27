import { describe, expect, it, vi } from 'vitest'

import {
  callGeminiParse,
  GeminiParseError,
  GEMINI_MODEL,
  normalizeGeminiDraft,
} from '@/utils/gemini'
import type { VoiceDraft } from '@/types'

const VALID_DRAFT: VoiceDraft = {
  type: 'expense',
  amount: 45,
  category: 'food',
  description: 'กาแฟ',
}

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as unknown as Response
}

function geminiBody(draft: unknown) {
  return {
    candidates: [{ content: { parts: [{ text: JSON.stringify(draft) }] } }],
  }
}

describe('normalizeGeminiDraft', () => {
  it('draft ครบถูกต้อง → ผ่านตรงตัว', () => {
    expect(normalizeGeminiDraft({ ...VALID_DRAFT })).toEqual(VALID_DRAFT)
  })

  it('amount เป็น string "45" → coerce เป็น 45', () => {
    expect(normalizeGeminiDraft({ ...VALID_DRAFT, amount: '45' }).amount).toBe(45)
  })

  it('amount 0 / ติดลบ / NaN → throw', () => {
    expect(() => normalizeGeminiDraft({ ...VALID_DRAFT, amount: 0 })).toThrow(GeminiParseError)
    expect(() => normalizeGeminiDraft({ ...VALID_DRAFT, amount: -5 })).toThrow(GeminiParseError)
    expect(() => normalizeGeminiDraft({ ...VALID_DRAFT, amount: Number.NaN })).toThrow(
      GeminiParseError,
    )
  })

  it('category นอก enum → throw', () => {
    expect(() => normalizeGeminiDraft({ ...VALID_DRAFT, category: 'food2' })).toThrow(
      GeminiParseError,
    )
  })

  it('type มั่วแต่หมวดถูก → type ชนะจากหมวด (salary → income)', () => {
    expect(normalizeGeminiDraft({ ...VALID_DRAFT, type: 'expense', category: 'salary' }).type).toBe(
      'income',
    )
  })

  it('description หาย → เป็น string ว่าง', () => {
    const draft = normalizeGeminiDraft({
      type: 'expense',
      amount: 45,
      category: 'food',
    })
    expect(draft.description).toBe('')
  })

  it('raw ไม่ใช่ object → throw', () => {
    expect(() => normalizeGeminiDraft('nope')).toThrow(GeminiParseError)
    expect(() => normalizeGeminiDraft(null)).toThrow(GeminiParseError)
  })
})

describe('callGeminiParse', () => {
  it('text input → ส่ง prompt + ไม่มี inlineData + header key + schema ครบ 12 หมวด', async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse(geminiBody(VALID_DRAFT)))

    const draft = await callGeminiParse({ text: 'กาแฟ 45 บาท' }, 'MY_KEY', fetchFn as never)

    expect(draft).toEqual(VALID_DRAFT)
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit]
    expect(url).toContain(GEMINI_MODEL)
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('MY_KEY')
    const body = JSON.parse(init.body as string)
    const parts = body.contents[0].parts as Array<Record<string, unknown>>
    expect(parts.some((p) => typeof p.text === 'string' && p.text.length > 0)).toBe(true)
    expect(parts.some((p) => 'inlineData' in p)).toBe(false)
    const config = body.generationConfig
    expect(config.responseMimeType).toBe('application/json')
    expect(config.responseSchema.properties.type.enum).toEqual(['income', 'expense'])
    expect(config.responseSchema.properties.category.enum).toHaveLength(12)
    expect(config.responseSchema.required).toEqual(['type', 'amount', 'category', 'description'])
  })

  it('audio input → body มี inlineData mimeType/data ตรงที่ส่ง', async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse(geminiBody(VALID_DRAFT)))

    await callGeminiParse(
      { audio: { base64: 'QUJD', mimeType: 'audio/mp4' } },
      'MY_KEY',
      fetchFn as never,
    )

    const [, init] = fetchFn.mock.calls[0] as [string, RequestInit]
    const parts = JSON.parse(init.body as string).contents[0].parts as Array<
      Record<string, unknown>
    > as Array<Record<string, unknown>>
    const audioPart = parts.find((p) => 'inlineData' in p) as
      | { inlineData: { mimeType: string; data: string } }
      | undefined
    expect(audioPart?.inlineData).toEqual({ mimeType: 'audio/mp4', data: 'QUJD' })
  })

  it('status 429 → GeminiParseError quota', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 429 } as unknown as Response)

    await expect(callGeminiParse({ text: 'x' }, 'K', fetchFn as never)).rejects.toMatchObject({
      code: 'quota',
    })
  })

  it('status 400 → GeminiParseError unauthorized', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 400 } as unknown as Response)

    await expect(callGeminiParse({ text: 'x' }, 'K', fetchFn as never)).rejects.toMatchObject({
      code: 'unauthorized',
    })
  })

  it('status 503 (Gemini ล่ม) → network ไม่ใช่ unauthorized', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 503 } as unknown as Response)

    await expect(callGeminiParse({ text: 'x' }, 'K', fetchFn as never)).rejects.toMatchObject({
      code: 'network',
    })
  })

  it('response ไม่มี candidates → invalid-response', async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse({ nothing: true }))

    await expect(callGeminiParse({ text: 'x' }, 'K', fetchFn as never)).rejects.toMatchObject({
      code: 'invalid-response',
    })
  })

  it('fetch reject (เน็ตล้ม) → network', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('network down'))

    await expect(callGeminiParse({ text: 'x' }, 'K', fetchFn as never)).rejects.toMatchObject({
      code: 'network',
    })
  })

  it('AbortError → timeout', async () => {
    const abort = new Error('aborted')
    abort.name = 'AbortError'
    const fetchFn = vi.fn().mockRejectedValue(abort)

    await expect(callGeminiParse({ text: 'x' }, 'K', fetchFn as never)).rejects.toMatchObject({
      code: 'timeout',
    })
  })

  it('AI ตอบ JSON ที่ normalize ไม่ผ่าน → invalid-response', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        okResponse(geminiBody({ type: 'expense', amount: -1, category: 'food', description: 'x' })),
      )

    await expect(callGeminiParse({ text: 'x' }, 'K', fetchFn as never)).rejects.toMatchObject({
      code: 'invalid-response',
    })
  })
})
