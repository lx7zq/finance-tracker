import type { Category } from '@/types'

const THAI_DIGITS: Record<string, string> = {
  '๐': '0',
  '๑': '1',
  '๒': '2',
  '๓': '3',
  '๔': '4',
  '๕': '5',
  '๖': '6',
  '๗': '7',
  '๘': '8',
  '๙': '9',
}

// ลำดับสำคัญ: ตัวแรกที่ substring เจอ ชนะ — netflix ต้องชนะ "เน็ต" (housing), น้ำมัน ต้องชนะ "น้ำ" (food)
const CATEGORY_KEYWORDS: Array<{ category: Category; words: string[] }> = [
  { category: 'other_income', words: ['ขายของ', 'รายรับ', 'ขาย'] },
  { category: 'salary', words: ['เงินเดือน', 'โบนัส'] },
  { category: 'freelance', words: ['freelance', 'ฟรีแลนซ์'] },
  { category: 'investment', words: ['เงินลงทุน', 'ลงทุน', 'หุ้น', 'ดอกเบี้ย'] },
  {
    category: 'entertainment',
    words: [
      'หนัง',
      'เกม',
      'เที่ยว',
      'คอนเสิร์ต',
      'netflix',
      'เน็ตฟลิกซ์',
      'สปา',
      'นวด',
      'ดื่ม',
      'เหล้า',
      'เบียร์',
    ],
  },
  {
    category: 'transport',
    words: [
      'แท็กซี่',
      'แท็กซิ',
      'รถเมล์',
      'รถเมล',
      'มอเตอร์ไซค์',
      'จอดรถ',
      'น้ำมัน',
      'บีทีเอส',
      'bts',
      'เอ็มอาร์ที',
      'mrt',
      'ค่ารถ',
      'โดยสาร',
      'เดินทาง',
      'ทางด่วน',
    ],
  },
  {
    category: 'food',
    words: [
      'ข้าว',
      'กาแฟ',
      'ชา',
      'อาหาร',
      'มื้อ',
      'ขนม',
      'เค้ก',
      'น้ำ',
      'บุฟเฟ่ต์',
      'หมูกระทะ',
      'สุกี้',
      'เบเกอรี่',
      'ไอศกรีม',
    ],
  },
  {
    category: 'housing',
    words: ['ค่าห้อง', 'ค่าเช่า', 'ค่าไฟ', 'ค่าน้ำ', 'ค่าเน็ต', 'เน็ต', 'โทรศัพท์', 'ค่าซ่อม'],
  },
  {
    category: 'health',
    words: ['ยา', 'หมอ', 'โรงพยาบาล', 'คลินิก', 'ฟัน', 'ฟิตเนส', 'เช็คร่างกาย', 'วัคซีน'],
  },
  {
    category: 'shopping',
    words: ['ช้อป', 'เสื้อ', 'รองเท้า', 'กระเป๋า', 'ซื้อ', 'หวย', 'ล็อตเตอรี่', 'ของฝาก'],
  },
  {
    category: 'education',
    words: ['เรียน', 'คอร์ส', 'หนังสือ', 'สมุด', 'เทอม'],
  },
]

const TRAILING_NUMBER_RE = /([\d,]+(?:\.\d+)?)\s*(?:บาท)?\s*$/

function toArabicDigits(text: string): string {
  return text.replace(/[๐-๙]/g, (d) => THAI_DIGITS[d] ?? d)
}

function detectCategory(text: string): Category {
  const lowered = text.toLowerCase()
  for (const { category, words } of CATEGORY_KEYWORDS) {
    if (words.some((w) => lowered.includes(w))) return category
  }
  return 'other_expense'
}

export function parseVoiceEntry(text: string): {
  description: string
  amount: number | null
  category: Category
} {
  const normalized = toArabicDigits(text.trim())
  if (!normalized) {
    return { description: '', amount: null, category: 'other_expense' }
  }

  const match = TRAILING_NUMBER_RE.exec(normalized)
  let amount: number | null = null
  let description = normalized

  if (match && match[1]) {
    const parsed = Number.parseFloat(match[1].replace(/,/g, ''))
    if (Number.isFinite(parsed)) amount = parsed
    description = normalized.slice(0, match.index ?? 0).trim()
  }

  return { description, amount, category: detectCategory(normalized) }
}

export function isVoiceCaptureSupported(): boolean {
  const hasSpeech = 'SpeechRecognition' in globalThis || 'webkitSpeechRecognition' in globalThis
  const hasRecorder =
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  return hasSpeech || hasRecorder
}
