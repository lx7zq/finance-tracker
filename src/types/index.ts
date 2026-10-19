export type TransactionType = 'income' | 'expense'

export type Category =
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'other_income'
  | 'food'
  | 'transport'
  | 'housing'
  | 'entertainment'
  | 'health'
  | 'shopping'
  | 'education'
  | 'other_expense'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: Category
  description: string
  date: string
  createdAt: string
}

export const CATEGORY_LABELS: Record<Category, string> = {
  salary: 'เงินเดือน',
  freelance: 'Freelance',
  investment: 'การลงทุน',
  other_income: 'รายรับอื่นๆ',
  food: 'อาหาร',
  transport: 'การเดินทาง',
  housing: 'ที่พัก',
  entertainment: 'ความบันเทิง',
  health: 'สุขภาพ',
  shopping: 'ช้อปปิ้ง',
  education: 'การศึกษา',
  other_expense: 'รายจ่ายอื่นๆ',
}

// types/index.ts — เพิ่ม
export const CATEGORY_ICONS: Record<Category, string> = {
  salary: '💼',
  freelance: '💻',
  investment: '📈',
  other_income: '💰',
  food: '🍜',
  transport: '🚗',
  housing: '🏠',
  entertainment: '🎮',
  health: '❤️',
  shopping: '🛍️',
  education: '📚',
  other_expense: '📦',
}

export const CATEGORY_COLORS: Record<Category, string> = {
  salary: '#2F7D5C',
  freelance: '#8B6F47',
  investment: '#16241C',
  other_income: '#4A6D8C',
  food: '#C9A227',
  transport: '#4A7C59',
  housing: '#1E5C42',
  entertainment: '#B3453D',
  health: '#5B7B7A',
  shopping: '#A67C52',
  education: '#3D5A4C',
  other_expense: '#7D6B58',
}

export const INCOME_CATEGORIES: Category[] = ['salary', 'freelance', 'investment', 'other_income']

export const EXPENSE_CATEGORIES: Category[] = [
  'food',
  'transport',
  'housing',
  'entertainment',
  'health',
  'shopping',
  'education',
  'other_expense',
]

export interface Budget {
  category: Category
  month: string
  limit: number
}
